import { AWSError, SecretsManager } from 'aws-sdk';
import { PromiseResult }            from 'aws-sdk/lib/request';
import { GetSecretValueResponse }   from 'aws-sdk/clients/secretsmanager';
import { AWSFacade }                from '../lib/aws';
import { ValueSource }              from './value-source-service';
import { Logger }                   from '../lib/logger';
import { ValueRN }                  from '../value-injector/value-injector';


/**
 * Coordinates the lookup of a secret for the secret arn provided.
 */
export default class AWSSecretManagerValueSource implements ValueSource {
  
  private secretsManager:SecretsManager;
  private secretBundles:Map<string,SecretBundle>;
  private logger:Logger;

  constructor(parentLogger?:Logger) {
    this.secretsManager = new SecretsManager({
      apiVersion: '2017-10-17',
      region: AWSFacade.getRegion(),
      credentials: AWSFacade.getCredentials()
    });
    this.secretBundles = new Map();
    this.logger = parentLogger ? parentLogger.child('AWSSecretManagerValueSource') : new Logger('AWSSecretManagerValueSource');
  }

  /**
   * What prefix this value source wil involve itself in.
   */
  public getPrefix():string {
    return 'aws-secretsmanager';
  }

  /**
   * Resolves the named value to a specific value within a bundle, and returns it.
   * 
   * @param named 
   */
  public getValue(nameARN:string):Promise<string>{

    this.logger.debug(`getValue(${nameARN}) -->`);

    const valueARN:ValueRN    = new ValueRN(nameARN);
    const bundle:SecretBundle = this.getSecretsBundle(valueARN.valueName);

    if(!valueARN.subValueName) throw `The secret mapping for ${valueARN.prefix}:${valueARN.getValuePattern()} is missing the final value, separated by a :, to choose which secret value to return from the bundle.`;

    return bundle.getValue(valueARN.subValueName)
      .then( (value:string) => {
        this.logger.debug(`getValue(${nameARN}) <-- ==== ${value}`);
        return value;
      })
  }

  /**
   * Returns the existing or creates a new SecretBundle for the
   * bundle name provided.
   * 
   * @param bundleName of the secrets to return.
   */
  private getSecretsBundle(bundleName:string):SecretBundle {
    let bundle:SecretBundle | undefined = this.secretBundles.get(bundleName);
    
    if(!bundle) {
      bundle = new SecretBundle(this.logger, bundleName, this.secretsManager);
    }
    
    return bundle;
  }
} 

/**
 * Wraps around a specific collection of secrets.
 */
class SecretBundle {
  
  private secrets: Promise<any>;
  private bundleName: string;
  private logger: Logger;

  constructor(parentLogger:Logger, bundleName:string, secretsManager:SecretsManager){
    this.bundleName = bundleName;
    this.logger     = parentLogger.child(`SecretBundle[${this.bundleName}]`);
    this.secrets    = secretsManager
      .getSecretValue({
          SecretId: bundleName
      })
      .promise()
      .then( (response:PromiseResult<GetSecretValueResponse, AWSError>) => {
          if (response instanceof Error) {
              this.logger.error(`\n\n\nProblem getting bundle ${this.bundleName}\n\n\n`)
              throw response;
          }
          const secretString:string | undefined = (<GetSecretValueResponse>response).SecretString;
          this.logger.debug('The secret bundle was loaded',{secretString});
          try{
              return secretString ? JSON.parse(secretString) : null;
          } catch(error) {
              return Promise.reject(`The secret bundle ${this.bundleName} is not in a JSON form, or has invalid JSON and could not be parsed.`);
          }
      })
      .catch( (error) => {
        this.logger.error(`Problem getting bundle ${this.bundleName}`,error);
        return Promise.reject(error);
      })
  }

  /**
   * 
   * @param name of the value within the secret bundle to return.
   */
  public getValue(valueName:string):Promise<string> {
      this.logger.debug(`getValue(${valueName}) -->`);
      return this.secrets
          .then( (secrets:any) => {
            this.logger.debug(`getValue(${valueName}) <--`, secrets);
            return secrets[valueName];
          })
  }
}