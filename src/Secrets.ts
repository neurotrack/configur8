import { AWSError }               from 'aws-sdk';
import { PromiseResult }          from 'aws-sdk/lib/request';
import { Credentials }            from 'aws-sdk';
import * as SecretsManager        from 'aws-sdk/clients/secretsmanager';
import { GetSecretValueResponse } from 'aws-sdk/clients/secretsmanager';
import { Settings }               from './Settings';

import * as Crypto from 'crypto';

/**
 * Adds a 
 */
class SecretBundle {

  private secretsManager:SecretsManager;
  private secretsName:string;
  private secrets:string | undefined;

  constructor(secretsName:string, secretsManager:SecretsManager){
    this.secretsName    = secretsName;
    this.secrets        = undefined;
    this.secretsManager = secretsManager
  }

  /**
   * Will lookup a specific value in the secret bundle.
   * 
   * @param name Of the secret attribute to lokoup in the defined secret bundle.
   */
  public getSecretValue(name:string):Promise<string> {
    return Promise.resolve()
      .then( () => !this.secrets ? this.loadSecrets() : null )
      .then( () => {
        try {

          if(this.secrets === undefined) throw Error(`The Secret value for ${this.secretsName} is undefined or null.`);

          const secrets:any = JSON.parse(this.secrets);
          const value:any   = secrets[name];

          if(!value) throw Error(`There was no value found for secret:${this.secretsName}:${name}`);

          return value;

        } catch (error) {
          throw Error(`The secret bundle ${this.secretsName} is not in a JSON form, or has invalid JSON and could not be parsed.`);

        }
      })
  }

  /**
   * Loads the secrets from AWS Secret Manager and cache them so the price of looking
   * up the secrets within the same instance has no cost.
   */
  private loadSecrets():Promise<any> {
    return this.secretsManager.getSecretValue({
        SecretId: this.secretsName
      })
      .promise()
      .then( (response:PromiseResult<GetSecretValueResponse, AWSError>) => {
        if (response instanceof Error) throw response;

        const secretValues:GetSecretValueResponse = response;
        
        this.secrets = secretValues.SecretString;
      })
  } 
}

export class Secrets {

  private secretsManager:SecretsManager;
  private secretBundles:Map<String,SecretBundle>;

  constructor(settiongs:Settings, credentials:Credentials){
    this.secretsManager = new SecretsManager({
      apiVersion: '2017-10-17',
      region: settiongs.get('--aws-region','-r',undefined),
      credentials: credentials
    });
    this.secretBundles = new Map();
  }

  /**
   * Test to see fi the value starts with 'secret' and is separated by 3 semicolons.
   * 
   * @param value to test if a secret is needed.
   */
  public needsSecret(value:string):boolean {
    return value != undefined && value!=null && typeof(value)==='string' && value.indexOf('secret:')===0 && value.split(':').length === 3;
  }

  /**
   * 
   * @param 
   */
  public getSecretParts(value:string):any{
    const secretParts:Array<string> = value.split(':');

    return {
      bundleName: secretParts[1],
      secretName: secretParts[2]
    };
  }

  /**
   * Looks up a specific secret value, within a specific bundle. The bundle name is expected to
   * correspond to the secret name it is stored within Secret Manager directly within AWS.
   * 
   * @param bundleName name of the secret budnle.
   * @param secretName name of the json attribute to load.
   */
  public lookupSecret(bundleName:string,secretName:string):Promise<string> {
    const bundle:SecretBundle = this.getBundle(bundleName);
    return bundle.getSecretValue(secretName);
  }

  /**
   * Returns the existing bundle, or creates a new one save it, and returns it.
   * 
   * @param bundleName to return.
   */
  private getBundle(bundleName:string):SecretBundle {
    let bundle = this.secretBundles.get(bundleName);
    if(!bundle) bundle = new SecretBundle(bundleName,this.secretsManager);
    return bundle;
  }

}