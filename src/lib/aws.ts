import * as AWS        from 'aws-sdk';
import * as https      from 'https';
import * as fs         from 'fs';
import { Logger }      from './logger';
import { Credentials } from 'aws-sdk';
import { CredentialsOptions } from 'aws-sdk/lib/credentials';


/**
 * Wrapper around the high level AWS needs like creating credentials or
 * returning the configured region.
 */
export class AWSFacade {

    private static DEFAULT_REGION_KEY:string      = 'AWS_DEFAULT_REGION';
    private static REGION_KEY:string              = 'AWS_REGION';
    private static PROFILE_KEY:string             = 'AWS_PROFILE';
    private static KEY_ID_KEY:string              = 'AWS_ACCESS_KEY_ID';
    private static ACCESS_KEY_KEY:string          = 'AWS_SECRET_ACCESS_KEY';
    private static SESSION_TOKEN_KEY:string       = 'AWS_SESSION_TOKEN';
    private static ALLOW_INVALID_CERTS_KEY:string = 'AWS_HTTPS_ALLOW_INVALID_CERTS';
    private static CERTS_PATH:string              = 'AWS_HTTPS_CERTS_PATH';
    private static isInitialized:boolean          = false;
    private static logger:Logger                  = new Logger('AWSFacade')
    private static initialization:Promise<void>;

    constructor(){
    }

    /**
     * Returns AWS Credentials based on the environment configurations
     * for AWS.
     */
    public static getCredentials(): Credentials | CredentialsOptions | null | undefined {
      return AWS.config.credentials;
    }

    /**
     * Returns the currently configured region
     */
    public static getRegion(){
        this.init();
        const region = process.env[this.REGION_KEY] || process.env[this.DEFAULT_REGION_KEY];
        AWS.config.region = region;
        return AWS.config.region;
    }

    public static init(): Promise<void>{
        if(!this.isInitialized && !this.initialization){

            this.logger.info('init() Not initialized -->');

            AWS.config.apiVersion = '2017-10-17';            

            const rejectUnauthorized:boolean = 
                (
                  process.env[this.ALLOW_INVALID_CERTS_KEY] !== '1' 
                  &&
                  process.env[this.ALLOW_INVALID_CERTS_KEY] !== 'true'
                );

            const caCertsPath:string | undefined = process.env[this.CERTS_PATH];
            let   certs:any[] | undefined        = undefined;
            
            if(caCertsPath){
              certs = [
                fs.readFileSync(caCertsPath)
              ];
            }
            
            this.logger.info('init()',{rejectUnauthorized,certs});

            const accessKeyId:string | undefined     = process.env[this.KEY_ID_KEY];
            const secretAccessKey:string | undefined = process.env[this.ACCESS_KEY_KEY];
            const sessionToken:string | undefined    = process.env[this.SESSION_TOKEN_KEY];

            AWS.CredentialProviderChain.defaultProviders = [
              function () { return new AWS.EnvironmentCredentials('AWS'); },
              function () { return new AWS.EnvironmentCredentials('AMAZON'); },
              function(){
                if(!!accessKeyId && !!secretAccessKey) {
                  return new AWS.Credentials({ accessKeyId, secretAccessKey, sessionToken  });
                } else {
                  return new AWS.SharedIniFileCredentials({ profile: process.env[AWSFacade.PROFILE_KEY] || 'default' });
                }
              },
              function () {
                  if(process.env['AWS_CONTAINER_CREDENTIALS_RELATIVE_URI']){
                      return new AWS.ECSCredentials();
                  } else {
                      return new AWS.EC2MetadataCredentials();
                  }
              }
            ]
          
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


            return new Promise( (resolve,reject) => {

                const chain = new AWS.CredentialProviderChain();

                chain.resolve((err, cred)=>{
                    if(err) {
                        this.logger.error('init() error initializing <--',err);
                        reject(err);
                    } else {
                        this.logger.info('init() initialized <--');
                        AWS.config.credentials = cred;
                        resolve();
                    }
                })
            });

        } else if(this.initialization) {
            this.logger.info('init() Returning initialization promise.');
            return this.initialization;
        } else {
            this.logger.info('init() initialized <--');
            return Promise.resolve();
        }
    }
}