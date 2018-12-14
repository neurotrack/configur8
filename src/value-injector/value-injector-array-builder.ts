import { InlineValueInjector } from "./inline-value-injector";
import { ValueSource, ValueSourceService } from "../value-sources/value-source-service";
import { ValueInjector } from "./value-injector";
import { Logger } from "../lib/logger";
import { ReplacingValueInjector } from "./replacement-value-injector";

/**
 * Creates a usable list of value injectors.
 * 
 */
export class ValueInjectorArrayBuilder {

    private static LOGGER: Logger = new Logger('ValueInjectorArrayBuilder')

    public static setLogger(logger:Logger){
        ValueInjectorArrayBuilder.LOGGER = logger;
    }

    public static build(valueSourceService:ValueSourceService):ValueInjector[] {
        ValueInjectorArrayBuilder.LOGGER.debug('build() -->');
        return [
                new InlineValueInjector(ValueInjectorArrayBuilder.LOGGER,valueSourceService),
                new ReplacingValueInjector(ValueInjectorArrayBuilder.LOGGER,valueSourceService)
            ]
            .sort( (first:ValueInjector, second:ValueInjector) => first.getPriority() - second.getPriority() )
            .map( (valueInjector:ValueInjector) => {
                ValueInjectorArrayBuilder.LOGGER.debug(`build() <-- ${valueInjector.getPriority()}`);
                return valueInjector;
            });
    }
}