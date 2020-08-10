"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const logger_1 = require("../lib/logger");
class ValueSourceService {
    constructor(parentLogger) {
        this.logger = parentLogger ? parentLogger.child('ValueSourceService') : new logger_1.Logger('ParentSourceService');
    }
    /**
     * Returns a list of all known prefixes.
     */
    prefixes() {
        this.logger.debug('prefixes() -->');
        return this.getValueSources()
            .then((valueSources) => valueSources.map((valueSource) => valueSource.getPrefix()))
            .then((prefixes) => {
            this.logger.debug(`prefixes() <-- ${prefixes}`);
            return prefixes;
        });
    }
    /**
     *
     * @param prefix Of the value source to return.
     */
    getValueSource(_prefix) {
        this.logger.debug('getValueSource() -->', { _prefix });
        const prefix = _prefix.indexOf(':') !== -1 ? _prefix.substring(0, _prefix.indexOf(':')) : _prefix;
        return this.getValueSources()
            .then((valueSources) => {
            const valueSource = valueSources.find((value) => value.getPrefix() === prefix);
            if (!valueSource)
                this.logger.debug(`No source could be found with the prefix "${prefix}:".`);
            return Promise.resolve(valueSource);
        });
    }
    /**
     *
     */
    getValueSources() {
        this.logger.debug('getValueSources() -->', {
            rootPath: path.resolve(__dirname, './'),
            valueSources: this.valueSources,
            loading: this.loading
        });
        if (!this.valueSources && this.loading) {
            return this.loading;
        }
        else if (!this.valueSources) {
            const rootPath = path.resolve(__dirname, './');
            const valueSourceClasses = fs.readdirSync(rootPath)
                .filter((name) => name.endsWith('-valuesource.ts') || name.endsWith('-valuesource.js'))
                .map((name) => {
                this.logger.debug('getValueSources() -- filename', { name, path: path.resolve(rootPath, './', name) });
                return name;
            })
                .map((name) => Promise.resolve().then(() => require(path.resolve(rootPath, './', name))));
            this.logger.debug('getValueSources() --', { valueSourceClasses });
            return this.loading = Promise.all(valueSourceClasses)
                .then((resolved) => resolved
                .map(resolve => resolve.default)
                .map(clazz => new clazz(this.logger)))
                .then((valueSources) => {
                this.logger.debug('getValueSources() <-- just loaded.', { valueSources });
                return this.valueSources = valueSources;
            });
        }
        else {
            this.logger.debug(`getValueSources() <-- from cache`);
            return Promise.resolve(this.valueSources);
        }
    }
}
exports.ValueSourceService = ValueSourceService;
