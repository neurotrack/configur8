"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AWS = require("aws-sdk");
const https = require("https");
const fs = require("fs");
const logger_1 = require("./logger");
/**
 * Wrapper around the high level AWS needs like creating credentials or
 * returning the configured region.
 */
class AWSFacade {
    constructor() {
    }
    /**
     * Returns AWS Credentials based on the environment configurations
     * for AWS.
     */
    static getCredentials() {
        return AWS.config.credentials;
    }
    /**
     * Returns the currently configured region
     */
    static getRegion() {
        this.init();
        const region = process.env[this.REGION_KEY] || process.env[this.DEFAULT_REGION_KEY];
        AWS.config.region = region;
        return AWS.config.region;
    }
    static init() {
        if (!this.isInitialized && !this.initialization) {
            this.logger.info('init() Not initialized -->');
            AWS.config.apiVersion = '2017-10-17';
            const rejectUnauthorized = (process.env[this.ALLOW_INVALID_CERTS_KEY] !== '1'
                &&
                    process.env[this.ALLOW_INVALID_CERTS_KEY] !== 'true');
            const caCertsPath = process.env[this.CERTS_PATH];
            let certs = undefined;
            if (caCertsPath) {
                certs = [
                    fs.readFileSync(caCertsPath)
                ];
            }
            this.logger.info('init()', { rejectUnauthorized, certs });
            const accessKeyId = process.env[this.KEY_ID_KEY];
            const secretAccessKey = process.env[this.ACCESS_KEY_KEY];
            const sessionToken = process.env[this.SESSION_TOKEN_KEY];
            AWS.CredentialProviderChain.defaultProviders = [
                function () { return new AWS.EnvironmentCredentials('AWS'); },
                function () { return new AWS.EnvironmentCredentials('AMAZON'); },
                function () {
                    if (!!accessKeyId && !!secretAccessKey) {
                        return new AWS.Credentials({ accessKeyId, secretAccessKey, sessionToken });
                    }
                    else {
                        return new AWS.SharedIniFileCredentials({ profile: process.env[AWSFacade.PROFILE_KEY] || 'default' });
                    }
                },
                function () {
                    if (process.env['AWS_CONTAINER_CREDENTIALS_RELATIVE_URI']) {
                        return new AWS.ECSCredentials();
                    }
                    else {
                        return new AWS.EC2MetadataCredentials();
                    }
                }
            ];
            this.logger.info('init() defaultProviders');
            /*
            * @see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/node-registering-certs.html
            */
            AWS.config.update({
                httpOptions: {
                    agent: new https.Agent({
                        rejectUnauthorized,
                        ca: certs
                    })
                }
            });
            return new Promise((resolve, reject) => {
                const chain = new AWS.CredentialProviderChain();
                chain.resolve((err, cred) => {
                    if (err) {
                        this.logger.error('init() error initializing <--', err);
                        reject(err);
                    }
                    else {
                        this.logger.info('init() initialized <--');
                        AWS.config.credentials = cred;
                        resolve();
                    }
                });
            });
        }
        else if (this.initialization) {
            this.logger.info('init() Returning initialization promise.');
            return this.initialization;
        }
        else {
            this.logger.info('init() initialized <--');
            return Promise.resolve();
        }
    }
}
AWSFacade.DEFAULT_REGION_KEY = 'AWS_DEFAULT_REGION';
AWSFacade.REGION_KEY = 'AWS_REGION';
AWSFacade.PROFILE_KEY = 'AWS_PROFILE';
AWSFacade.KEY_ID_KEY = 'AWS_ACCESS_KEY_ID';
AWSFacade.ACCESS_KEY_KEY = 'AWS_SECRET_ACCESS_KEY';
AWSFacade.SESSION_TOKEN_KEY = 'AWS_SESSION_TOKEN';
AWSFacade.ALLOW_INVALID_CERTS_KEY = 'AWS_HTTPS_ALLOW_INVALID_CERTS';
AWSFacade.CERTS_PATH = 'AWS_HTTPS_CERTS_PATH';
AWSFacade.isInitialized = false;
AWSFacade.logger = new logger_1.Logger('AWSFacade');
exports.AWSFacade = AWSFacade;
