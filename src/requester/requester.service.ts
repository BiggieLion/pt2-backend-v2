import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequesterRepository } from './requester.repository';
import {
  AdminAddUserToGroupCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CreateRequesterDto } from './dto/create-requester.dto';
import { Requester } from './entities/requester.entity';

@Injectable()
export class RequesterService {
  private readonly logger = new Logger(RequesterService.name);
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly userPoolId: string;
  private readonly requesterGroup: string;

  constructor(
    private readonly configSvc: ConfigService,
    private readonly requesterRepo: RequesterRepository,
  ) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configSvc.getOrThrow<string>('aws.region'),
      credentials: {
        accessKeyId: this.configSvc.getOrThrow<string>('aws.accessKey'),
        secretAccessKey: this.configSvc.getOrThrow<string>('aws.secretKey'),
      },
    });

    this.userPoolId = this.configSvc.getOrThrow<string>('cognito.userPoolId');
    this.requesterGroup = this.configSvc.getOrThrow<string>(
      'cognito.requesterGroup',
    );
  }

  async create(dto: CreateRequesterDto) {
    this.logger.log('Creating new requester in Cognito and DB');
    const username: string = dto.email.trim().toLowerCase();
    // Creating Cognito user (suppressing email and setting permanent password)
    try {
      const te = await this.cognitoClient.send(
        new SignUpCommand({
          ClientId: this.configSvc.getOrThrow<string>('cognito.clientId'),
          Username: username,
          Password: dto.password,
          UserAttributes: [
            { Name: 'email', Value: username },
            { Name: 'name', Value: `${dto.firstname} ${dto.lastname}` },
            { Name: 'custom:rfc', Value: dto.rfc },
            { Name: 'custom:curp', Value: dto.curp },
          ],
        }),
      );

      this.logger.log('Cognito user created, setting password and group', te);

      await this.cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: this.userPoolId,
          Username: username,
          GroupName: this.requesterGroup,
        }),
      );
    } catch (err: unknown) {
      let name = 'CognitoError';
      if (typeof err === 'object' && err !== null && 'name' in err) {
        const n = (err as Record<string, unknown>).name;
        if (typeof n === 'string') {
          name = n;
        }
      }
      if (name === 'UsernameExistsException') {
        throw new BadRequestException('User already exists');
      }
      if (name === 'InvalidPasswordException') {
        throw new BadRequestException('Password does not meet policy');
      }
      this.logger.error('Cognito create user failed', err as Error);
      throw new BadRequestException(name);
    }

    // Reading user sub
    let sub: string = '';
    try {
      const getUser = await this.cognitoClient.send(
        new AdminGetUserCommand({
          UserPoolId: this.userPoolId,
          Username: username,
        }),
      );
      sub = getUser.UserAttributes?.find((u) => u.Name === 'sub')?.Value ?? '';
    } catch (error) {
      this.logger.warn(
        'Could not fetch user sub; proceeding without it',
        error as Error,
      );
    }

    // Persisting in DB (assign AFTER instantiation to avoid TS class field initialization clobber)
    const entity: Requester = new Requester();
    Object.assign(entity, { ...dto, email: username, sub });

    try {
      const requesterSaved: Requester = await this.requesterRepo.create(entity);
      return {
        id: requesterSaved.id,
        sub: requesterSaved.sub ?? sub,
        email: requesterSaved.email,
      };
    } catch (error) {
      this.logger.error('Failed to persist requester in DB', error as Error);
      try {
        await this.cognitoClient.send(
          new AdminDeleteUserCommand({
            UserPoolId: this.userPoolId,
            Username: username,
          }),
        );
      } catch (delError) {
        this.logger.warn(
          'Rollback Cognito user deletion failed',
          delError as Error,
        );
      }
      throw new BadRequestException('User already exists');
    }
  }
}
