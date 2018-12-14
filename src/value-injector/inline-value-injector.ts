import { ValueInjector }      from "./value-injector";
import { ValueSource, ValueSourceService }        from "../value-sources/value-source-factory";
import { StructuredDocument } from "../structured-document/structured-document";

/**
 * Matches on any word chunks that have a semi colon, and is wrapped within
 * braces ( ).
 */
export const INLINE_VALUE_PATTERN:RegExp = new RegExp(/(\(){1}(.)+?(\:){1}(.)+?(\)){1}/g);

export class InlineValueInjector extends ValueInjector {

    constructor(valueSourceService:ValueSourceService){
        super(valueSourceService);
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

        const flattened:Map<string,any> = structuredDocument.getFlattened();
        const promises:Promise<void>[]  = Array.from(flattened.keys())
            .filter( (key:string) => INLINE_VALUE_PATTERN.test( flattened.get(key) ) )
            .map( (key:string) => {

                let   value:string                    = flattened.get(key);
                const matches:RegExpMatchArray | null = value.match(INLINE_VALUE_PATTERN);
                let   promiseChain:Promise<void>      = Promise.resolve();

                console.log("replaceAllIn()",{key,value,matches});

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
                            .then( (valueSource:ValueSource) => valueSource.getValue(valueARN) )
                            .then( (resolvedValue:string) => {
                                console.log("replaceAllIn() --- ",{match,resolvedValue,valueARN});
                                value = structuredDocument.updateValue(key,value.replace(match,resolvedValue));
                            })
                    });

                return promiseChain;
            })

        return Promise.all(promises)
            .then( () => structuredDocument );
    }
}