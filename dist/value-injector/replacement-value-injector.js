"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const value_injector_1 = require("./value-injector");
/**
 * Matches on any word chunks that have a semi colon, and is wrapped within
 * braces ( ).
 */
exports.REPLACEMENT_VALUE_PATTERN = new RegExp(/([A-Za-z0-9-_])+?(:){1}([A-Za-z0-9_/:()@])+/g);
class ReplacingValueInjector extends value_injector_1.ValueInjector {
    constructor(parentLogger, valueSourceService) {
        super(valueSourceService);
        this.logger = parentLogger.child('ReplacingValueInjector');
    }
    /**
     * Should be one of the first value injectors to run.
     */
    getPriority() {
        return 100;
    }
    /**
     *
     * @param document to replace all values within.
     */
    replaceAllIn(structuredDocument) {
        this.logger.debug('replaceAllIn() --> ');
        const flattened = structuredDocument.getFlattened();
        const promises = Array.from(flattened.keys())
            .filter((key) => typeof (flattened.get(key)) === 'string')
            .map((key) => {
            const value = flattened.get(key);
            return {
                key,
                value,
                matches: value.match(exports.REPLACEMENT_VALUE_PATTERN)
            };
        })
            .filter((tuple) => tuple['matches'])
            .map((tuple) => {
            this.logger.debug('replaceAllIn() -- tuple', tuple);
            const valueRN = new value_injector_1.ValueRN(tuple['value']);
            const key = tuple['key'];
            const matches = tuple['matches'];
            let promiseChain = Promise.resolve();
            let isReplaced = false;
            if (!matches)
                return Promise.resolve();
            matches
                .reduce((accumulator, matchValue) => {
                if (accumulator.indexOf(matchValue) === -1)
                    accumulator.push(matchValue);
                return accumulator;
            }, [])
                .map((match) => {
                /**
                 * Resolving each value in the chain serially ensures that we
                 * will not end up with paralelle workers clobering values
                 * as others are trying to resolve them.
                 */
                promiseChain = promiseChain
                    .then(() => !isReplaced ? this.replaceForOne(valueRN, key, match, structuredDocument) : true)
                    .then((didReplacement) => { isReplaced = didReplacement; });
            });
            return promiseChain;
        });
        return Promise.all(promises)
            .then(() => {
            this.logger.debug('replaceAllIn() <-- ');
            return structuredDocument;
        });
    }
    replaceForOne(valueRN, key, match, structuredDocument) {
        return this.getValueSource(match)
            .then((valueSource) => valueSource ? valueSource.getValue(match) : undefined)
            .then((resolvedValue) => this.translateValue(valueRN, resolvedValue))
            .then((resolvedValue) => {
            if (!resolvedValue) {
                this.logger.debug(`No value found for ${match}`);
                return false;
            }
            else {
                structuredDocument.updateValue(key, resolvedValue);
                this.logger.info(`Replaced "${valueRN.prefix}:${valueRN.getValuePattern()}" with "${resolvedValue}" in "${key}"`);
                return true;
            }
        });
    }
}
exports.ReplacingValueInjector = ReplacingValueInjector;
