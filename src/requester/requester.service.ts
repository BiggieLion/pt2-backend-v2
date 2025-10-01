import {
  BadRequestException,
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequesterRepository } from './requester.repository';
import {
  AdminAddUserToGroupCommand,
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CreateRequesterDto } from './dto/create-requester.dto';
import { Requester } from './entities/requester.entity';
import { UpdateRequesterDto } from './dto/update-requester.dto';
import { RequesterViewDto } from './dto/requester-view.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class RequesterService {
  private readonly logger = new Logger(RequesterService.name);
  private readonly userPoolId: string;
  private readonly requesterGroup: string;

  constructor(
    private readonly configSvc: ConfigService,
    private readonly requesterRepo: RequesterRepository,
    private readonly cognitoClient: CognitoIdentityProviderClient,
  ) {
    this.userPoolId = this.configSvc.getOrThrow<string>('cognito.userPoolId');
    this.requesterGroup = this.configSvc.getOrThrow<string>(
      'cognito.requesterGroup',
    );
  }

  async create(dto: CreateRequesterDto) {
    this.logger.log('Creating new requester in Cognito and DB');
    const sanitizedDto: CreateRequesterDto = {
      ...dto,
      email: dto.email.toLowerCase().trim(),
      firstname: dto.firstname.trim(),
      lastname: dto.lastname.trim(),
      rfc: dto.rfc.trim(),
      curp: dto.curp.trim(),
    };
    const username: string = sanitizedDto.email;
    let userSub = '';
    try {
      const signUpRes = await this.cognitoClient.send(
        new SignUpCommand({
          ClientId: this.configSvc.getOrThrow<string>('cognito.clientId'),
          Username: username,
          Password: sanitizedDto.password,
          UserAttributes: [
            { Name: 'email', Value: username },
            {
              Name: 'name',
              Value: `${sanitizedDto.firstname} ${sanitizedDto.lastname}`,
            },
            { Name: 'custom:rfc', Value: sanitizedDto.rfc },
            { Name: 'custom:curp', Value: sanitizedDto.curp },
          ],
        }),
      );
      userSub = signUpRes.UserSub ?? '';

      this.logger.log('Cognito user created, assigning group');

      await this.cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: this.userPoolId,
          Username: username,
          GroupName: this.requesterGroup,
        }),
      );
    } catch (err: unknown) {
      let errorMessage = 'Registration failed. Please try again.';

      if (typeof err === 'object' && err !== null && 'name' in err) {
        const errorName = (err as Record<string, unknown>).name;
        if (errorName === 'UsernameExistsException') {
          errorMessage = 'An account with this email already exists.';
        } else if (errorName === 'InvalidPasswordException') {
          errorMessage = 'Password does not meet security requirements.';
        } else if (errorName === 'InvalidParameterException') {
          errorMessage = 'Invalid registration information provided.';
        }

        this.logger.error(
          `Cognito registration error: ${String(errorName)}`,
          (err as Error)?.stack,
        );
      }

      throw new BadRequestException(errorMessage);
    }
    const sub: string = userSub;

    const dtoWithoutPassword: Omit<CreateRequesterDto, 'password'> & {
      password?: string;
    } = { ...sanitizedDto };
    delete dtoWithoutPassword.password;

    const entity: Requester = new Requester({
      ...dtoWithoutPassword,
      sub,
    });

    try {
      const requesterSaved: Requester = await this.requesterRepo.create(entity);
      return {
        id: requesterSaved.id,
        sub: requesterSaved.sub ?? sub,
        email: requesterSaved.email,
      };
    } catch (error) {
      this.logger.error(
        'Failed to persist requester in DB',
        (error as Error)?.stack,
      );
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
          (delError as Error)?.stack,
        );
      }
      throw new InternalServerErrorException('Failed to persist requester');
    }
  }

  async getRequester(id: string): Promise<RequesterViewDto> {
    try {
      const requester: Requester = await this.requesterRepo.findOne({ id });
      return plainToInstance(RequesterViewDto, requester, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Requester not found');
      }
      this.logger.error(
        'Failed to retrieve requester',
        (error as Error)?.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve requester');
    }
  }

  async updateRequester(id: string, dto: UpdateRequesterDto): Promise<void> {
    await this.requesterRepo.findOneAndUpdate({ id }, dto);
  }

  async deleteRequester(id: string): Promise<void> {
    const { email } = await this.requesterRepo.findOne({ id });
    try {
      await this.cognitoClient.send(
        new AdminDeleteUserCommand({
          Username: email,
          UserPoolId: this.userPoolId,
        }),
      );
    } catch (err) {
      const name =
        typeof err === 'object' && err !== null && 'name' in err
          ? (err as { name?: string }).name
          : undefined;
      if (name === 'UserNotFoundException') {
        this.logger.warn(
          `Cognito user not found for ${email}; proceeding to delete DB record`,
        );
      } else {
        this.logger.error(
          'Failed to delete user in Cognito',
          (err as Error)?.stack,
        );
        throw new InternalServerErrorException('Failed to delete requester');
      }
    }

    await this.requesterRepo.findOneAndDelete({ id });
  }
}
