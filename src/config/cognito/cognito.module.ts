import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

@Module({
  providers: [
    {
      provide: CognitoIdentityProviderClient,
      useFactory: (config: ConfigService) => {
        const region = config.getOrThrow<string>('aws.region');
        const accessKeyId = config.get<string>('aws.accessKey');
        const secretAccessKey = config.get<string>('aws.secretKey');

        const client = new CognitoIdentityProviderClient(
          accessKeyId && secretAccessKey
            ? {
                region,
                credentials: {
                  accessKeyId,
                  secretAccessKey,
                },
              }
            : { region },
        );

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [CognitoIdentityProviderClient],
})
export class CognitoModule {}
