// #!/usr/bin/env node

const path          = require('path');
const fs            = require('fs');
const program       = require('commander');

/* Lookup the package.json file to make use of its values */
const root          = path.resolve(__dirname, ".", "..");
const fileContents  = fs.readFileSync(root + '/package.json');
const packageConfig = JSON.parse(fileContents.toString('utf8'));
const rootCommand   = Object.keys(packageConfig.bin)[0];

/* Used to coerce file names provided to the buffer that represents the file. */
const coerceToFile = (filePath) => {
  const resolvedFilePath = filePath.startsWith('.') ? path.join('.', filePath) : filePath;
  if(fs.existsSync(resolvedFilePath)){
    return fs.readFileSync(resolvedFilePath);
  } else {
    throw `The file could not be found, ${filePath} [${resolvedFilePath}].`;
  }
}

let inputFile = null;
let awsProfile = null;
let awsRegion  = null;
//TODO PREP YAML VARIABLE to be configured on the fly by params.

/**
 * Convenience method for logging progress messages to the console
 * 
 * @param {string} message 
 * @param {string} level 
 */
const log = (message,level) => {
  const date = new Date();
  if('ERROR' !== level) console.log(`${date.toUTCString()} -- ${rootCommand} [${level || 'INFO'}] ${message}`);
  else console.error(`${date.toUTCString()} -- ${rootCommand} [ERROR] ${message}`);
}

log(`${rootCommand} -> INFO: Analyzing command line arguments.`);

/* Takes ownership of the dirtywork on the command parameters. */
program
  .version(packageConfig.version)
  .description(packageConfig.description)
  .on('--help', () => {
    console.log('')
    console.log('Examples:');
    console.log(`  $ ${rootCommand} yaml ./config.yaml --out ./config.out.yaml`);
    console.log(`  $ ${rootCommand} yaml ./config.yaml --aws-region us-east-1 --aws-profile my-aws-profile --out ./config.out.yaml`);
    console.log(`  $ ${rootCommand} yaml ./config.yaml --out ./config.out.yaml --args ARG_NAME=Hello,ANOTHER_ARG="This one is a big longer"`);
  })
  .command('yaml <file>')
  .option('--out <value>', '(required) The file to write out, after variables have been replaced and secrets resolved.')
  .option('--overwrite', 'Makes the --out parameter not required, but will overwrite the source file with updates.')
  .on('option:overwrite', () => log('The source yaml file will be over written.','WARN') )
  .option('--aws-region <value>', 'The region to locate AWS resources within, such as secrets or parametrs.')
  .on('option:aws-region', region => {
    process.env['AWS_REGION'] = region;
    log(`Setting AWS_REGION to "${region}"`);
  })
  .option('--aws-profile <value>', 'The profile to use when accessing AWS resources.')
  .on('option:aws-profile', profile => {
    process.env['AWS_PROFILE'] = profile;
    log(`Setting AWS_PROFILE to "${profile}"`);
  })
  .option('--args <values...>','Pass your own cli arguments for varaible replacment within the specified file. Each value must be separated by a comma and in a key=value format.')
  .action( (file, cmd) => {
    if(!cmd.out && !cmd.overwrite) log('--out is a required option','ERROR');
    else {
      const outPath = cmd.overwrite ? file : cmd.out;
      const args = cmd.args;
      // console.log('action 1',{file,out,args});
      // console.log("awsProfile",awsRegion)

      // console.log("awsProfile",awsRegion)
      log(`Reading the input file, ${file}`);
      inputFile = coerceToFile(file);
      log('Reading complete.');

      
//       fs.writeFileSync(resolvedOutputPath,JSON.stringify(upatedConfiguration,null,4));
    }
  });

  program.parse(process.argv);
