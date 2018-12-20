import { ValueSourceService }        from './value-sources/value-source-service';
import { 
  StructuredDocument, 
  FileFormat, 
  StructuredDocumentFactory }        from './structured-document/structured-document';
import { ValueInjector }             from './value-injector/value-injector';
import { ValueInjectorArrayBuilder } from './value-injector/value-injector-array-builder';
import { Logger }                    from './lib/logger';

/**
 * Entrypoint object into variable lookup and replacement behavior.
 */
export class ValueLookup {

    private logger: Logger;
    private outputFormat: FileFormat;
    private inputFormat: FileFormat;
    private valueSourceService:ValueSourceService;

    constructor(parentLogger?:Logger) {
        this.outputFormat       = FileFormat.JSON;
        this.inputFormat        = FileFormat.JSON;
        this.logger             = parentLogger ? parentLogger.child('ValueLookup') : new Logger();
        this.valueSourceService = new ValueSourceService(this.logger);

        ValueInjectorArrayBuilder.setLogger(this.logger.child('ValueInjectorArrayBuilder'));
        StructuredDocumentFactory.setLogger(this.logger.child('StructuredDocumentFactory'));
    }

    /**
     * The output format will be a buffer that can be written directly to a
     * file. Either JSON or YAML is valid.
     * 
     * @param outputFormat to return the document in.
     */
    public setOutputFormat(outputFormat: FileFormat) {
        this.outputFormat = outputFormat;
        return this;
    }

    /**
     * 
     * @param inputFormat to parse the document as.
     */
    public setInputFormat(inputFormat: FileFormat) {
        this.inputFormat = inputFormat;
        return this;
    }

    /**
     * 
     */
    public execute(inFile: Buffer | string | object): Promise<Buffer> {

        if(!inFile) throw `There was no source file provided.`;
        if(this.inputFormat === undefined || this.inputFormat === null) throw `There is no input format specified.`;
        if(this.outputFormat === undefined || this.outputFormat === null) throw `There is no output format specified.`;

        const structuredDocument: StructuredDocument = StructuredDocumentFactory.build(inFile, this.inputFormat);
        const valueInjectors: ValueInjector[]        = ValueInjectorArrayBuilder.build(this.valueSourceService);
        let   promise :Promise<StructuredDocument>   = Promise.resolve(structuredDocument);

        for( const valueInjector of valueInjectors) {
            promise = promise.then( (structuredDocument:StructuredDocument) => {
                this.logger.debug('execute() ---->');
                this.logger.debug(structuredDocument.getFinal(FileFormat.JSON).toString());
                this.logger.debug('execute() <----');
                return valueInjector.replaceAllIn(structuredDocument) 
            });
        }

        return promise
          .then( (structuredDocument:StructuredDocument) => {
            this.logger.info(`Formatting output as ${this.outputFormat}.`);
            return structuredDocument.getFinal(this.outputFormat);
          })
    }
}