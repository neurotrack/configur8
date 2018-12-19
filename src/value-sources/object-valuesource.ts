import { ValueSource } from "./value-source-service";
import { Logger } from "../lib/logger";

/**
 * Value source implemented with a simple flat JSON object.
 */
export default class ObjectValueSource implements ValueSource {
  
  public static ARG_NAME:string = '--args';
  
  private source:any;
  private logger:Logger;

  constructor(parentLogger?:Logger){

    const argsIndex:number = process.argv.indexOf(ObjectValueSource.ARG_NAME);

    this.logger = parentLogger ? parentLogger.child('ObjectValueSource') : new Logger('ObjectValueSource');
    this.source = process.argv[argsIndex+1]
      .split(',')
      .reduce( (accumulator:any,value:string) => {
        accumulator[value.split('=')[0].toUpperCase()] = value.split('=')[1];
        return accumulator;
      }, {});

    this.logger.info(`Command line args ${JSON.stringify(this.source)}`);
    
  }

  public getPrefix():string {
    return 'cli';
  }

  public getValue(nameRN:string):Promise<string | undefined> {

    this.logger.debug(`getValue() --> ${nameRN}`);

    const name:string              = (nameRN.indexOf(':') !== -1 ? nameRN.split(':')[1] : nameRN).toUpperCase();
    const value:string | undefined = this.source[name];

    this.logger.debug(`getValue() <-- ${nameRN} = ${value}`);

    return Promise.resolve(value);
  }
}