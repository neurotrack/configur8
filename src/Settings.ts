export class Settings {

  private settings:any;
  
  constructor(){
    
    let currentValue:string | null = null;

    this.settings = process.argv.reduce( (accumulator:any,current:string) => {
      if(current.startsWith('--')) {
        currentValue = current.replace('--','');
      } else if(currentValue) {
        accumulator[currentValue] = current;
        currentValue = null;
      }
      return accumulator;
    },{});

    if(!this.get('--config') && !this.get('-c')) throw 'You must specify a configuration file to load.';

  }

  public get(name:string, alternateName?:string, defaultValue?:string):string {
    return this.settings[name] || defaultValue;
  }
  
}