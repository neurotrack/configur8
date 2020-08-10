import { ValueSource } from './value-source-service';
import { Logger } from '../lib/logger';
/**
 * Coordinates the lookup of a secret for the secret arn provided.
 */
export default class AWSSecretManagerValueSource implements ValueSource {
    private secretsManager;
    private secretBundles;
    private logger;
    constructor(parentLogger?: Logger);
    /**
     * What prefix this value source wil involve itself in.
     */
    getPrefix(): string;
    /**
     * Resolves the named value to a specific value within a bundle, and returns it.
     *
     * @param named
     */
    getValue(nameARN: string): Promise<string>;
    /**
     * Returns the existing or creates a new SecretBundle for the
     * bundle name provided.
     *
     * @param bundleName of the secrets to return.
     */
    private getSecretsBundle;
}
