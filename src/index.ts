#!/usr/bin/env node

import { Auth0DeployConfig } from './A0DeployConfiguration';
import { Secrets }                  from './Secrets';
import { Utils }                    from './Utils';
import { Settings }                 from './Settings';
import * as AWS                     from 'aws-sdk';
import { Credentials }              from 'aws-sdk';


const settings                   = new Settings();

if(settings.get('--help')) {
  
  console.log(`
--help to get a general review on how to use this tool.
--config or -c, (required) to specify which configuration file to read and update.
--output or -o, (optiona) specifies the new file to create. If omitted, the configuration file will be updated directly.
--aws-profile or -p, (optional) to specify which AWS profile to use when accessing the secrets.
--aws-region or -r, (optiona) the region to look for the secrets in, if your profile or environment variables do not specify a region.
`)


} else {
  const credentials:Credentials    = new AWS.SharedIniFileCredentials({ profile: settings.get('--aws--profile','-p', 'default') });
  const a0Config:Auth0DeployConfig = new Auth0DeployConfig(
    settings.get('--config','-c'),
    settings.get('--output','-o')
  );
  const secrets:Secrets            = new Secrets(settings,credentials)

  a0Config.read()
    .then( (config:any) => a0Config.resolveDoubleHash( config, Utils.flatten(config) ) )
    .then( (config:any) => {
      const promises:Array<Promise<void>> = [];
      Utils.traverse(
        config,
        (toTraverse:any, key:string, value:any) => {
          
          if(Array.isArray(value)){
              value.map( (value,index) => {
                if(secrets.needsSecret(value)) {
                  promises.push(
                    Promise.resolve(secrets.getSecretParts(value))
                      .then( (secretParts:any) => secrets.lookupSecret(secretParts.bundleName, secretParts.secretName) )
                      .then( (secretValue:string) => { toTraverse[key][index] = secretValue } )
                  )
                }
              });

          } else {
            if(secrets.needsSecret(value)) {
              promises.push(
                Promise.resolve(secrets.getSecretParts(value))
                  .then( (secretParts:any) => secrets.lookupSecret(secretParts.bundleName, secretParts.secretName) )
                  .then( (secretValue:string) => { toTraverse[key] = secretValue } )
              )
            }
          }        
        }
      )
      return Promise.all(promises)
        .then( () => config )
    })
    .then( (updatedConfig:object) => a0Config.write(updatedConfig) )
    .catch( console.error )
}



