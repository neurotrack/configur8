import { Logger } from '../lib/logger';
/**
 * Defined interface for all ValueSources.
 */
export interface ValueSource {
    getValue(name: string): Promise<string | undefined>;
    getPrefix(): string;
}
export declare class ValueSourceService {
    private valueSources;
    private logger;
    private loading;
    constructor(parentLogger?: Logger);
    /**
     * Returns a list of all known prefixes.
     */
    prefixes(): Promise<string[]>;
    /**
     *
     * @param prefix Of the value source to return.
     */
    getValueSource(_prefix: string): Promise<ValueSource | undefined>;
    /**
     *
     */
    private getValueSources;
}
