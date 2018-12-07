
import { isObject } from 'util';

export class Utils {
    
  /**
   * Convenience function for traversing the object tree.
   * 
   * @param toTraverse 
   * @param callbackForPrimitives 
   */
  public static traverse(toTraverse:any, callbackForPrimitives:Function){
    
    for( const key in toTraverse) {
      
      const value:any = toTraverse[key];

      if(isObject(value) && !Array.isArray(value)){
        Utils.traverse(value,callbackForPrimitives);

      } else {
        callbackForPrimitives(toTraverse, key, value);

      }
    }
  }

  /**
   * Returns a flat object with the key and values from teh provided object.
   * 
   * @param configuration 
   */
  public static flatten(configuration:object):object {
    
    /*
     * Create a collection of the values to use.
     */
    const values:any   = {};

    Utils.traverse(
      configuration, 
      (toTraverse:any, key:string, value:any) => values[key] = value
    );

    return values;
  }

}