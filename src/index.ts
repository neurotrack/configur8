#!/usr/bin/env node;

import * as path                from 'path';
import * as fs                  from 'fs';
import * as program             from 'commander';
import * as AWS                 from 'aws-sdk';
import { Credentials }          from 'aws-sdk';
import { PatternValueReplacer } from './PatternValueReplacer';
import { Utils }                from './Utils';
import { Secrets }              from './Secrets';
import { packageConfig }        from './PackageConfig';

/* Looks up the 'command' that will be registered by NPM */
const rootCommand  = Object.keys(packageConfig.bin)[0];

/* Used to coerce file names provided to the buffer that represents the file. */
const coerceToFile = (filePath:string) => {
  const resolvedFilePath = filePath.startsWith('.') ? path.join(__dirname, filePath) : filePath;
  if(fs.existsSync(resolvedFilePath)){
    console.log(`Progress: Reading the input file,${resolvedFilePath}`);
    return fs.readFileSync(resolvedFilePath);
  } else {
    throw `The file could not be found, ${filePath}/${resolvedFilePath}.`;
  }
}

/* Takes ownership of the dirtywork on the command parameters. */
program
  .version(packageConfig.version)
  .description(packageConfig.description)
  .usage('[options]')
  .option('--config <file>', '(required) The auth0-deploy-cli configuration file, in JSON format.',coerceToFile)
  .option('--output <value>', '(required) The file to write out, after variables have been replaced and secrets resolved.')
  .option('--profile <value>', 'The profile to use when accessing AWS resources.')
  .option('--region <value>', 'The region to locate AWS resources within, such as secrets or parametrs.')
  .on('--help', () => {
    console.log('')
    console.log('Examples:');
    console.log(`  $ ${rootCommand} --config ./myA0Config.json --output ./newConfig.dev.json`);
    console.log(`  $ ${rootCommand} --config ./myA0Config.json --output ./newConfig.dev.json --region us-east-1 -profile my-aws-profile`);
  })
  .parse(process.argv);

/* Validate input */
let invalid:boolean = false;
if(!program.config) invalid = true; console.log('The --config parameter is required and must point to a valid file. You can use relative paths from the exection location.');
if(!program.output) invalid = true; console.log('The --output parameter is required.');

if(!invalid) {
  /**
   * Load the confiugration file into a usable structure that will be used
   * to feed the values as pattern replacement is executed on the file.
   */
  const sourceConfiguration:any                   = JSON.parse(program.config.toString('utf8'));
  const patternValueReplacer:PatternValueReplacer = new PatternValueReplacer(Utils.flatten(sourceConfiguration));
  const outputConfiguration:any                   = patternValueReplacer.replaceAllIn(sourceConfiguration);

  console.log(`Progress: Resolved all double hash variables.`);

  const credentials:Credentials                   = new AWS.SharedIniFileCredentials({ profile: program['profile'] });
  const secrets:Secrets                           = new Secrets(credentials,program['region'])

  console.log(`Progress: Looking up secrets.`);

  secrets.updateSecrets(outputConfiguration)
    .then( upatedConfiguration => {
      
      const outputFile         = program.output;
      const resolvedOutputPath = outputFile.startsWith('.') ? path.join(__dirname, outputFile) : outputFile;
      
      console.log(`Progress: Writing output file.`);

      fs.writeFileSync(resolvedOutputPath,JSON.stringify(upatedConfiguration,null,4))
    })
}