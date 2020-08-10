export declare class Utils {
    /**
     * Convenience function for traversing the object tree.
     *
     * @param toTraverse
     * @param callbackForPrimitives
     */
    static traverse(toTraverse: any, callbackForPrimitives: Function): void;
    /**
     *
     * @param toIterate Object to iterate over.
     * @param prefix Trail of keys resolving to this point in the object tree.
     * @param callbackForPrimitives to execute when a primitive is located.
     */
    static iterate(toIterate: any, prefix: string[], callbackForPrimitives: Function): void;
    /**
     * Returns a flat object with the key and values from teh provided object.
     *
     * @param configuration
     */
    static flatten(configuration: any): any;
}
