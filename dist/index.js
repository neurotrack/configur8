"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const value_source_service_1 = require("./value-sources/value-source-service");
const structured_document_1 = require("./structured-document/structured-document");
const value_injector_array_builder_1 = require("./value-injector/value-injector-array-builder");
const logger_1 = require("./lib/logger");
const aws_1 = require("./lib/aws");
/**
 * Entrypoint object into variable lookup and replacement behavior.
 */
class ValueLookup {
    constructor(parentLogger) {
        this.outputFormat = structured_document_1.FileFormat.JSON;
        this.inputFormat = structured_document_1.FileFormat.JSON;
        this.logger = parentLogger ? parentLogger.child('ValueLookup') : new logger_1.Logger();
        this.valueSourceService = new value_source_service_1.ValueSourceService(this.logger);
        value_injector_array_builder_1.ValueInjectorArrayBuilder.setLogger(this.logger.child('ValueInjectorArrayBuilder'));
        structured_document_1.StructuredDocumentFactory.setLogger(this.logger.child('StructuredDocumentFactory'));
    }
    /**
     * The output format will be a buffer that can be written directly to a
     * file. Either JSON or YAML is valid.
     *
     * @param outputFormat to return the document in.
     */
    setOutputFormat(outputFormat) {
        this.outputFormat = outputFormat;
        return this;
    }
    /**
     *
     * @param inputFormat to parse the document as.
     */
    setInputFormat(inputFormat) {
        this.inputFormat = inputFormat;
        return this;
    }
    /**
     *
     */
    execute(inFile) {
        if (!inFile)
            throw `There was no source file provided.`;
        if (this.inputFormat === undefined || this.inputFormat === null)
            throw `There is no input format specified.`;
        if (this.outputFormat === undefined || this.outputFormat === null)
            throw `There is no output format specified.`;
        const structuredDocument = structured_document_1.StructuredDocumentFactory.build(inFile, this.inputFormat);
        const valueInjectors = value_injector_array_builder_1.ValueInjectorArrayBuilder.build(this.valueSourceService);
        let promise = aws_1.AWSFacade.init()
            .then(() => structuredDocument);
        for (const valueInjector of valueInjectors) {
            promise = promise.then((structuredDocument) => valueInjector.replaceAllIn(structuredDocument));
        }
        return promise
            .then((structuredDocument) => {
            this.logger.info(`Formatting output as ${this.outputFormat}.`);
            return structuredDocument.getFinal(this.outputFormat);
        });
    }
}
exports.ValueLookup = ValueLookup;
