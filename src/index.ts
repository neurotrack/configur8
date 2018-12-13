import * as yamlJS from 'js-yaml';

import { ValueSource, ValueSourceFactory } from './value-sources/factory';
import { ObjectValueSource } from './value-sources/object-valuesource';
import { Utils } from './utils';

/**
 * Possible output
 */
export enum FileFormat{
  JSON,
  YAML
}

/**
 * Entrypoint object into variable lookup and replacement behavior.
 */
export class ValueLookup {

  private valueSources:Map<string,ValueSource>;
  private document:any;
  private outputFormat:FileFormat;
  private inputFormat:FileFormat;
  private isParameterized:RegExp;
  private hasBraces:RegExp;

  constructor(){
    this.valueSources    = new Map();
    this.outputFormat    = FileFormat.JSON;
    this.inputFormat     = FileFormat.JSON;
    this.isParameterized = new RegExp(/(\(){1}(.)+?(\:){1}(.)+?(\)){1}/g);
    this.hasBraces       = new RegExp(/\(?\)?/g);
  }

  /**
   * A single level object (no nesting) of key values to be used as values
   * within the document.
   * 
   * @param cliArgs 
   */
  public setCLIArgs(cliArgs:any){
    this.registerValueSource('cli', ValueSourceFactory.build('cli',cliArgs));
    return this;
  }

  /**
   * The output format will be a buffer that can be written directly to a
   * file. Either JSON or YAML is valid.
   * 
   * @param outputFormat to return the document in.
   */
  public setOutputFormat(outputFormat:FileFormat){
    this.outputFormat = outputFormat;
    return this;
  }

  /**
   * 
   * @param inputFormat to parse the document as.
   */
  public setInputFormat(inputFormat:FileFormat){
    this.inputFormat = inputFormat;
    return this;
  }

  /**
   * 
   * @param inFile Buffer or string of the document in the specified format.
   * @param validate If false, will not validate the format, if available, when it is being loaded.
   * @throws YAMLException when the YAML file is invalid and validate is true.
   */
  public setSource(inFile:Buffer | string | object, validate?:true):ValueLookup {
    switch (this.inputFormat) {
      case FileFormat.YAML:
        const file:string = inFile instanceof Buffer ? inFile.toString('utf8') : typeof(inFile) === 'string' ? inFile : ''+inFile;
        this.document = validate ? yamlJS.safeLoad(file) : yamlJS.load(file);
        break;

      case FileFormat.JSON:
        this.document = inFile instanceof Buffer ? JSON.parse(inFile.toString('utf8')) : typeof(inFile) === 'string' ? JSON.parse(inFile) : inFile;
        break;
    
      default:
        break;
    }
    
    return this;
  }

  /**
   * 
   */
  public execute():Promise<Buffer> {

    const values = this
      /* Pull out all of the 'values' from the document provided. */
      .getAllValuesFromDocument()
      /* Split all values by spaces, since a reference can never have a space they will never be broken apart*/
      .map( (value:string) => value.split(' ') )
      /* Flatten the nested array structure. [ [a,b], [c,d] ] to [a,b,c,d] */ 
      .reduce( (accumulator:string[],values:string[]) => accumulator.concat(values),[] )
      /* Remove all values that do not have a semi colon, as references require one semi colon at minimum. */
      .filter( (value:string) => value.indexOf(':') !== -1)
      /* Remove duplicates */
      .reduce( (accumulator:string[],value:string) => {
        if(accumulator.indexOf(value) === -1) accumulator.push(value);
        return accumulator;
      },[]);
    
    /* 
     * With a unique list of possible value ARN's we can now get a list of unique prefixes
     * that we can use to register the appropriate ValueSource's.
     */
    values
      /* Convert each value to only their prefix */
      .map( (value:string) => value.split(':')[0].replace(this.hasBraces,'') )
      /* Remove duplicates */
      .reduce( (accumulator:string[],value:string) => {
        if(accumulator.indexOf(value) === -1) accumulator.push(value);
        return accumulator;
      },[])
      .forEach( (prefix:string) => {
        console.log(`Registering a ValueSource factory for the prefix ${prefix}.`);
        this.registerValueSource(prefix, ValueSourceFactory.build(prefix));
      })

    const promises:Promise<void>[] = [];

    /**
     * First each replacement value needs to have references updated, some paths
     * will need parameterization to make sense. aws-secretmanager:/(cli:stage)/something:NAME for
     * instance is easier updated at runtime.
     */
    Utils.traverse( this.document, (currentObject:any, key:string, value:string | number | boolean) => {
      let promise:Promise<void> | undefined = undefined;

      /**
       * For each value, we are going to look for (som:ething). At least one semi colon
       * must be present to bother invoking a lookup.
       */
      if(typeof(value) === 'string' && this.isParameterized.test(value)) {
        
        /* When a value is found we replace the key entirely. */
        promise = this
          .updateInlineValues(value)
          .then( (replacement:string) => { currentObject[key] = replacement } )

      } else if(Array.isArray(value)) {

        const arrayPromises:Promise<void>[] = value
          // .filter( (item:string) =>  )
          .map( (item:string,index:number) => {
            if(typeof(item) === 'string' && this.isParameterized.test(item)) {
              return this
                .updateInlineValues(item)
                .then( (replacement:string) =>  { currentObject[key][index] = replacement } )
            }
            return Promise.resolve();
          })

        if(arrayPromises.length!==0) {
          promise = Promise.all(arrayPromises)
            .then( () => {} )
        }
      }

      if(promise) promises.push(promise);

    });
    
    //TODO locate all variables.
    //TODO for all variables, use the ValueSourceFactory to initialize the
    //     ValueSources that will be needed.
    //TODO Go through document and begin replacing values.
    //TODO Output document in the requested format.  
    return Promise.all(promises)
      .then( () => Buffer.from(JSON.stringify(this.document)) )
  }

  /**
   * For each inline value match, we will replace the (*:*) tag with the located value.
   * 
   * @param value To look for (*:*) values within.
   *              
   */
  private updateInlineValues(value:string):Promise<string> {

    let promsies:Promise<string>[] = [];
    let matches:string[] | null    = value.match( this.isParameterized );
    let newValue:string            = value;

    if(matches) {
      promsies = matches
        .map( (replaceValue:string) => replaceValue.replace(this.hasBraces,'') )
        // .map( (value:string) => { console.log("value",value); return value })
        .map( (lookupName:string) => this
          .lookupValue(lookupName)
          .then( returnedValue => newValue = newValue.replace(`(${lookupName})`,returnedValue ) )
          .catch( error => Promise.reject(`Could not locate a value for ${lookupName}.`))
        );
    }

    return Promise.all(promsies)
      .then( () => newValue )
  }

  /**
   * Locates a specific value for the valueARN provided.
   * 
   * @param valueARN to lookup a vlaue using.
   */
  private lookupValue(valueARN:string):Promise<string>{
    const valueSource:ValueSource = this.getValueSource(valueARN);
    return valueSource.getValue(valueARN);
  }

  /**
   * 
   * @param _prefix or full valueARN to locate a ValueSource using.
   */
  private getValueSource(_prefix:string):ValueSource {

    const prefix:string                       = _prefix.indexOf(':') !== -1 ? _prefix.substring(0,_prefix.indexOf(':')) : _prefix;
    const valueSource:ValueSource | undefined = this.valueSources.get(prefix);

    if(!valueSource) throw Error(`The prefix ${prefix} did not resolve to any ValueSource. This is likely an error with the value resolving logic.`);

    return valueSource;
  }

  /**
   * Returns all of the values from each attribute of the 'document' attribute
   * object on this instance.
   */
  private getAllValuesFromDocument():string[] {
    
    let values:string[] = [];
    
    Utils.traverse( this.document, (currentObject:any, key:string, value:string | number | boolean) => {
      if(typeof(value) === 'string') values.push(value);
      if(Array.isArray(value)) value.forEach( _value => values.push(_value) );
    })

    return values;
  }

  /**
   * Registers new sources for value lookup. The name will be mapped directly to the expected
   * prefix, such as cli: would need to be set as the name 'cli'.
   * 
   * @param name 
   * @param source 
   */
  private registerValueSource(name:string,source:ValueSource){
    this.valueSources.set(name,source);
  }
}

new ValueLookup()
  .setCLIArgs({'CLI_FOO':'BAR','ENVIRONMENT':'QA','FOO_TOO':'Genius'})
  .setOutputFormat(FileFormat.JSON)
  .setSource({
    parent: {
      foo: "cli:CLI_FOO Some Default"
    },
    environment: "cli:ENVIRONMENT DEV",
    stage: "development",
    secret: "aws-secretmanager:/(cli:ENVIRONMENT)/(cli:CLI_FOO)/test:NONE",
    list: [
      "cli:FOO_TOO",
      "(cli:FOO_TOO) Or Some Other Default"
    ]
  })
  .execute()
  .then( buffer => console.log("DONE!!!!! ->", buffer.toString('utf8')) )
  .catch( error => console.error(error) )