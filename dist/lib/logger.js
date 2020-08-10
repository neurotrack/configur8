"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootCommand = `${process.argv[0]}-${process.env['LOGNAME']}`;
/**
 * Possible log levels, DEBUG the most fine grained, followed by
 * INFO and then ERROR.
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
/**
 * Used to change the default global logging level.
 */
exports.logLevel = LogLevel.INFO;
/**
 * Convenience method for logging progress messages to the console
 *
 * @param {string} message
 * @param {string} level
 */
exports.log = (message, level, prefix, context) => {
    const timestamp = Date.now();
    const output = typeof (message) === 'string' ? message : JSON.stringify(message, (key, value) => {
        if (key == 'parent') {
            return '[object]';
        }
        else {
            return value;
        }
    }, 4);
    const thisLevel = level || LogLevel.INFO;
    const subject = prefix || exports.rootCommand;
    if (LogLevel.ERROR !== level) {
        if (context)
            console.log(`${timestamp} -- [${thisLevel}] ${subject} ${output}`, context);
        else
            console.log(`${timestamp} -- [${thisLevel}] ${subject} ${output}`);
    }
    else {
        if (context)
            console.error(`${timestamp} -- [ERROR] ${subject} ${output}`, context);
        else
            console.error(`${timestamp} -- [ERROR] ${subject} ${output}`);
    }
};
/**
 * Helper function to dump a bunch of diagnostic details to the
 * console to help diagnose runtime issues.
 */
exports.diagnosticDump = () => exports.log('Diagnostics!', LogLevel.INFO, 'diagnostics', {
    platform: process.platform,
    architecture: process.arch,
    processId: process.pid,
    executionPath: process.execPath,
    args: process.argv,
    versions: process.versions,
    environmentVariables: process.env
});
/**
 * Logger with state, so different objects can be
 * set to different levels.
 */
class Logger {
    constructor(name, level) {
        this.level = level || exports.logLevel || LogLevel.INFO;
        this.prefix = [name || exports.rootCommand];
        this.children = [];
    }
    debug(message, context) {
        if (LogLevel.DEBUG === this.level)
            exports.log(message, LogLevel.DEBUG, this.prefix.join('.'), context);
    }
    info(message, context) {
        if (LogLevel.INFO >= this.level)
            exports.log(message, LogLevel.INFO, this.prefix.join('.'), context);
    }
    error(message, context) {
        exports.log(message, LogLevel.ERROR, this.prefix.join('.'), context);
    }
    child(name) {
        const logger = new Logger(name, this.level);
        logger.setPrefix(this.prefix.concat(name));
        this.children.push(logger);
        return logger;
    }
    setLevel(level) {
        this.level = level;
        this.children.forEach((child) => child.setLevel(this.level));
    }
    setPrefix(prefix) {
        this.prefix = prefix;
    }
}
exports.Logger = Logger;
