
export let rootCommand:string = `${process.argv[0]}-${process.env['LOGNAME']}`;

/**
 * Possible log levels, DEBUG the most fine grained, followed by
 * INFO and then ERROR.
 */
export enum LogLevel{
    DEBUG = 'DEBUG',
    INFO  = 'INFO',
    ERROR = 'ERROR'
}

/**
 * Used to change the default global logging level.
 */
export let logLevel:LogLevel = LogLevel.INFO;

/**
 * Convenience method for logging progress messages to the console
 * 
 * @param {string} message 
 * @param {string} level 
 */
export const log = (message:string, level?:LogLevel, prefix?:string, context?:object) => {

    const timestamp: number   = Date.now();
    const output: string      = typeof(message) === 'string' ? message : JSON.stringify(message, (key, value) => {
        if( key == 'parent') { return '[object]';}
        else {return value;}
    },4);
    const thisLevel: LogLevel = level || LogLevel.INFO;
    const subject:string      =  prefix || rootCommand;

    if(LogLevel.ERROR !== level) {
        if(context) console.log(`${timestamp} -- [${thisLevel}] ${subject} ${output}`,context);
        else console.log(`${timestamp} -- [${thisLevel}] ${subject} ${output}`);
    } else {
        if(context) console.error(`${timestamp} -- [ERROR] ${subject} ${output}`,context);
        else console.error(`${timestamp} -- [ERROR] ${subject} ${output}`);
    }
}

/**
 * Helper function to dump a bunch of diagnostic details to the 
 * console to help diagnose runtime issues.
 */
export const diagnosticDump = () => log('Diagnostics!',LogLevel.INFO,'diagnostics',{
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
export class Logger {

    private level: LogLevel;
    private prefix: string[];
    private children: Logger[];

    constructor(name?:string, level?:LogLevel){
        this.level    = level || logLevel || LogLevel.INFO;
        this.prefix   = [name || rootCommand];
        this.children = [];
    }

    public debug(message:string, context?:object):void {
        if(LogLevel.DEBUG === this.level) log(message, LogLevel.DEBUG, this.prefix.join('.'), context);
    }

    public info(message:string, context?:object):void {
        if(LogLevel.INFO >= this.level) log(message, LogLevel.INFO, this.prefix.join('.'), context);
    }

    public error(message:string, context?:object):void {
        log(message, LogLevel.ERROR, this.prefix.join('.'), context);
    }

    public child(name:string):Logger {
        const logger:Logger = new Logger(name,this.level);
        logger.setPrefix(this.prefix.concat(name));
        this.children.push(logger);
        return logger;
    }

    public setLevel(level:LogLevel){
        this.level = level;
        this.children.forEach( (child:Logger) => child.setLevel(this.level) );
    }

    private setPrefix(prefix:string[]) {
        this.prefix = prefix;
    }
}