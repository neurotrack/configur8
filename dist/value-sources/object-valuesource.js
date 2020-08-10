"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../lib/logger");
/**
 * Value source implemented with a simple flat JSON object.
 */
class ObjectValueSource {
    constructor(parentLogger) {
        const argsIndex = process.argv.indexOf(ObjectValueSource.ARG_NAME);
        this.logger = parentLogger ? parentLogger.child('ObjectValueSource') : new logger_1.Logger('ObjectValueSource');
        this.source = process.argv[argsIndex + 1]
            .split(',')
            .reduce((accumulator, value) => {
            accumulator[value.split('=')[0].toUpperCase()] = value.split('=')[1];
            return accumulator;
        }, {});
        this.logger.info(`Command line args ${JSON.stringify(this.source)}`);
    }
    getPrefix() {
        return 'cli';
    }
    getValue(nameRN) {
        this.logger.debug('getValue() -->', { nameRN });
        const name = (nameRN.indexOf(':') !== -1 ? nameRN.split(':')[1] : nameRN).toUpperCase();
        const value = this.source[name];
        this.logger.debug('getValue() <-- ', { nameRN, value });
        return Promise.resolve(value);
    }
}
ObjectValueSource.ARG_NAME = '--args';
exports.default = ObjectValueSource;
