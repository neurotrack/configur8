/// <reference types="node" />
import { Logger } from '../lib/logger';
export declare const VALUE_PATTERN: RegExp;
/**
 * Possible output
 */
export declare enum FileFormat {
    JSON = "JSON",
    YAML = "YAML"
}
export interface DocumentObject {
    [key: string]: any;
}
export declare class StructuredDocumentFactory {
    private static LOGGER;
    static setLogger(logger: Logger): void;
    /**
     *
     * @param inFile to parse and return wrapped in a StructuredDocument instance.
     * @param sourceFormat to read the file as.
     */
    static build(inFile: Buffer | string | object, sourceFormat: FileFormat): StructuredDocument;
}
/**
 * Wraps around the document read in and provides facilities for
 * updating it to return a finalized document with values replaced
 * and updated.
 */
export declare class StructuredDocument {
    private static PRIORITY_KEYS;
    private original;
    private originalFileFormat;
    private finalized;
    constructor(original: any, sourceFormat: FileFormat);
    getOriginal(): any;
    getOriginalFileFormat(): FileFormat;
    /**
     * Flattens the manipulated document, that has been updated,
     * in a single level object.
     */
    getFlattened(): Map<string, any>;
    /**
     * Updates a value within this document. The key
     * is expected to be the root level key, or dot notation
     * to the key to be updated.
     *
     * For arrays, the index should be a part of the final
     * step of the key, in brackets. path.to.array[0] for
     * example would update the first value of the array
     * found in the path.to objects.
     *
     * @param key in dot notation of the value to update.
     * @param _value the value to use.
     */
    updateValue(key: string, _value: any): string;
    /**
     * The finalized object with values replaced.
     */
    getFinal(_fileFormat?: FileFormat): Buffer;
    /**
     * Returns all of the values on the flattened list of values from the original. Optionally
     * a filter can be specified to reduce the list further.
     *
     * @param filter to reduce the values returned by.
     */
    getValues(filter?: Function): string[];
}
