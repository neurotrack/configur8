import * as path from 'path';
import * as fs   from 'fs';
import { Logger } from '../lib/logger';


/**
 * Defined interface for all ValueSources.
 */
export interface ValueSource {
    getValue(name:string):Promise<string | undefined>;
    getPrefix():string;
}


export class ValueSourceService{

    private valueSources: ValueSource[] | undefined;
    private logger: Logger;
    private loading: Promise<ValueSource[]> | undefined;

    constructor(parentLogger?:Logger){
      this.logger = parentLogger ? parentLogger.child('ValueSourceService') : new Logger('ParentSourceService');
    }

    /**
     * Returns a list of all known prefixes.
     */
    public prefixes():Promise<string[]> {
        this.logger.debug('prefixes() -->');
        return this.getValueSources()
          .then( (valueSources:ValueSource[]) => valueSources.map( (valueSource:ValueSource) => valueSource.getPrefix() ) )
          .then( (prefixes:string[]) => {
            this.logger.debug(`prefixes() <-- ${prefixes}`);
            return prefixes;
          });
    }

    /**
     * 
     * @param prefix Of the value source to return.
     */
    public getValueSource(_prefix:string):Promise<ValueSource | undefined> {
        this.logger.debug('getValueSource() -->', {_prefix});
        const prefix:string = _prefix.indexOf(':') !== -1 ? _prefix.substring(0,_prefix.indexOf(':')) : _prefix;
        return this.getValueSources()
            .then( (valueSources:ValueSource[]) => {
                const valueSource:ValueSource | undefined = valueSources.find( (value:ValueSource) => value.getPrefix() === prefix );
                if(!valueSource) this.logger.debug(`No source could be found with the prefix "${prefix}:".`);
                return Promise.resolve(valueSource);
            });
    }

    /**
     * 
     */
    private getValueSources():Promise<ValueSource[]>{

        this.logger.debug('getValueSources() -->',{
            rootPath:path.resolve(__dirname, './'),
            valueSources:this.valueSources,
            loading: this.loading
        });

        if(!this.valueSources && this.loading) {
          return this.loading;

        } else if(!this.valueSources) {

            const rootPath           = path.resolve(__dirname, './');
            const valueSourceClasses = fs.readdirSync(rootPath)
                .filter( (name: string) => name.endsWith('-valuesource.ts') || name.endsWith('-valuesource.js')  )
                .map( (name: string) => {
                    this.logger.debug('getValueSources() -- filename',{name,path:path.resolve(rootPath, './', name)});
                    return name;
                })
                .map( (name: string) => import(path.resolve(rootPath, './', name) ) );

            this.logger.debug('getValueSources() --',{valueSourceClasses});

            return this.loading = Promise.all(valueSourceClasses)
                .then( (resolved:any[]) => resolved
                    .map( resolve => resolve.default )
                    .map( clazz => new clazz(this.logger) )
                )
                .then( (valueSources:ValueSource[]) => {
                  this.logger.debug('getValueSources() <-- just loaded.',{valueSources});
                  return this.valueSources = valueSources 
                });

        } else {
            this.logger.debug(`getValueSources() <-- from cache`);
            return Promise.resolve(this.valueSources);
        }
    }
}