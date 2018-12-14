import * as path from 'path';
import * as fs   from 'fs';


/**
 * Defined interface for all ValueSources.
 */
export interface ValueSource {
    getValue(name:string):Promise<string>;
    getPrefix():string;
}


export class ValueSourceService{

    private valueSources:ValueSource[] | undefined;

    constructor(){
    }

    /**
     * Returns a list of all known prefixes.
     */
    public prefixes():Promise<string[]> {
        return this.getValueSources()
          .then( (valueSources:ValueSource[]) => valueSources.map( (valueSource:ValueSource) => valueSource.getPrefix() ) )
    }

    /**
     * 
     * @param prefix Of the value source to return.
     */
    public getValueSource(_prefix:string):Promise<ValueSource> {
        const prefix:string = _prefix.indexOf(':') !== -1 ? _prefix.substring(0,_prefix.indexOf(':')) : _prefix;
        return this.getValueSources()
            .then( (valueSources:ValueSource[]) => {
                const valueSource:ValueSource | undefined = valueSources.find( (value:ValueSource) => value.getPrefix() === prefix );
                if(!valueSource) return Promise.reject(`No value source could be found with the prefix ${prefix}.`);
                return Promise.resolve(valueSource);
            });
    }

    /**
     * 
     */
    private getValueSources():Promise<ValueSource[]>{

        if(!this.valueSources) {

            const valueSourceClasses = fs.readdirSync(path.resolve(__dirname, './'))
                .filter( (name:string) => name.endsWith('-valuesource.ts') )
                .map( (name:string) => import(path.resolve(__dirname, './', name) ) )

            return Promise.all(valueSourceClasses)
                .then( (resolved:any[]) => resolved
                    .map( resolve => resolve.default )
                    .map( clazz => new clazz() )
                )
                .then( (valueSources:ValueSource[]) => this.valueSources = valueSources );

        } else {
            return Promise.resolve(this.valueSources);
        }
    }
}

