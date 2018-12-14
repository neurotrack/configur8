

import { ValueSource, ValueSourceService } from './value-sources/value-source-factory';
import { StructuredDocument, FileFormat, StructuredDocumentFactory, VALUE_PATTERN } from './structured-document/structured-document';
import { ValueInjector } from './value-injector/value-injector';
import { ValueInjectorArrayBuilder } from './value-injector/value-injector-array-builder';
import { INLINE_VALUE_PATTERN } from './value-injector/inline-value-injector';

/**
 * Entrypoint object into variable lookup and replacement behavior.
 */
export class ValueLookup {

  private outputFormat: FileFormat;
  private inputFormat: FileFormat;
  private valueSourceService:ValueSourceService;

  constructor() {
    this.outputFormat       = FileFormat.JSON;
    this.inputFormat        = FileFormat.JSON;
    this.valueSourceService = new ValueSourceService();
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
    const valueInjectors:ValueInjector[]         = ValueInjectorArrayBuilder.build(this.valueSourceService);
    let   promise:Promise<StructuredDocument>    = Promise.resolve(structuredDocument);

    for( const valueInjector of valueInjectors) {
      promise = promise.then( () => valueInjector.replaceAllIn(structuredDocument) );
    }

    return promise
      //TODO Write the document in the requested format.
      .then( (structuredDocument:StructuredDocument) => Buffer.from( JSON.stringify(structuredDocument.getFinal(),null,4)) )
  }
}

new ValueLookup()
  .setOutputFormat(FileFormat.JSON)
  .setOutputFormat(FileFormat.JSON)
  .execute({
    // parent: {
      // foo: "cli:CLI_FOO Some Default"
    // },
    // environment: "cli:ENVIRONMENT DEV",
    // stage: "development",
    secret: "aws-secretmanager:/(cli:ENVIRONMENT)/(cli:CLI_FOO)/test:NONE",
    // list: [
    //   "cli:FOO_TOO",
    //   "(cli:FOO_TOO) Or Some Other Default"
    // ]
  })
  .then(buffer => console.log("DONE!!!!! ->", buffer.toString('utf8')))
  .catch(error => console.error(error))