// #!/usr/bin/env node

const path          = require('path');
const fs            = require('fs');
const program       = require('commander');
const logging       = require('../src/lib/logger');
const DocReplace    = require('../src/index');

/* Lookup the package.json file to make use of its values */
const root          = path.resolve(__dirname, ".", "..");
const fileContents  = fs.readFileSync(root + '/package.json');
const packageConfig = JSON.parse(fileContents.toString('utf8'));
const rootCommand   = Object.keys(packageConfig.bin)[0];
const logger        = new logging.Logger();
const valueLookup   = new DocReplace.ValueLookup(logger);

/* Used to coerce file names provided to the buffer that represents the file. */
const coerceToFile = (filePath) => {
    const resolvedFilePath = filePath.startsWith('.') ? path.join('.', filePath) : filePath;
    if(fs.existsSync(resolvedFilePath)){
        return fs.readFileSync(resolvedFilePath);
    } else {
        throw `The file could not be found, ${filePath} [${resolvedFilePath}].`;
    }
}

logger.info('Analyzing command line arguments.');

/* Takes ownership of the dirtywork on the command parameters. */
program
  .version(packageConfig.version)
  .description(packageConfig.description)
  .on('--help', () => {
    console.log('')
    console.log('Examples:');
    console.log(`  $ ${rootCommand} replace ./config.yaml --in-format YAML --out ./config.out.yaml --out-format YAML -`);
    console.log(`  $ ${rootCommand} replace ./config.yaml --aws-region us-east-1 --aws-profile my-aws-profile --out ./config.out.yaml`);
    console.log(`  $ ${rootCommand} replace ./config.yaml --out ./config.out.yaml --args ARG_NAME=Hello,ANOTHER_ARG="This one is a big longer"`);
  })
  .command('replace <file>')
  .on('option:debug', () => {
    logger.setLevel('DEBUG');
    logger.info('Debug level logging enabled.');
  })
  .option('--in-format <value>', 'The format of the file being read. Defaults to JSON.')
  .on('option:in-format', (value) => {
      switch (value.toUpperCase()) {
          case 'YAML':
              valueLookup.setInputFormat('YAML');
              break;

          case 'JSON':
          default:
              valueLookup.setInputFormat('JSON');
              break;
      } 
  })
  .option('--out <value>', '(required) The file to write out, after variables have been replaced and secrets resolved.')
  .on('option:out', (value) => outputFile = value)
  .option('--out-format <value>', 'The format of the file being read. Defaults to JSON.')
  .on('option:out-format', (value) => {
      switch (value.toUpperCase()) {
          case 'YAML':
              valueLookup.setOutputFormat('YAML');
              break;

          case 'JSON':        
          default:
              valueLookup.setOutputFormat('JSON');
              break;
      } 
  })
  .option('--aws-region <value>', 'The region to locate AWS resources within, such as secrets or parametrs. Alternatively AWS_REGION or AWS_DEFAULT_REGION can be set as environment variables.')
  .on('option:aws-region', region => {
      process.env['AWS_REGION'] = region;
      logger.info(`Setting AWS_REGION to "${region}"`);
  }).option('--debug', 'Enables detailed logging when specified.')
  .option('--aws-profile <value>', 'The profile to use when accessing AWS resources.')
  .on('option:aws-profile', profile => {
      process.env['AWS_PROFILE'] = profile;
      logger.info(`Setting AWS_PROFILE to "${profile}"`);
  })
  .option('--args <values...>','Pass your own cli arguments for varaible replacment within the specified file. Each value must be separated by a comma and in a key=value format.  Alternatively AWS_PROFILE can be set as an environment variable.')
  .action( (file, cmd) => {
      if(!cmd.out) logger.error('--out is a required option','ERROR');
      else {
        valueLookup.execute(coerceToFile(file))
          .then( buffer => {
            const outputPath = cmd.out.startsWith('.') ? path.join('.', cmd.out) : cmd.out;
            fs.writeFileSync(outputPath,buffer);
          })
          .catch( error => logger.error(error,'ERROR'))
    }
  });

program.parse(process.argv);
