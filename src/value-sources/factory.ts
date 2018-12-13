import { ObjectValueSource } from "./object-valuesource";
import { AWSSecretManagerValueSource } from "./aws/secret-manager-valuesource";

/**
 * Defined interface for all ValueSources.
 */
export interface ValueSource {
  getValue(name:string):Promise<string>;  
}

export class ValueSourceFactory{

  private static CACHE:Map<string,ValueSource> = new Map();

  constructor(){
  }

  public static build(prefix:string,values?:any):ValueSource{
    let valueSource:ValueSource | undefined = ValueSourceFactory.CACHE.get(prefix);

    if(valueSource) return valueSource;

    switch (prefix) {
      case 'cli':
        valueSource = new ObjectValueSource(values);
        break;

      case 'aws-secretmanager':
      case 'aws-secrestmanager':
        valueSource = new AWSSecretManagerValueSource();
        break;
    
      default:
        throw Error(`The prefix ${prefix}: is not recognized, consult the documentation on what sources are available.`);
    }

    ValueSourceFactory.CACHE.set(prefix,valueSource);

    return valueSource;
  }
}
  