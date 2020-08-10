"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const value_injector_1 = require("./value-injector");
/**
 * Matches on any word chunks that have a semi colon, and is wrapped within
 * braces ( ).
 */
exports.INLINE_VALUE_PATTERN = new RegExp(/(\(){1}(.)+?(\:){1}(.)+?(\)){1}/g);
class InlineValueInjector extends value_injector_1.ValueInjector {
    constructor(parentLogger, valueSourceService) {
        super(valueSourceService);
        this.logger = parentLogger.child('InlineValueInjector');
    }
    /**
     * Should be one of the first value injectors to run.
     */
    getPriority() {
        return 10;
    }
    /**
     *
     * @param document to replace all values within.
     */
    replaceAllIn(structuredDocument) {
        this.logger.debug('replaceAllIn() -->');
        const flattened = structuredDocument.getFlattened();
        const promises = Array.from(flattened.keys())
            .filter((key) => typeof (flattened.get(key)) === 'string')
            .map((key) => {
            const value = flattened.get(key);
            return {
                key,
                value,
                matches: value.match(exports.INLINE_VALUE_PATTERN)
            };
        })
            .filter((tuple) => tuple['matches'])
            .map((tuple) => {
            const key = tuple['key'];
            const matches = tuple['matches'];
            let value = tuple['value'];
            let promiseChain = Promise.resolve();
            this.logger.debug('replaceAllIn() -- tuple', { tuple, matches });
            if (!matches)
                return Promise.resolve();
            matches
                .reduce((accumulator, value) => {
                if (accumulator.indexOf(value) === -1)
                    accumulator.push(value);
                return accumulator;
            }, [])
                .map((match) => {
                const valueRN = new value_injector_1.ValueRN(match.replace(/\(?\)?/g, ''));
                if (valueRN.structure !== value_injector_1.ValueStructure.STRING)
                    throw `Inline values can only be strings. Remove the @ marker from the value for the key ${key}.`;
                /**
                 * Resolving each value in the chain serially ensures that we
                 * will not end up with paralelle workers clobering values
                 * as others are trying to resolve them.
                 */
                promiseChain = promiseChain
                    .then(() => this.getValueSource(valueRN.prefix))
                    .then((valueSource) => valueSource ? valueSource.getValue(valueRN.getValuePattern()) : Promise.reject('-skip-'))
                    .then((resolvedValue) => this.translateValue(valueRN, resolvedValue))
                    .then((resolvedValue) => {
                    //TODO Be nice to consider a wider contexst
                    //     to allow this exception to not be thrown
                    //     when the inline value is inconsiquential.
                    //     For now its assumed it could be within the
                    //     pattern of another value and must resolve.
                    if (!resolvedValue)
                        throw `No value found for ${match} at ${key}.`;
                    value = structuredDocument.updateValue(key, value.replace(match, resolvedValue));
                    this.logger.info(`Replaced "${match}" with "${resolvedValue}" in "${key}".\n new value = ${value}`);
                })
                    .catch((error) => {
                    if (error !== '-skip-')
                        throw error;
                });
            });
            return promiseChain;
        });
        return Promise.all(promises)
            .then(() => {
            this.logger.debug('replaceAllIn() <-- ');
            return structuredDocument;
        });
    }
}
exports.InlineValueInjector = InlineValueInjector;
