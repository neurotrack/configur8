import { AWSError, SSM }                 from 'aws-sdk';
import { PromiseResult }                 from 'aws-sdk/lib/request';
import { GetParameterResult, Parameter } from 'aws-sdk/clients/ssm';
import { AWSFacade }                     from '../lib/aws';
import { ValueSource }                   from './value-source-service';
import { Logger }                        from '../lib/logger';
import { ValueRN }                       from '../value-injector/value-injector';


/**
 * Coordinates the lookup of a secret for the secret arn provided.
 */
export default class AWSParameterStoreValueSource implements ValueSource {
  
  private ssm:SSM;
  private parameterCache:Map<string,string>;
  private logger:Logger;

  constructor(parentLogger?:Logger) {
    this.ssm = new SSM({
      apiVersion: '2017-10-17',
      region: AWSFacade.getRegion(),
      credentials: AWSFacade.getCredentials()
    });
    this.parameterCache = new Map();
    this.logger = parentLogger ? parentLogger.child('AWSParameterStoreValueSource') : new Logger('AWSParameterStoreValueSource');
  }

  /**
   * What prefix this value source wil involve itself in.
   */
  public getPrefix():string {
    return 'aws-parameterstore';
  }

  /**
   * Resolves the named value to a specific value within a bundle, and returns it.
   * 
   * @param named 
   */
  public getValue(nameARN:string):Promise<string | undefined> {

    this.logger.debug('getValue() --> ',{nameARN});

    const valueARN:ValueRN          = new ValueRN(nameARN);
    const value: string | undefined = this.parameterCache.get(valueARN.valueName);

    this.logger.debug('getValue() valueARN',{valueARN});

    if(value) return Promise.resolve(value);

    try{

      return this.ssm
        .getParameter({
          Name: valueARN.valueName,
          WithDecryption: true
        })
        .promise()
        .then( (response:PromiseResult<GetParameterResult, AWSError>) => {

          if (response instanceof Error) throw response;

          const parameter: Parameter | undefined = (<GetParameterResult>response).Parameter;
          
          if(!parameter) {
            this.logger.debug(`getValue() <-- ${nameARN} No values in parameter`, parameter);
            return undefined;
          }

          this.logger.debug(`getValue() <-- ${nameARN}`,{'parameter.Value':parameter.Value});

          return parameter.Value;

        })
        .catch( (error:any) => {
          this.logger.error('getValue() <-- Error on',{nameARN});
          return Promise.reject(error);
        });

    } catch(error) {
      this.logger.error('getValue() <-- Exception on',{nameARN});
      throw error;
    }
  }
} 
