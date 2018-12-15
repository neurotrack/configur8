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
    
    this.source = process.argv[argsIndex+1]
      .split(',')
      .reduce( (accumulator:any,value:string) => {
        accumulator[value.split('=')[0]] = value.split('=')[1];
        return accumulator;
      }, {});
      this.logger = parentLogger ? parentLogger.child('ObjectValueSource') : new Logger('ObjectValueSource');
  }

  public getPrefix():string {
    return 'cli';
  }

  public getValue(nameARN:string):Promise<string | undefined>{

    this.logger.debug(`getValue() --> ${nameARN}`);

    const name:string              = nameARN.split(':')[1];
    const value:string | undefined = this.source[name];

    this.logger.debug(`getValue() <-- ${nameARN} = ${value}`);

    return Promise.resolve(value);
  }
}