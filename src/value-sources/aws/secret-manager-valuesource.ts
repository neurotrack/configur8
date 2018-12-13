import { AWSError, Credentials, SecretsManager }  from 'aws-sdk';
import { PromiseResult }                          from 'aws-sdk/lib/request';
import { GetSecretValueResponse }                 from 'aws-sdk/clients/secretsmanager';
import { AWSFacade }                              from './aws';
import { ValueSource }                            from '../factory';


/**
 * Coordinates the lookup of a secret for the secret arn provided.
 */
export class AWSSecretManagerValueSource implements ValueSource {
  
  private secretsManager:SecretsManager;
  private secretBundles:Map<string,SecretBundle>;

  constructor() {
    this.secretsManager = new SecretsManager({
      apiVersion: '2017-10-17',
      region: AWSFacade.getRegion(),
      credentials: AWSFacade.getCredentials()
    });
    this.secretBundles = new Map();
  }

  /**
   * Resolves the named value to a specific value within a bundle, and returns it.
   * 
   * @param named 
   */
  public getValue(named:string):Promise<string>{
    const valueARN:SecretValueARN = new SecretValueARN(named);
    const bundle:SecretBundle     = this.getSecretsBundle(valueARN.bundleName);
    return bundle.getValue(valueARN.valueName);
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
      bundle = new SecretBundle(bundleName,this.secretsManager);
    }
    
    return bundle;
  }
} 

/**
 * Wrapper around the secret ARN provided when retrieving the secret.
 */
class SecretValueARN {

  public type:string;
  public bundleName:string;
  public valueName:string;

  constructor(arn:string) {
    const parts:string[] = arn.split(':');

    this.type       = parts[0];
    this.bundleName = parts[1];
    this.valueName  = parts[2];
  }
}

/**
 * Wraps around a specific collection of secrets.
 */
class SecretBundle {
  
  private secrets:Promise<any>;
  private bundleName:string;

  constructor(bundleName:string, secretsManager:SecretsManager){
    this.bundleName = bundleName;
    this.secrets    = secretsManager
      .getSecretValue({
        SecretId: bundleName
      })
      .promise()
      .then( (response:PromiseResult<GetSecretValueResponse, AWSError>) => {
        if (response instanceof Error) throw response;
        const secretString:string | undefined = (<GetSecretValueResponse>response).SecretString;
        try{
          return secretString ? JSON.parse(secretString) : null;
        } catch(error) {
          return Promise.reject(`The secret bundle ${this.bundleName} is not in a JSON form, or has invalid JSON and could not be parsed.`);
        }
      })
  }

  /**
   * 
   * @param name of the value within the secret bundle to return.
   */
  public getValue(valueName:string):Promise<string> {
    return this.secrets.then( (secrets:any) => {
      if(!secrets[valueName]) return Promise.reject(`There was no value found for secret: ${this.bundleName}:${valueName}`);

      return secrets[valueName];
    })
  }
}