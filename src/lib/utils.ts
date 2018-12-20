import { AnyLengthString } from "aws-sdk/clients/comprehend";

export class Utils {

    /**
     * Convenience function for traversing the object tree.
     * 
     * @param toTraverse 
     * @param callbackForPrimitives 
     */
    public static traverse(toTraverse: any, callbackForPrimitives: Function) {

        for (const key in toTraverse) {

            const value: any = toTraverse[key];

            if (typeof (value) === 'object' && !Array.isArray(value)) {
                Utils.traverse(value, callbackForPrimitives);

            } else {
                callbackForPrimitives(toTraverse, key, value);

            }
        }
    }

    /**
     * 
     * @param toIterate Object to iterate over.
     * @param prefix Trail of keys resolving to this point in the object tree.
     * @param callbackForPrimitives to execute when a primitive is located.
     */
    public static iterate(toIterate: any, prefix: string[], callbackForPrimitives: Function): void {
        for (const key in toIterate) {

            const value: any = toIterate[key];

            if (typeof (value) === 'object' && !Array.isArray(value)) {
                const newPrefix = prefix.concat([key]);
                Utils.iterate(value, newPrefix, callbackForPrimitives);

            } else {
                callbackForPrimitives(toIterate, prefix, key, value);

            }
        }
    }

    /**
     * Returns a flat object with the key and values from teh provided object.
     * 
     * @param configuration 
     */
    public static flatten(configuration: any): any {

        /*
        * Create a collection of the values to use.
        */
        const values: any = {};

        Utils.iterate(
            configuration,
            [],
            (toIterate: any, prefix: string[], key: string, value: any) => {
                if (Array.isArray(value)) {
                    value.forEach((item: string | any, index: number) => {
                        if( typeof item === 'string') {
                            values[prefix.concat([key], ['' + index]).join('.')] = item;
                        } else {
                            const arrayItems:any = Utils.flatten(item);
                            for( let arrayItemsKey of Object.keys(arrayItems) ) {
                                values[prefix.concat([key], ['' + index],arrayItemsKey).join('.')] = arrayItems[arrayItemsKey];
                            }
                        }
                    });
                } else {
                    values[prefix.concat([key]).join('.')] = value;
                }
            }
        );

        return values;
    }
}