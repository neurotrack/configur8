"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const aws_1 = require("../lib/aws");
const logger_1 = require("../lib/logger");
const value_injector_1 = require("../value-injector/value-injector");
/**
 * Coordinates the lookup of a secret for the secret arn provided.
 */
class AWSParameterStoreValueSource {
    constructor(parentLogger) {
        this.ssm = new aws_sdk_1.SSM({
            apiVersion: '2017-10-17',
            region: aws_1.AWSFacade.getRegion(),
            credentials: aws_1.AWSFacade.getCredentials()
        });
        this.parameterCache = new Map();
        this.logger = parentLogger ? parentLogger.child('AWSParameterStoreValueSource') : new logger_1.Logger('AWSParameterStoreValueSource');
    }
    /**
     * What prefix this value source wil involve itself in.
     */
    getPrefix() {
        return 'aws-parameterstore';
    }
    /**
     * Resolves the named value to a specific value within a bundle, and returns it.
     *
     * @param named
     */
    getValue(nameARN) {
        this.logger.debug('getValue() --> ', { nameARN });
        const valueARN = new value_injector_1.ValueRN(nameARN);
        const value = this.parameterCache.get(valueARN.valueName);
        this.logger.debug('getValue() valueARN', { valueARN });
        if (value)
            return Promise.resolve(value);
        try {
            return this.ssm
                .getParameter({
                Name: valueARN.valueName,
                WithDecryption: true
            })
                .promise()
                .then((response) => {
                if (response instanceof Error)
                    throw response;
                const parameter = response.Parameter;
                if (!parameter) {
                    this.logger.debug(`getValue() <-- ${nameARN} No values in parameter`, parameter);
                    return undefined;
                }
                this.logger.debug(`getValue() <-- ${nameARN}`, { 'parameter.Value': parameter.Value });
                return parameter.Value;
            })
                .catch((error) => {
                this.logger.error('getValue() <-- Error on', { nameARN });
                return Promise.reject(error);
            });
        }
        catch (error) {
            this.logger.error('getValue() <-- Exception on', { nameARN });
            throw error;
        }
    }
}
exports.default = AWSParameterStoreValueSource;
