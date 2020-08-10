"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yamlJS = require("js-yaml");
const utils_1 = require("../lib/utils");
const logger_1 = require("../lib/logger");
exports.VALUE_PATTERN = new RegExp(/([A-Za-z0-9-_(])+?(:){1}([A-Za-z0-9_()\/\:])+/g);
/**
 * Possible output
 */
var FileFormat;
(function (FileFormat) {
    FileFormat["JSON"] = "JSON";
    FileFormat["YAML"] = "YAML";
})(FileFormat = exports.FileFormat || (exports.FileFormat = {}));
class StructuredDocumentFactory {
    static setLogger(logger) {
        StructuredDocumentFactory.LOGGER = logger;
    }
    /**
     *
     * @param inFile to parse and return wrapped in a StructuredDocument instance.
     * @param sourceFormat to read the file as.
     */
    static build(inFile, sourceFormat) {
        StructuredDocumentFactory.LOGGER.debug(`build() - File type ${typeof (inFile)} sourceFormat ${sourceFormat}`);
        switch (sourceFormat) {
            case FileFormat.JSON:
                StructuredDocumentFactory.LOGGER.debug(`build() - Parsing file using JSON.`);
                const originalJson = inFile instanceof Buffer ? JSON.parse(inFile.toString('utf8')) : typeof (inFile) === 'string' ? JSON.parse(inFile) : inFile;
                return new StructuredDocument(originalJson, sourceFormat);
            case FileFormat.YAML:
                StructuredDocumentFactory.LOGGER.debug(`build() - Parsing file using YAML.`);
                const file = inFile instanceof Buffer ? inFile.toString('utf8') : typeof (inFile) === 'string' ? inFile : '' + inFile;
                const originalYaml = yamlJS.safeLoad(file);
                return new StructuredDocument(originalYaml, sourceFormat);
            default:
                throw Error(`The file format provided (${sourceFormat}) is not yet handled.`);
        }
    }
}
StructuredDocumentFactory.LOGGER = new logger_1.Logger('StructuredDocumentFactory');
exports.StructuredDocumentFactory = StructuredDocumentFactory;
/**
 * Wraps around the document read in and provides facilities for
 * updating it to return a finalized document with values replaced
 * and updated.
 */
class StructuredDocument {
    constructor(original, sourceFormat) {
        this.original = original;
        this.originalFileFormat = sourceFormat;
        this.finalized = Object.assign({}, this.original);
    }
    getOriginal() {
        return this.original;
    }
    getOriginalFileFormat() {
        return this.originalFileFormat;
    }
    /**
     * Flattens the manipulated document, that has been updated,
     * in a single level object.
     */
    getFlattened() {
        const flattened = utils_1.Utils.flatten(this.finalized);
        return Object
            .keys(flattened)
            .reduce((accumulator, key) => {
            accumulator.set(key, flattened[key]);
            return accumulator;
        }, new Map());
    }
    /**
     * Updates a value within this document. The key
     * is expected to be the root level key, or dot notation
     * to the key to be updated.
     *
     * For arrays, the index should be a part of the final
     * step of the key, in brackets. path.to.array[0] for
     * example would update the first value of the array
     * found in the path.to objects.
     *
     * @param key in dot notation of the value to update.
     * @param _value the value to use.
     */
    updateValue(key, _value) {
        const keyPaths = key.split('.');
        const finalKey = keyPaths.pop() || '';
        const lastAttribute = keyPaths.reduce((accumulator, key) => accumulator[key], this.finalized);
        if (finalKey.indexOf('[') !== -1) {
            const arrayKey = finalKey.substring(0, finalKey.indexOf('['));
            const index = finalKey.substring(finalKey.indexOf('[') + 1, finalKey.indexOf(']'));
            lastAttribute[arrayKey][Number(index)] = _value;
        }
        else {
            lastAttribute[finalKey] = _value;
        }
        return lastAttribute[finalKey];
    }
    /**
     * The finalized object with values replaced.
     */
    getFinal(_fileFormat) {
        const fileFormat = _fileFormat || this.getOriginalFileFormat();
        switch (fileFormat) {
            case FileFormat.YAML:
                return Buffer.from(yamlJS.dump(this.finalized, {
                    indent: 4,
                    lineWidth: 120,
                    noRefs: true,
                    sortKeys: (first, second) => {
                        if (StructuredDocument.PRIORITY_KEYS.indexOf(first))
                            return 1;
                        if (StructuredDocument.PRIORITY_KEYS.indexOf(second))
                            return -1;
                        return second.localeCompare(first);
                    }
                }));
            case FileFormat.JSON:
            default:
                return Buffer.from(JSON.stringify(this.finalized, null, 4));
        }
    }
    /**
     * Returns all of the values on the flattened list of values from the original. Optionally
     * a filter can be specified to reduce the list further.
     *
     * @param filter to reduce the values returned by.
     */
    getValues(filter) {
        return Array.from(this.getFlattened().values())
            .filter((value) => typeof (value) === 'string')
            .filter((value) => filter ? filter(value) : true)
            /* Remove duplicates */
            .reduce((accumulator, value) => {
            if (accumulator.indexOf(value) === -1)
                accumulator.push(value);
            return accumulator;
        }, []);
    }
}
StructuredDocument.PRIORITY_KEYS = ['name', 'label', 'title'];
exports.StructuredDocument = StructuredDocument;
