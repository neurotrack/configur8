#!/usr/bin/env node

import * as path            from 'path';
import * as fs              from'fs';
import * as program         from 'commander';
import { Logger, LogLevel } from './lib/logger';
import { ValueLookup }      from './index';
import { FileFormat } from './structured-document/structured-document';

/* Lookup the package.json file to make use of its values */
const root          = path.resolve(__dirname, ".", "..");
const fileContents  = fs.readFileSync(root + '/package.json');
const packageConfig = JSON.parse(fileContents.toString('utf8'));
const rootCommand   = Object.keys(packageConfig.bin)[0];
const logger        = new Logger(rootCommand, process.argv.indexOf('--debug')!==-1 ? LogLevel.DEBUG : LogLevel.INFO);
const valueLookup   = new ValueLookup(logger);

/* Used to coerce file names provided to the buffer that represents the file. */
const coerceToFile = (filePath:string) => {
    const resolvedFilePath = filePath.startsWith('.') ? path.join('.', filePath) : filePath;
    if(fs.existsSync(resolvedFilePath)){
        return fs.readFileSync(resolvedFilePath);
    } else {
        throw `The file could not be found, ${filePath} [${resolvedFilePath}].`;
    }
}

logger.info('Analyzing command line arguments...');

try {
    /* Takes ownership of the dirtywork on the command parameters. */
    program
        .version(packageConfig.version)
        .description(packageConfig.description)
        .command('replace <file>')
        .option('--debug', 'Enables detailed logging when specified.')
        .on('option:debug', () => {
            logger.setLevel(LogLevel.DEBUG);
            logger.info('Debug level logging enabled.');
            logger.info('Args',process.argv)
        })
        .option('--in-format <value>', 'The format of the file being read. Defaults to JSON.')
        .on('option:in-format', (value: string) => {
            const key = value.toUpperCase() as keyof typeof FileFormat;
            valueLookup.setInputFormat(FileFormat[key]);
            logger.debug('Set in format to',{fileFormat:FileFormat[key]});
        })
        .option('--out <value>', '(required) The file to write out, after variables have been replaced and secrets resolved.')
        .option('--out-format <value>', 'The format of the file being read. Defaults to JSON.')
        .on('option:out-format', (value: string) => {
            const key = value.toUpperCase() as keyof typeof FileFormat;
            valueLookup.setOutputFormat(FileFormat[key]);
            logger.debug('Set out format to',{fileFormat:FileFormat[key]});
        })
        .option('--args <values...>','Pass your own cli arguments for varaible replacment within the specified file. Each value must be separated by a comma and in a key=value format.  Alternatively AWS_PROFILE can be set as an environment variable.')
        .option('--aws-region <value>', 'The region to locate AWS resources within, such as secrets or parametrs. Alternatively AWS_REGION or AWS_DEFAULT_REGION can be set as environment variables.')
        .on('option:aws-region', region => {
            process.env['AWS_REGION'] = region;
            logger.info(`Setting AWS_REGION to "${region}"`);
            logger.debug('Set AWS_REGION format to',{region});
        })
        .option('--aws-profile <value>', 'The profile to use when accessing AWS resources.')
        .on('option:aws-profile', profile => {
            process.env['AWS_PROFILE'] = profile;
            logger.info(`Setting AWS_PROFILE to "${profile}"`);
            logger.debug('Set AWS_PROFILE format to',{profile});
        })
        .on('--help', () => {
            console.log('')
            console.log('Examples:');
            console.log(`  $ ${rootCommand} replace ./config.yaml --in-format YAML --out ./config.out.yaml --out-format YAML -`);
            console.log(`  $ ${rootCommand} replace ./config.json --aws-region us-east-1 --aws-profile my-aws-profile --out ./config.out.yaml --out-format YAML`);
            console.log(`  $ ${rootCommand} replace ./config.json --out ./config.out.json --args ARG_NAME=Hello,ANOTHER_ARG="This one is a big longer"`);
            console.log('')
            console.log('')
        })
        .action( (file, cmd) => {
            if(!cmd.out) logger.error('--out is a required option');
            else {
                logger.info('Analyzed.');
                valueLookup.execute(coerceToFile(file))
                .then( buffer => {
                    const outputPath = cmd.out.startsWith('.') ? path.join('.', cmd.out) : cmd.out;
                    fs.writeFileSync(outputPath,buffer);
                })
                .catch( (error) => console.error(error.message,error) );
            }
        });

    program
        .command('*')
        .action((env) => {
            logger.info('No command was specified. Please use --help for a list of commands.');
        });

    program.parse(process.argv);
} catch(error) {
    logger.error("Failed to execute.",error);
}
