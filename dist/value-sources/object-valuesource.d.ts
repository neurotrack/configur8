import { ValueSource } from "./value-source-service";
import { Logger } from "../lib/logger";
/**
 * Value source implemented with a simple flat JSON object.
 */
export default class ObjectValueSource implements ValueSource {
    static ARG_NAME: string;
    private source;
    private logger;
    constructor(parentLogger?: Logger);
    getPrefix(): string;
    getValue(nameRN: string): Promise<string | undefined>;
}
