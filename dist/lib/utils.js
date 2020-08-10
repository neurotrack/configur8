"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Utils {
    /**
     * Convenience function for traversing the object tree.
     *
     * @param toTraverse
     * @param callbackForPrimitives
     */
    static traverse(toTraverse, callbackForPrimitives) {
        for (const key in toTraverse) {
            const value = toTraverse[key];
            if (typeof (value) === 'object' && !Array.isArray(value)) {
                Utils.traverse(value, callbackForPrimitives);
            }
            else {
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
    static iterate(toIterate, prefix, callbackForPrimitives) {
        for (const key in toIterate) {
            const value = toIterate[key];
            if (typeof (value) === 'object' && !Array.isArray(value)) {
                const newPrefix = prefix.concat([key]);
                Utils.iterate(value, newPrefix, callbackForPrimitives);
            }
            else {
                callbackForPrimitives(toIterate, prefix, key, value);
            }
        }
    }
    /**
     * Returns a flat object with the key and values from teh provided object.
     *
     * @param configuration
     */
    static flatten(configuration) {
        /*
        * Create a collection of the values to use.
        */
        const values = {};
        Utils.iterate(configuration, [], (toIterate, prefix, key, value) => {
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (typeof item === 'string') {
                        values[prefix.concat([key], ['' + index]).join('.')] = item;
                    }
                    else {
                        const arrayItems = Utils.flatten(item);
                        for (let arrayItemsKey of Object.keys(arrayItems)) {
                            values[prefix.concat([key], ['' + index], arrayItemsKey).join('.')] = arrayItems[arrayItemsKey];
                        }
                    }
                });
            }
            else {
                values[prefix.concat([key]).join('.')] = value;
            }
        });
        return values;
    }
}
exports.Utils = Utils;
