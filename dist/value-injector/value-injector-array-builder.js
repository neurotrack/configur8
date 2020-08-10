"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inline_value_injector_1 = require("./inline-value-injector");
const logger_1 = require("../lib/logger");
const replacement_value_injector_1 = require("./replacement-value-injector");
/**
 * Creates a usable list of value injectors.
 *
 */
class ValueInjectorArrayBuilder {
    static setLogger(logger) {
        ValueInjectorArrayBuilder.LOGGER = logger;
    }
    static build(valueSourceService) {
        ValueInjectorArrayBuilder.LOGGER.debug('build() -->');
        return [
            new inline_value_injector_1.InlineValueInjector(ValueInjectorArrayBuilder.LOGGER, valueSourceService),
            new replacement_value_injector_1.ReplacingValueInjector(ValueInjectorArrayBuilder.LOGGER, valueSourceService)
        ]
            .sort((first, second) => first.getPriority() - second.getPriority())
            .map((valueInjector) => {
            ValueInjectorArrayBuilder.LOGGER.debug('build() <--', { priority: valueInjector.getPriority() });
            return valueInjector;
        });
    }
}
ValueInjectorArrayBuilder.LOGGER = new logger_1.Logger('ValueInjectorArrayBuilder');
exports.ValueInjectorArrayBuilder = ValueInjectorArrayBuilder;
