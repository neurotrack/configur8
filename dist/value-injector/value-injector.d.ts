import { ValueSource, ValueSourceService } from "../value-sources/value-source-service";
import { StructuredDocument } from "../structured-document/structured-document";
export declare enum ValueStructure {
    STRING = 0,
    ARRAY = 1
}
export declare class ValueRN {
    readonly prefix: string;
    readonly valueName: string;
    readonly subValueName: string | undefined;
    readonly structure: ValueStructure;
    constructor(valueARN: string);
    getValuePattern(): string;
}
/**
 * Provides an abstraction between the types of value injection
 * that can be provided, and the value sources that are suplying
 * the values to be injected. With each new strategy we have a
 * new implementation of this type.
 */
export declare abstract class ValueInjector {
    private valueSourceService;
    constructor(valueSourceService: ValueSourceService);
    /**
     * What the priority order is for this specific ValueInjector
     * wants to run in relative to other value injectors. Will be used
     * to sort a collection of ValueIjectors.
     */
    abstract getPriority(): number;
    /**
     *
     * @param document
     */
    abstract replaceAllIn(document: StructuredDocument): Promise<StructuredDocument>;
    /**
     *
     * @param _prefix or full valueARN to locate a ValueSource using.
     */
    protected getValueSource(_prefix: string): Promise<ValueSource | undefined>;
    /**
     * Most values will be a string, however, some may have a decorator
     * in the ARN that will indicate it should be returned as a JSON object.
     *
     * @param valueARN Of the value to translate.
     * @param value To translate.
     */
    protected translateValue(valueRN: ValueRN, value: string | undefined): string | string[] | undefined;
}
