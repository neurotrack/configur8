import { Credentials } from 'aws-sdk';
import { CredentialsOptions } from 'aws-sdk/lib/credentials';
/**
 * Wrapper around the high level AWS needs like creating credentials or
 * returning the configured region.
 */
export declare class AWSFacade {
    private static DEFAULT_REGION_KEY;
    private static REGION_KEY;
    private static PROFILE_KEY;
    private static KEY_ID_KEY;
    private static ACCESS_KEY_KEY;
    private static SESSION_TOKEN_KEY;
    private static ALLOW_INVALID_CERTS_KEY;
    private static CERTS_PATH;
    private static isInitialized;
    private static logger;
    private static initialization;
    constructor();
    /**
     * Returns AWS Credentials based on the environment configurations
     * for AWS.
     */
    static getCredentials(): Credentials | CredentialsOptions | null | undefined;
    /**
     * Returns the currently configured region
     */
    static getRegion(): string | undefined;
    static init(): Promise<void>;
}
