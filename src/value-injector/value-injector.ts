import { ValueSource, ValueSourceService }        from "../value-sources/value-source-service";
import { StructuredDocument } from "../structured-document/structured-document";

/**
 * Provides an abstraction between the types of value injection
 * that can be provided, and the value sources that are suplying
 * the values to be injected. With each new strategy we have a
 * new implementation of this type.
 */
export abstract class ValueInjector {

    private valueSourceService: ValueSourceService;

    constructor(valueSourceService:ValueSourceService){
        this.valueSourceService = valueSourceService;
    }

    /**
     * What the priority order is for this specific ValueInjector
     * wants to run in relative to other value injectors. Will be used
     * to sort a collection of ValueIjectors.
     */
    public abstract getPriority():number;

    /**
     * 
     * @param document 
     */
    abstract replaceAllIn(document:StructuredDocument):Promise<StructuredDocument>;

    /**
     * 
     * @param _prefix or full valueARN to locate a ValueSource using.
     */
    protected getValueSource(_prefix: string): Promise<ValueSource | undefined> {
        return this.valueSourceService.getValueSource(_prefix);
    }

    protected log(message:string,level?:string){
        if(level && 'ERROR' === level.toUpperCase()) console.log(``)
    }
}