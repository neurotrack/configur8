import { ValueInjector }      from "./value-injector";
import { 
    ValueSource, 
    ValueSourceService }      from "../value-sources/value-source-service";
import { StructuredDocument } from "../structured-document/structured-document";
import { Logger }             from "../lib/logger";

/**
 * Matches on any word chunks that have a semi colon, and is wrapped within
 * braces ( ).
 */
export const REPLACEMENT_VALUE_PATTERN:RegExp = new RegExp(/([A-Za-z0-9-_])+?(:){1}([A-Za-z0-9_/:()])+/g);

export class ReplacingValueInjector extends ValueInjector {

    private logger: Logger;

    constructor(parentLogger:Logger,valueSourceService:ValueSourceService){
        super(valueSourceService);
        this.logger = parentLogger.child('ReplacingValueInjector');
    }

    /**
     * Should be one of the first value injectors to run.
     */
    public getPriority():number {
        return 100;
    }

    /**
     * 
     * @param document to replace all values within.
     */
    public replaceAllIn(structuredDocument:StructuredDocument):Promise<StructuredDocument>{

        this.logger.debug('replaceAllIn() --> ');

        const flattened: Map<string,any> = structuredDocument.getFlattened();
        const promises: Promise<void>[]  = Array.from(flattened.keys())
            .map( (key:string) => {
                const value:string       = flattened.get(key);
                return {
                    key,
                    value,
                    matches: value.match(REPLACEMENT_VALUE_PATTERN)
                }
            }) 
            .filter( (tuple: any) => tuple['matches'] )
            .map( (tuple: any) => {

                this.logger.debug(`replaceAllIn() --> ${JSON.stringify(tuple)}`);

                const value: string               = tuple['value'];
                const key: string                 = tuple['key'];
                const matches: RegExpMatchArray   = tuple['matches'];
                let   promiseChain: Promise<void> = Promise.resolve();
                let   isReplaced: boolean = false;

                if(!matches) return Promise.resolve();

                matches
                    .reduce( (accumulator: string[], value: string) => {
                        if(accumulator.indexOf(value) === -1) accumulator.push(value);
                        return accumulator;
                    },[])
                    .map( (match: string) => {
                        /**
                         * Resolving each value in the chain serially ensures that we
                         * will not end up with paralelle workers clobering values
                         * as others are trying to resolve them.
                         */
                        promiseChain = promiseChain
                            .then( () => !isReplaced ? this.replaceForOne(value,key,match,structuredDocument) : true )
                            .then( (didReplacement:boolean) => { isReplaced = didReplacement } )
                    });

                return promiseChain;
            })

        return Promise.all(promises)
            .then( () => {
                this.logger.debug('replaceAllIn() <-- ');
                return structuredDocument;
            });
    }

    private replaceForOne(value:string, key:string, match:string, structuredDocument:StructuredDocument):Promise<boolean>{
        return this.getValueSource(match)
          .then( (valueSource: ValueSource | undefined) => valueSource ? valueSource.getValue(match) : undefined )
          .then( (resolvedValue: string | undefined ) => {
              if( !resolvedValue ) {
                  this.logger.debug(`No value found for ${match}`);
                  return false;
              } else {
                  this.logger.info(`Replacing "${value}" with "${resolvedValue}" on "${key}".`);
                  structuredDocument.updateValue(key,resolvedValue);
                  return true;
              }
          })
    }
}