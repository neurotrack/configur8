import { ValueSource, ValueSourceService } from "../value-sources/value-source-service";
import { StructuredDocument }              from "../structured-document/structured-document";

export enum ValueStructure {
    STRING,
    ARRAY
}

export class ValueRN {

    public readonly prefix:string;
    public readonly valueName:string;
    public readonly subValueName:string | undefined;
    public readonly structure:ValueStructure;

    constructor(valueARN:string){
        const parts = valueARN.split(':');

        if(parts.length < 2) throw `Invalid value ARN ${valueARN}. Must have at least a prefix and value name, separated by a colon (:).`

        this.prefix    = parts.shift() || '';
        this.valueName = parts.shift() || '';
        this.structure    = ValueStructure.STRING;

        if(parts.length !== 0) {
            this.subValueName = parts.shift();
        }

        if(!!this.subValueName && this.subValueName.indexOf('@') !== -1) {
            this.subValueName = this.subValueName.replace('@','');
            this.structure    = ValueStructure.ARRAY;
        }
    }

    public getValuePattern(): string {
        return `${this.valueName}${this.subValueName ? ':' : ''}${this.subValueName ? this.subValueName : ''}`;
    }

}

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

    /**
     * Most values will be a string, however, some may have a decorator
     * in the ARN that will indicate it should be returned as a JSON object.
     * 
     * @param valueARN Of the value to translate.
     * @param value To translate.
     */
    protected translateValue(valueRN: ValueRN, value: string | undefined):string | string[] | undefined{
        if(!value) return value;
        if(valueRN.structure===ValueStructure.STRING) return value;
        return value.split(',');
    }
}