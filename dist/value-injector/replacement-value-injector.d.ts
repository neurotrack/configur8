import { ValueInjector } from "./value-injector";
import { ValueSourceService } from "../value-sources/value-source-service";
import { StructuredDocument } from "../structured-document/structured-document";
import { Logger } from "../lib/logger";
/**
 * Matches on any word chunks that have a semi colon, and is wrapped within
 * braces ( ).
 */
export declare const REPLACEMENT_VALUE_PATTERN: RegExp;
export declare class ReplacingValueInjector extends ValueInjector {
    private logger;
    constructor(parentLogger: Logger, valueSourceService: ValueSourceService);
    /**
     * Should be one of the first value injectors to run.
     */
    getPriority(): number;
    /**
     *
     * @param document to replace all values within.
     */
    replaceAllIn(structuredDocument: StructuredDocument): Promise<StructuredDocument>;
    private replaceForOne;
}
