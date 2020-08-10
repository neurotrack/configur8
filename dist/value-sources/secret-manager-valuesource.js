"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const aws_1 = require("../lib/aws");
const logger_1 = require("../lib/logger");
const value_injector_1 = require("../value-injector/value-injector");
/**
 * Coordinates the lookup of a secret for the secret arn provided.
 */
class AWSSecretManagerValueSource {
    constructor(parentLogger) {
        this.secretsManager = new aws_sdk_1.SecretsManager({
            apiVersion: '2017-10-17',
            region: aws_1.AWSFacade.getRegion(),
            credentials: aws_1.AWSFacade.getCredentials()
        });
        this.secretBundles = new Map();
        this.logger = parentLogger ? parentLogger.child('AWSSecretManagerValueSource') : new logger_1.Logger('AWSSecretManagerValueSource');
    }
    /**
     * What prefix this value source wil involve itself in.
     */
    getPrefix() {
        return 'aws-secretsmanager';
    }
    /**
     * Resolves the named value to a specific value within a bundle, and returns it.
     *
     * @param named
     */
    getValue(nameARN) {
        this.logger.debug(`getValue(${nameARN}) -->`);
        const valueARN = new value_injector_1.ValueRN(nameARN);
        const bundle = this.getSecretsBundle(valueARN.valueName);
        if (!valueARN.subValueName)
            throw `The secret mapping for ${valueARN.prefix}:${valueARN.getValuePattern()} is missing the final value, separated by a :, to choose which secret value to return from the bundle.`;
        return bundle.getValue(valueARN.subValueName)
            .then((value) => {
            this.logger.debug(`getValue(${nameARN}) <-- ==== ${value}`);
            return value;
        });
    }
    /**
     * Returns the existing or creates a new SecretBundle for the
     * bundle name provided.
     *
     * @param bundleName of the secrets to return.
     */
    getSecretsBundle(bundleName) {
        let bundle = this.secretBundles.get(bundleName);
        if (!bundle) {
            bundle = new SecretBundle(this.logger, bundleName, this.secretsManager);
        }
        return bundle;
    }
}
exports.default = AWSSecretManagerValueSource;
/**
 * Wraps around a specific collection of secrets.
 */
class SecretBundle {
    constructor(parentLogger, bundleName, secretsManager) {
        this.bundleName = bundleName;
        this.logger = parentLogger.child(`SecretBundle[${this.bundleName}]`);
        this.secrets = secretsManager
            .getSecretValue({
            SecretId: bundleName
        })
            .promise()
            .then((response) => {
            if (response instanceof Error) {
                this.logger.error(`\n\n\nProblem getting bundle ${this.bundleName}\n\n\n`);
                throw response;
            }
            const secretString = response.SecretString;
            this.logger.debug('The secret bundle was loaded', { secretString });
            try {
                return secretString ? JSON.parse(secretString) : null;
            }
            catch (error) {
                return Promise.reject(`The secret bundle ${this.bundleName} is not in a JSON form, or has invalid JSON and could not be parsed.`);
            }
        })
            .catch((error) => {
            this.logger.error(`Problem getting bundle ${this.bundleName}`, error);
            return Promise.reject(error);
        });
    }
    /**
     *
     * @param name of the value within the secret bundle to return.
     */
    getValue(valueName) {
        this.logger.debug(`getValue(${valueName}) -->`);
        return this.secrets
            .then((secrets) => {
            this.logger.debug(`getValue(${valueName}) <--`, secrets);
            return secrets[valueName];
        });
    }
}
