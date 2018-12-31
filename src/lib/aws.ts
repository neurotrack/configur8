import * as AWS        from 'aws-sdk';
import { Credentials } from 'aws-sdk';

/**
 * Wrapper around the high level AWS needs like creating credentials or
 * returning the configured region.
 */
export class AWSFacade {

    private static DEFAULT_REGION_KEY:string = 'AWS_DEFAULT_REGION';
    private static REGION_KEY:string         = 'AWS_REGION';
    private static PROFILE_KEY:string        = 'AWS_PROFILE';
    private static KEY_ID_KEY:string         = 'AWS_ACCESS_KEY_ID';
    private static ACCESS_KEY_KEY:string     = 'AWS_SECRET_ACCESS_KEY';
    private static SESSION_TOKEN_KEY:string  = 'AWS_SESSION_TOKEN';

    constructor(){
    }

    /**
     * Returns AWS Credentials based on the environment configurations
     * for AWS.
     */
    public static getCredentials():Credentials {

        const profile:string | undefined = process.env[this.PROFILE_KEY];
        if(!!profile) return new AWS.SharedIniFileCredentials({ profile });

        const accessKeyId:string | undefined     = process.env[this.KEY_ID_KEY];
        const secretAccessKey:string | undefined = process.env[this.ACCESS_KEY_KEY];
        const sessionToken:string | undefined    = process.env[this.SESSION_TOKEN_KEY];

        if(!!accessKeyId && !!secretAccessKey) return new AWS.Credentials({ 
            accessKeyId, secretAccessKey, sessionToken 
        });

        throw Error('AWS Credentials are missing.');
    }

    /**
     * Returns the currently configured region
     */
    public static getRegion(){
        return process.env[this.REGION_KEY] || process.env[this.DEFAULT_REGION_KEY];
    }
}