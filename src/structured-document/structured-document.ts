import * as yamlJS from 'js-yaml';
import { Utils }   from '../lib/utils';

/**
 * Matches on any word chunks with one or more semi colons in it.
 */
export const VALUE_PATTERN:RegExp = new RegExp(/([A-Za-z0-9-_(])+?(:){1}([A-Za-z0-9_()\/\:])+/g);

/**
 * Possible output
 */
export enum FileFormat {
    JSON,
    YAML
}

export interface DocumentObject {
    [key: string]: any;
}

export class StructuredDocumentFactory {
    /**
     * 
     * @param inFile to parse and return wrapped in a StructuredDocument instance.
     * @param sourceFormat to read the file as.
     */
    public static build(inFile: Buffer | string | object, sourceFormat: FileFormat):StructuredDocument {
        switch (sourceFormat) {

            case FileFormat.YAML:
                const file: string = inFile instanceof Buffer ? inFile.toString('utf8') : typeof (inFile) === 'string' ? inFile : '' + inFile;
                const originalYaml:Object = yamlJS.safeLoad(file);
                return new StructuredDocument(originalYaml,sourceFormat);

            case FileFormat.JSON:
                const originalJson:Object = inFile instanceof Buffer ? JSON.parse(inFile.toString('utf8')) : typeof (inFile) === 'string' ? JSON.parse(inFile) : inFile;
                return new StructuredDocument(originalJson,sourceFormat);

            default:
                throw Error(`The file format provided (${sourceFormat}) is not yet handled.`);
        }
    }
}

/**
 * Wraps around the document read in and provides facilities for
 * updating it to return a finalized document with values replaced
 * and updated.
 */
export class StructuredDocument {

    private original: any;
    private originalFileFormat: FileFormat;
    private finalized: DocumentObject;

    constructor(original: any, sourceFormat: FileFormat) {
        this.original           = original;
        this.originalFileFormat = sourceFormat;
        this.finalized          = Object.assign({},this.original);
    }

    public getOriginal(): any {
        return this.original;
    }

    public getOriginalFileFormat(): FileFormat {
        return this.originalFileFormat;
    }

    /**
     * Flattens the manipulated document, that has been updated, 
     * in a single level object.
     */
    public getFlattened():Map<string,any> {
        const flattened:any = Utils.flatten(this.finalized);
        return Object
            .keys( flattened )
            .reduce( (accumulator:Map<string,any>, key:string) => {
                accumulator.set(key,flattened[key])
                return accumulator;
            }, new Map())
    }
    
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
    public updateValue(key:string,_value:any):string {

        const keyPaths:string[] = key.split('.');
        const finalKey:string   = keyPaths.pop() || '';
        const lastAttribute:any = keyPaths.reduce( 
            (accumulator:any,key:string) => accumulator[key], 
            this.finalized
        );

        console.log("update",{key,_value,lastAttribute,finalKey})

        if( finalKey.indexOf('[') !== -1 ) {
            const arrayKey = finalKey.substring(0,finalKey.indexOf('['));
            const index    = finalKey.substring(finalKey.indexOf('[')+1,finalKey.indexOf(']'));
            lastAttribute[arrayKey][Number(index)] = _value;

        } else {
            lastAttribute[finalKey] = _value;

        }

        return lastAttribute[finalKey];
    }

    /**
     * The finalized object with values replaced.
     */
    public getFinal():DocumentObject {
        return this.finalized;
    }

    /**
     * Returns all of the values on the flattened list of values from the original. Optionally
     * a filter can be specified to reduce the list further.
     * 
     * @param filter to reduce the values returned by.
     */
    public getValues(filter?:Function): string[] {
        return Array.from( this.getFlattened().values() )
            .filter( (value:any) => typeof(value) === 'string' )
            .filter( (value: string) => filter ? filter(value) : true )
            /* Remove duplicates */
            .reduce( (accumulator: string[], value: string) => {
                if (accumulator.indexOf(value) === -1) accumulator.push(value);
                return accumulator;
            }, []);
    }

}
