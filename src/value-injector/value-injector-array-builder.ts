import { InlineValueInjector } from "./inline-value-injector";
import { ValueSource, ValueSourceService } from "../value-sources/value-source-factory";
import { ValueInjector } from "./value-injector";

/**
 * Creates a usable list of value injectors.
 * 
 */
export class ValueInjectorArrayBuilder {
    public static build(valueSourceService:ValueSourceService):ValueInjector[] {
        return [
            new InlineValueInjector(valueSourceService)
        ]
        .sort( (first:ValueInjector, second:ValueInjector) => first.getPriority() - second.getPriority() );
    }
}