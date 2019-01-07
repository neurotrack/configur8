# Summary
Inject values into your structured text doc.


# Value Lookup
Below is a list of prefixes you can use to indicate the location of the value to be looked up. WHen any of these value syntaxes are found as a value, then it will replace the entirety of the value when its located and if not located, it will be removed from the document.


* `cli:NAME_TO_LOOKUP` Will look for a command line argument passed in with the name specified. `a0deploy-variables --config ./file.yaml --output ./file.dev.yaml --NAME_TO_LOOKUP HELLO`
* `aws-secretmanager:/path/to/secret:VALUE_IN_SECRETS` This will lookup a secret bundle called `/path/to/secret` and within that bundle, it will look for a value called `VALUE_IN_SECRETS`. Currently this value must be a string.
* `aws-parameterstore:/path/to/parameter` This will lookup a parameters called `/path/to/parameter` in AWS Parameter Storer. Currently this value must be a string.


## String Array
Its possible to format your value as a list of string values separated by a comma. If so, you can end your varaiable pattern with an @ symbol to tell configur8 to insert a list of string's instead of a single string value.


# Inline Replacement
In all cases where parenthesis are omitted, the value foudn will replace the value the value lookup is within. If you specify braces around the value lookup pattern, then only that section is replaced.

For example `(cli:FOO_TOO) Or Some Other Default`, where FOO_TOO = Genius will resolve to `Genius Or Some Other Default`. Can be useful when needing a reference, within another lookup pattern, or where values simply need to be augmented not replaced.

# Usage
1. Install `npm i -g structured-doc-vars aws-sdk`
1. View the CLI options `doc-vars --help`

# AWS 

## Configurations
* **AWS_DEFAULT_REGION** Will be used to define the region when initializing AWS service clients.
* **AWS_REGION** Will be used to define the region when initializing AWS service clients. Takes preference over `AWS_DEFAULT_REGION`.
* **AWS_PROFILE** The profile from the AWS .credentials file to use when initializing clients for AWS services.
* **AWS_ACCESS_KEY_ID** The access key id to use when initalizing clients for aws services. Will not be used if AWS_PROFILE is provided. If provided so must `AWS_SECRET_ACCESS_KEY`.
* **AWS_SECRET_ACCESS_KEY** The access key id to use when initalizing clients for aws services. Will not be used if AWS_PROFILE is provided. If provided so must `AWS_ACCESS_KEY_ID`.
* **AWS_SESSION_TOKEN** Optional. Must be provided if using an STS token. Is only utilized when providing `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
* **AWS_HTTPS_ALLOW_INVALID_CERTS** If provided, invalid certificates will be ignored by creating a custom agent with rejectUnauthorized = false. ie, `http.Agent({rejectUnauthorized:false})`
* **AWS_HTTPS_CERTS_PATH** If provided, the certs at the location specified will be supplied to the http.Agent used for communicating with AWS services.

## Permissions

### Secrets Manager
You need to ensure that the account you are executing this script with has the appropriate AWS Permissions. Below is an example YAML format on a permission granting access to describe and get secret values from a secret bundle in AWS Secrets Manager.
```
-  Effect: "Allow"
       Action:
          - "secretsmanager:DescribeSecret"
          - "secretsmanager:GetSecretValue"
       Resource:
          - arn:aws:secretsmanager:{AWS::Region}:{AWS::AccountId}:secret:/path/to/secret*
```

### Parameter Store
TODO

# Environment Variables
* 

# TODO
* Update readme to have a cleaner organization around possible value sources.
* ADD xml support?
* What other structured document types?
* Azure Key Vault
* Ignore popular prefixes like http/s, file, ftp, etc.