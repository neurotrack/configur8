#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const program = require("commander");
const logger_1 = require("./lib/logger");
const index_1 = require("./index");
const structured_document_1 = require("./structured-document/structured-document");
/* Lookup the package.json file to make use of its values */
const root = path.resolve(__dirname, ".", "..");
const fileContents = fs.readFileSync(root + '/package.json');
const packageConfig = JSON.parse(fileContents.toString('utf8'));
const rootCommand = Object.keys(packageConfig.bin)[0];
const logger = new logger_1.Logger(rootCommand, process.argv.indexOf('--debug') !== -1 ? logger_1.LogLevel.DEBUG : logger_1.LogLevel.INFO);
const valueLookup = new index_1.ValueLookup(logger);
/* Used to coerce file names provided to the buffer that represents the file. */
const coerceToFile = (filePath) => {
    const resolvedFilePath = filePath.startsWith('.') ? path.join('.', filePath) : filePath;
    if (fs.existsSync(resolvedFilePath)) {
        return fs.readFileSync(resolvedFilePath);
    }
    else {
        throw `The file could not be found, ${filePath} [${resolvedFilePath}].`;
    }
};
logger.info('Analyzing command line arguments...');
try {
    /* Takes ownership of the dirtywork on the command parameters. */
    program
        .version(packageConfig.version)
        .description(packageConfig.description)
        .command('replace <file>')
        .option('--debug', 'Enables detailed logging when specified.')
        .on('option:debug', () => {
        logger.setLevel(logger_1.LogLevel.DEBUG);
        logger.info('Debug level logging enabled.');
        logger.info('Args', process.argv);
    })
        .option('--in-format <value>', 'The format of the file being read. Defaults to JSON.')
        .on('option:in-format', (value) => {
        const key = value.toUpperCase();
        valueLookup.setInputFormat(structured_document_1.FileFormat[key]);
        logger.debug('Set in format to', { fileFormat: structured_document_1.FileFormat[key] });
    })
        .option('--out <value>', '(required) The file to write out, after variables have been replaced and secrets resolved.')
        .option('--out-format <value>', 'The format of the file being read. Defaults to JSON.')
        .on('option:out-format', (value) => {
        const key = value.toUpperCase();
        valueLookup.setOutputFormat(structured_document_1.FileFormat[key]);
        logger.debug('Set out format to', { fileFormat: structured_document_1.FileFormat[key] });
    })
        .option('--args <values...>', 'Pass your own cli arguments for varaible replacment within the specified file. Each value must be separated by a comma and in a key=value format.  Alternatively AWS_PROFILE can be set as an environment variable.')
        .option('--aws-region <value>', 'The region to locate AWS resources within, such as secrets or parametrs. Alternatively AWS_REGION or AWS_DEFAULT_REGION can be set as environment variables.')
        .on('option:aws-region', region => {
        process.env['AWS_REGION'] = region;
        logger.info(`Setting AWS_REGION to "${region}"`);
        logger.debug('Set AWS_REGION format to', { region });
    })
        .option('--aws-profile <value>', 'The profile to use when accessing AWS resources.')
        .on('option:aws-profile', profile => {
        process.env['AWS_PROFILE'] = profile;
        logger.info(`Setting AWS_PROFILE to "${profile}"`);
        logger.debug('Set AWS_PROFILE format to', { profile });
    })
        .on('--help', () => {
        console.log('');
        console.log('Examples:');
        console.log(`  $ ${rootCommand} replace ./config.yaml --in-format YAML --out ./config.out.yaml --out-format YAML -`);
        console.log(`  $ ${rootCommand} replace ./config.json --aws-region us-east-1 --aws-profile my-aws-profile --out ./config.out.yaml --out-format YAML`);
        console.log(`  $ ${rootCommand} replace ./config.json --out ./config.out.json --args ARG_NAME=Hello,ANOTHER_ARG="This one is a big longer"`);
        console.log('');
        console.log('');
    })
        .action((file, cmd) => {
        if (!cmd.out)
            logger.error('--out is a required option');
        else {
            /**
             * Try and assume an output format from the output file name.
             */
            if (!cmd.outFormat) {
                const fileName = cmd.out.substring(cmd.out.lastIndexOf('.') + 1);
                const key = fileName.toUpperCase();
                valueLookup.setOutputFormat(structured_document_1.FileFormat[key]);
            }
            if (!cmd.inFormat) {
                const fileName = file.substring(file.lastIndexOf('.') + 1);
                const key = fileName.toUpperCase();
                valueLookup.setInputFormat(structured_document_1.FileFormat[key]);
            }
            logger.info('Analyzed.');
            valueLookup.execute(coerceToFile(file))
                .then(buffer => {
                const outputPath = cmd.out.startsWith('.') ? path.join('.', cmd.out) : cmd.out;
                fs.writeFileSync(outputPath, buffer);
            })
                .catch((error) => console.error(error.message, error));
        }
    });
    program
        .command('*')
        .action((env) => {
        logger.info('No command was specified. Please use --help for a list of commands.');
    });
    program.parse(process.argv);
}
catch (error) {
    logger.error("Failed to execute.", error);
}
