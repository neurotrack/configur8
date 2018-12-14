import { ValueSource } from "./value-source-factory";

/**
 * Value source implemented with a simple flat JSON object.
 */
export default class ObjectValueSource implements ValueSource {
  
  private source:any;
  public static ARG_NAME:string = '--args';

  constructor(){
    const argsIndex:number = process.argv.indexOf(ObjectValueSource.ARG_NAME);
    
    this.source = process.argv[argsIndex+1]
      .split(',')
      .reduce( (accumulator:any,value:string) => {
        accumulator[value.split('=')[0]] = value.split('=')[1];
        return accumulator;
      }, {});
  }

  public getPrefix():string {
    return 'cli';
  }

  public getValue(nameARN:string):Promise<string>{

    const name:string              = nameARN.split(':')[1];
    const value:string | undefined = this.source[name];

    if(!value) return Promise.reject(`There was no value found for ${name}.`);

    return Promise.resolve(value);
  }
}