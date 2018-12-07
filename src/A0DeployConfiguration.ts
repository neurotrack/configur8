import * as fs   from 'fs';
import * as path from 'path';
import { Utils } from './Utils';

/**
 * Wraps around the Auth0 Deploy CLI Configuration file to simplify access
 * and modifications to the file.
 */
export class Auth0DeployConfig {

  private static AUTH0_DOMAIN                   = 'AUTH0_DOMAIN';
  private static AUTH0_CLIENT_ID                = 'AUTH0_CLIENT_ID';
  private static AUTH0_CLIENT_SECRET            = 'AUTH0_CLIENT_SECRET';
  private static AUTH0_ALLOW_DELETE             = 'AUTH0_ALLOW_DELETE';
  private static AUTH0_KEYWORD_REPLACE_MAPPINGS = 'AUTH0_KEYWORD_REPLACE_MAPPINGS';

  private static DOUBLE_HASH_REGEX:RegExp       = new RegExp(/(##)(.).+?(##)/);

  private fileToWrite:string;
  private fileToRead:string;

  constructor(fileToRead:string,fileToWrite?:string){

    var pathToReadFrom = this.resolvePath(fileToRead);
    var pathToWriteTo  = this.resolvePath(fileToWrite || fileToRead)

    if(fs.existsSync(pathToReadFrom) || fs.existsSync(pathToWriteTo)) {
      this.fileToRead  = pathToReadFrom;
      this.fileToWrite = pathToWriteTo;

    } else {
      throw Error(`No file exists at ${fileToRead} or ${fileToWrite}.`)

    }
  }

  /**
   * Reads the input configuration file.
   */
  public read():Promise<object> {
    return new Promise( (resolve,reject) => {
      fs.readFile(this.fileToRead, (error, buffer) => {
        if(error) reject(`Could not read the file provided, ${error.message}.`);
        else resolve(JSON.parse(buffer.toString('utf8')))
      })
    })
  }

  /**
   * Updates all of the values within the configuration file to internal references therein.
   * 
   * @param configuration The configuration loaded up.
   * @returns a new object with the configurations filled out.
   */
  public resolveDoubleHash(configuration:object,valueSet:any):object {

    /**
     * Create the new configuration, with all values resolved.
     */
    const resolved:any = Object.assign({},configuration);

    /**
     * Replace the values.
     */
    Utils.traverse(
      resolved, 
      (toTraverse:any, key:string,value:any) => {
        if(Array.isArray(value)){
          toTraverse[key] = value.map( value => this.replaceValue(value,valueSet));

        } else {
          toTraverse[key] = this.replaceValue(value,valueSet);

        }
      }
    );

    return resolved;
  }

  /**
   * Writes out the file resulting from the processing. File is written overtop of 
   * the fileToRead or outputFile, if it is supplied.
   */
  public write(objectToWrite:any):Promise<void>{
    
    const that = this;

    return new Promise( (resolve,reject) => {
      console.log("that",that);
      fs.writeFile(that.fileToWrite, JSON.stringify(objectToWrite, null, 2), (err) => {
        if(err) reject(Error(`Failed to write a file to ${that.fileToWrite}.`));
        else resolve()
      })
    })
  }

  /**
   * Looks for ##NAME## in the value, and then looks up NAME in the value set
   * and returns an updated value if found.
   * 
   * @param value To look for a double hash.
   * @param valueSet to lookup and resolve a value from.
   */
  private replaceValue(value:any,valueSet:any):any{

    if(Auth0DeployConfig.DOUBLE_HASH_REGEX.test(value)){

      let matches:string[] | null = null;

      while( (matches = value.match(Auth0DeployConfig.DOUBLE_HASH_REGEX) ) != null) {
        matches
          .filter( value => value.length >= 5)
          .forEach( doubleHashValue => {
            const lookupName:string = doubleHashValue.replace(/#/g,'');
            value = value.replace(doubleHashValue,valueSet[lookupName])
          })
      }
    }

    return value;
  }

  /**
   * Tries to ensure that the path returned will be what the user expects.
   * 
   * @param filePath to resolve.
   */
  private resolvePath(filePath:string):string {
    return filePath.startsWith('./') ? path.join(__dirname, filePath) : filePath;
  }

}
