import { ValueSource } from "./factory";

/**
 * Value source implemented with a simple flat JSON object.
 */
export class ObjectValueSource implements ValueSource {
  private source:any;

  constructor(source:any){
    this.source = source;
  }

  public getValue(nameARN:string):Promise<string>{

    const name:string              = nameARN.split(':')[1];
    const value:string | undefined = this.source[name];

    if(!value) return Promise.reject(`There was no value found for ${name}.`);

    return Promise.resolve(value);
  }
}