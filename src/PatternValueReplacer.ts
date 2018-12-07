import { Utils } from "./Utils";


export class PatternValueReplacer {

  private doubleHashPattern:RegExp = new RegExp(/(##)(.).+?(##)/,'g');
  private valueSet:any;

  constructor(valueSet:any){
    this.valueSet = valueSet;
  }

  public replaceAllIn(toBeUpdated:any):any{
    /**
     * Replace the values.
     */
    Utils.traverse(
      toBeUpdated, 
      (toTraverse:any, key:string,value:any) => {
        if(Array.isArray(value)){
          toTraverse[key] = value.map( value => this.replaceValue(value,this.valueSet));

        } else {
          toTraverse[key] = this.replaceValue(value,this.valueSet);

        }
      }
    );

    return toBeUpdated;
  }

  /**
   * Looks for ##NAME## in the value, and then looks up NAME in the value set
   * and returns an updated value if found.
   * 
   * @param value To look for a double hash.
   * @param valueSet to lookup and resolve a value from.
   */
  private replaceValue(value:any,valueSet:any):any{

    if(this.doubleHashPattern.test(value)){

      let matches:string[] | null = null;

      while( (matches = value.match( this.doubleHashPattern ) ) != null) {
        matches
          .filter( (value:any) => value.length >= 5)
          .forEach( doubleHashValue => {
            const lookupName:string = doubleHashValue.replace(/#/g,'');
            value = value.replace(doubleHashValue,valueSet[lookupName])
          })
      }
    }
    return value;
  }
}