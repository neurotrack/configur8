export declare let rootCommand: string;
/**
 * Possible log levels, DEBUG the most fine grained, followed by
 * INFO and then ERROR.
 */
export declare enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    ERROR = "ERROR"
}
/**
 * Used to change the default global logging level.
 */
export declare let logLevel: LogLevel;
/**
 * Convenience method for logging progress messages to the console
 *
 * @param {string} message
 * @param {string} level
 */
export declare const log: (message: string, level?: LogLevel | undefined, prefix?: string | undefined, context?: object | undefined) => void;
/**
 * Helper function to dump a bunch of diagnostic details to the
 * console to help diagnose runtime issues.
 */
export declare const diagnosticDump: () => void;
/**
 * Logger with state, so different objects can be
 * set to different levels.
 */
export declare class Logger {
    private level;
    private prefix;
    private children;
    constructor(name?: string, level?: LogLevel);
    debug(message: string, context?: object): void;
    info(message: string, context?: object): void;
    error(message: string, context?: object): void;
    child(name: string): Logger;
    setLevel(level: LogLevel): void;
    private setPrefix;
}
