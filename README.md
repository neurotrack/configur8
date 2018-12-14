# Summary
Inject values into your structured text doc from remote or CLI sources.

# Value Lookup
Below is a list of prefixes you can use to indicate the location of the value to be looked up. WHen any of these value syntaxes are found as a value, then it will replace the entirety of the value when its located and if not located, it will be removed from the document.

* `cli:NAME_TO_LOOKUP` Will look for a command line argument passed in with the name specified. `a0deploy-variables --config ./file.yaml --output ./file.dev.yaml --NAME_TO_LOOKUP HELLO`
* `aws-secretmanager:/path/to/secret:VALUE_IN_SECRETS` This will lookup a secret bundle called `/path/to/secret` and within that bundle, it will look for a value called `VALUE_IN_SECRETS`. Currently this value must be a string.
* `aws-parameterstore:/path/to/parameter` This will lookup a parameters called `/path/to/parameter` in AWS Parameter Storer. Currently this value must be a string.

# Bounded replacement
In all cases where parenthesis are omitted, the value foudn will replace the value the value lookup is within. If you specify braces around the value lookup pattern, then only that section is replaced.

For example `(cli:FOO_TOO) Or Some Other Default`, where FOO_TOO = Genius will resolve to `Genius Or Some Other Default`. Can be useful when needing a reference, within another lookup pattern, or where values simply need to be augmented not replaced.

# Examples

```
tenant:
  environment: qa
  friendly_name: cli:ARG_NAME SOME_DEFAULT
  label: cli:ARG_NAME SOME_DEFAULT
  secret: secretmanager:/(dev)/auth0:SECRET_NAME
  key: (cli:ARG_NAME) Some other default.
  id: aws-parameterstore:/dev/
```

# Usage
1. Install `npm i -g auth0-deploy-cli-config-values aws-sdk`
1. Setup AWS `aws configure`. You can alternatively edit your .credentials file directly. The aws-sdk in use within this module will pickup the values appropriately. This includes being able to specify a profile at execution time. Make sure the account/profile you are using has permissions to read the secrets, see **Permissions** below for more details.
1. Update your configuration file for auth0 deploy CLI. Each value you want replaced must be in the format of secret:{aws secret manager path}:{key within secrets}. See more on this below.
1. Execute auth0-deploy-cli-config-values to modify your configuration file, before it is used. `a0deploy-config --profile dev --config ./a0deploy.json --output ./a0deploy.dev.json --profile some-profile`.

# YAML Example
Within your 'tenant' yaml file you can make reference to external configurations, such as all those client secrets and URL's. Its also possible to make some 

```
 - is_token_endpoint_ip_header_trusted: false
    name: Example Web
    is_first_party: true
    oidc_conformant: true
    sso_disabled: false
    cross_origin_auth: false
    description: ''
    logo_uri: ''
    sso: true
    callbacks: 
      - http://some-domain.com/index.html
      - http://some-domain.com/index.html
    allowed_logout_urls: []
    allowed_clients: []
    allowed_origins: 
      - http://some-domain.com/index.html
      - http://some-domain.com/index.html
    client_secret: 
    jwt_configuration:
      alg: RS256
      lifetime_in_seconds: 36000
      secret_encoded: false
    token_endpoint_auth_method: client_secret_post
    app_type: regular_web
    grant_types: @@CONSUMER_WEB_GRANT_TYPES@@
    web_origins:
      - http://some-domain.com
      - http://some-domain.com.other
    custom_login_page_on: true


```
# TODO
*  Update readme to have a cleaner organization around possible value sources.
* ADD xml support?
* What other structured document types?
* 

# Permissions
```
-  Effect: "Allow"
       Action:
          - "secretsmanager:DescribeSecret"
          - "secretsmanager:GetSecretValue"
       Resource:
          - arn:aws:secretsmanager:{AWS::Region}:{AWS::AccountId}:secret:/path/to/secret*
```
# CLI Arguments
Use --help to get a complete list of commands.
