import { ValueSourceService } from "../value-sources/value-source-service";
import { ValueInjector } from "./value-injector";
import { Logger } from "../lib/logger";
/**
 * Creates a usable list of value injectors.
 *
 */
export declare class ValueInjectorArrayBuilder {
    private static LOGGER;
    static setLogger(logger: Logger): void;
    static build(valueSourceService: ValueSourceService): ValueInjector[];
}
