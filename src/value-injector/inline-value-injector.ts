import { ValueInjector }      from "./value-injector";
import { 
    ValueSource, 
    ValueSourceService }      from "../value-sources/value-source-service";
import { StructuredDocument } from "../structured-document/structured-document";
import { Logger } from "../lib/logger";

/**
 * Matches on any word chunks that have a semi colon, and is wrapped within
 * braces ( ).
 */
export const INLINE_VALUE_PATTERN:RegExp = new RegExp(/(\(){1}(.)+?(\:){1}(.)+?(\)){1}/g);

export class InlineValueInjector extends ValueInjector {

    private logger: Logger;

    constructor(parentLogger:Logger, valueSourceService:ValueSourceService){
        super(valueSourceService);
        this.logger = parentLogger.child('ReplacingValueInjector');
    }

    /**
     * Should be one of the first value injectors to run.
     */
    public getPriority():number {
        return 10;
    }

    /**
     * 
     * @param document to replace all values within.
     */
    public replaceAllIn(structuredDocument:StructuredDocument):Promise<StructuredDocument>{
        
        this.logger.debug('replaceAllIn() -->');

        const flattened:Map<string,any> = structuredDocument.getFlattened();
        const promises:Promise<void>[]  = Array.from(flattened.keys())
            .filter( (key:string) => INLINE_VALUE_PATTERN.test( flattened.get(key) ) )
            .map( (key:string) => {

                let   value:string                    = flattened.get(key);
                const matches:RegExpMatchArray | null = value.match(INLINE_VALUE_PATTERN);
                let   promiseChain:Promise<void>      = Promise.resolve();

                this.logger.debug({key,value,matches});

                if(!matches) return Promise.resolve();

                matches
                    .reduce( (accumulator:string[],value:string) => {
                        if(accumulator.indexOf(value) === -1) accumulator.push(value);
                        return accumulator;
                    },[])
                    .map( (match:string) => {
                    
                        const valueARN:string = match.replace(/\(?\)?/g,'');
                        
                        /**
                         * Resolving each value in the chain serially ensures that we
                         * will not end up with paralelle workers clobering values
                         * as others are trying to resolve them.
                         */
                        promiseChain = promiseChain
                            .then( () => this.getValueSource(valueARN) )
                            .then( (valueSource:ValueSource | undefined) => valueSource ? valueSource.getValue(valueARN) : Promise.reject('-skip-') )
                            .then( (resolvedValue:string | undefined) => {
                                //TODO Be nice to consider a wider contexst
                                //     to allow this exception to not be thrown
                                //     when the inline value is inconsiquential.
                                //     For now its assumed it could be within the
                                //     pattern of another value and must resolve.
                                if(!resolvedValue) throw `No value found for ${match} at ${key}.`;
                                this.logger.info(`Replacing "${value}" with "${resolvedValue}" in "${key}".`);
                                value = structuredDocument.updateValue(key,value.replace(match,resolvedValue));
                            })
                            .catch( (error: Error | string) => {
                                if(error !== '-skip-') throw error;
                            })
                    });

                return promiseChain;
            })

        return Promise.all(promises)
            .then( () => {
                this.logger.debug('replaceAllIn() <-- ');
                return structuredDocument
             });
    }
}