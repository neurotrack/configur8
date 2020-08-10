/// <reference types="node" />
import { FileFormat } from './structured-document/structured-document';
import { Logger } from './lib/logger';
/**
 * Entrypoint object into variable lookup and replacement behavior.
 */
export declare class ValueLookup {
    private logger;
    private outputFormat;
    private inputFormat;
    private valueSourceService;
    constructor(parentLogger?: Logger);
    /**
     * The output format will be a buffer that can be written directly to a
     * file. Either JSON or YAML is valid.
     *
     * @param outputFormat to return the document in.
     */
    setOutputFormat(outputFormat: FileFormat): this;
    /**
     *
     * @param inputFormat to parse the document as.
     */
    setInputFormat(inputFormat: FileFormat): this;
    /**
     *
     */
    execute(inFile: Buffer | string | object): Promise<Buffer>;
}
