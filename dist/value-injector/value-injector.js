"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ValueStructure;
(function (ValueStructure) {
    ValueStructure[ValueStructure["STRING"] = 0] = "STRING";
    ValueStructure[ValueStructure["ARRAY"] = 1] = "ARRAY";
})(ValueStructure = exports.ValueStructure || (exports.ValueStructure = {}));
class ValueRN {
    constructor(valueARN) {
        const parts = valueARN.split(':');
        if (parts.length < 2)
            throw `Invalid value ARN ${valueARN}. Must have at least a prefix and value name, separated by a colon (:).`;
        this.prefix = parts.shift() || '';
        this.valueName = parts.shift() || '';
        this.structure = ValueStructure.STRING;
        if (parts.length !== 0) {
            this.subValueName = parts.shift();
        }
        if (!!this.valueName && this.valueName.indexOf('@') !== -1) {
            this.valueName = this.valueName.replace('@', '');
            this.structure = ValueStructure.ARRAY;
        }
        if (!!this.subValueName && this.subValueName.indexOf('@') !== -1) {
            this.subValueName = this.subValueName.replace('@', '');
            this.structure = ValueStructure.ARRAY;
        }
    }
    getValuePattern() {
        return `${this.valueName}${this.subValueName ? ':' : ''}${this.subValueName ? this.subValueName : ''}`;
    }
}
exports.ValueRN = ValueRN;
/**
 * Provides an abstraction between the types of value injection
 * that can be provided, and the value sources that are suplying
 * the values to be injected. With each new strategy we have a
 * new implementation of this type.
 */
class ValueInjector {
    constructor(valueSourceService) {
        this.valueSourceService = valueSourceService;
    }
    /**
     *
     * @param _prefix or full valueARN to locate a ValueSource using.
     */
    getValueSource(_prefix) {
        return this.valueSourceService.getValueSource(_prefix);
    }
    /**
     * Most values will be a string, however, some may have a decorator
     * in the ARN that will indicate it should be returned as a JSON object.
     *
     * @param valueARN Of the value to translate.
     * @param value To translate.
     */
    translateValue(valueRN, value) {
        if (!value)
            return value;
        if (valueRN.structure === ValueStructure.STRING)
            return value;
        return value.split(',');
    }
}
exports.ValueInjector = ValueInjector;
