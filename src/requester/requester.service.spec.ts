import { Test, TestingModule } from '@nestjs/testing';
import { RequesterService } from './requester.service';
import { ConfigService } from '@nestjs/config';
import { RequesterRepository } from './requester.repository';
import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { CreateRequesterDto } from './dto/create-requester.dto';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('RequesterService', () => {
  let service: RequesterService;
  let repo: { create: jest.Mock };
  let sendMock: jest.Mock;

  beforeEach(async () => {
    repo = { create: jest.fn() };
    sendMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequesterService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const map: Record<string, string> = {
                'aws.region': 'us-east-1',
                'aws.accessKey': 'x',
                'aws.secretKey': 'y',
                'cognito.userPoolId': 'pool',
                'cognito.requesterGroup': 'requester',
              };
              return map[key];
            }),
          },
        },
        { provide: RequesterRepository, useValue: repo },
      ],
    }).compile();

    service = module.get<RequesterService>(RequesterService);
    // Override internal client send with mock
    (
      service as unknown as { cognitoClient: CognitoIdentityProviderClient }
    ).cognitoClient = {
      send: sendMock,
    } as unknown as CognitoIdentityProviderClient;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create() should create user, set password, add to group, read sub, and persist', async () => {
    // Mock AWS send sequence: AdminCreateUser, AdminSetUserPassword, AdminAddUserToGroup, AdminGetUser
    sendMock.mockImplementation((cmd: unknown) => {
      if (cmd instanceof AdminGetUserCommand) {
        return Promise.resolve({
          UserAttributes: [{ Name: 'sub', Value: 'sub-123' }],
        });
      }
      return Promise.resolve({});
    });

    repo.create.mockResolvedValue({
      id: '1',
      sub: 'sub-123',
      email: 'john@example.com',
    });

    const dto: Partial<CreateRequesterDto> = {
      curp: 'CUPR800101HDFABC01',
      rfc: 'ABCD800101XYZ',
      firstname: 'John',
      lastname: 'Doe',
      monthly_income: 1000,
      email: 'john@example.com',
      password: 'Abcdef1!',
      address: 'Street 1',
      gender: 'M',
      count_children: 0,
      count_adults: 2,
      count_family_members: 2,
      civil_status: 'single',
      education_level: 'bachelor',
      occupation_type: 1,
      days_employed: 100,
      birthdate: new Date('1990-01-01'),
      has_own_car: true,
      has_own_realty: false,
    };

    const result = await service.create(dto as CreateRequesterDto);
    expect(sendMock).toHaveBeenCalledWith(expect.any(AdminCreateUserCommand));
    expect(sendMock).toHaveBeenCalledWith(
      expect.any(AdminSetUserPasswordCommand),
    );
    expect(sendMock).toHaveBeenCalledWith(
      expect.any(AdminAddUserToGroupCommand),
    );
    expect(sendMock).toHaveBeenCalledWith(expect.any(AdminGetUserCommand));
    expect(repo.create).toHaveBeenCalled();
    expect(result).toEqual({
      id: '1',
      sub: 'sub-123',
      email: 'john@example.com',
    });
  });

  it('create() should map UsernameExistsException to BadRequestException', async () => {
    sendMock.mockRejectedValueOnce({ name: 'UsernameExistsException' });
    const dto = {
      curp: 'CUPR800101HDFABC01',
      rfc: 'ABCD800101XYZ',
      firstname: 'John',
      lastname: 'Doe',
      monthly_income: 1000,
      email: 'john@example.com',
      password: 'Abcdef1!',
      address: 'Street 1',
      gender: 'M',
      count_children: 0,
      count_adults: 2,
      count_family_members: 2,
      civil_status: 'single',
      education_level: 'bachelor',
      occupation_type: 1,
      days_employed: 100,
      birthdate: new Date('1990-01-01'),
      has_own_car: true,
      has_own_realty: false,
    } as CreateRequesterDto;

    await expect(service.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('create() should map InvalidPasswordException to BadRequestException', async () => {
    sendMock.mockRejectedValueOnce({ name: 'InvalidPasswordException' });
    const dto = {
      curp: 'CUPR800101HDFABC01',
      rfc: 'ABCD800101XYZ',
      firstname: 'John',
      lastname: 'Doe',
      monthly_income: 1000,
      email: 'john@example.com',
      password: 'Abcdef1!',
      address: 'Street 1',
      gender: 'M',
      count_children: 0,
      count_adults: 2,
      count_family_members: 2,
      civil_status: 'single',
      education_level: 'bachelor',
      occupation_type: 1,
      days_employed: 100,
      birthdate: new Date('1990-01-01'),
      has_own_car: true,
      has_own_realty: false,
    } as CreateRequesterDto;

    await expect(service.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('create() should rollback Cognito user when DB persistence fails', async () => {
    // AWS happy path
    sendMock.mockResolvedValue({});
    // Returning a sub on getUser
    sendMock.mockImplementationOnce(() => Promise.resolve({})); // create
    sendMock.mockImplementationOnce(() => Promise.resolve({})); // set pwd
    sendMock.mockImplementationOnce(() => Promise.resolve({})); // add group
    sendMock.mockImplementationOnce(() =>
      Promise.resolve({ UserAttributes: [{ Name: 'sub', Value: 'sub-123' }] }),
    ); // get user
    // DB fails
    repo.create.mockRejectedValue(new Error('DB error'));

    const dto = {
      curp: 'CUPR800101HDFABC01',
      rfc: 'ABCD800101XYZ',
      firstname: 'John',
      lastname: 'Doe',
      monthly_income: 1000,
      email: 'john@example.com',
      password: 'Abcdef1!',
      address: 'Street 1',
      gender: 'M',
      count_children: 0,
      count_adults: 2,
      count_family_members: 2,
      civil_status: 'single',
      education_level: 'bachelor',
      occupation_type: 1,
      days_employed: 100,
      birthdate: new Date('1990-01-01'),
      has_own_car: true,
      has_own_realty: false,
    } as CreateRequesterDto;

    await expect(service.create(dto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    // Ensure delete user is attempted
    expect(sendMock).toHaveBeenCalledWith(expect.any(AdminDeleteUserCommand));
  });

  it('create() should proceed even if AdminGetUser fails and prefer DB sub', async () => {
    // Mock AWS happy path until getUser
    sendMock.mockImplementation((cmd: unknown) => {
      if (cmd instanceof AdminGetUserCommand) {
        return Promise.reject(new Error('AWS getUser down'));
      }
      return Promise.resolve({});
    });

    // Repo returns entity with its own sub
    repo.create.mockResolvedValue({
      id: '2',
      sub: 'sub-db',
      email: 'john@example.com',
    });

    const dto: CreateRequesterDto = {
      curp: 'CUPR800101HDFABC01',
      rfc: 'ABCD800101XYZ',
      firstname: 'John',
      lastname: 'Doe',
      monthly_income: 1000,
      email: 'john@example.com',
      password: 'Abcdef1!',
      address: 'Street 1',
      gender: 'M',
      count_children: 0,
      count_adults: 2,
      count_family_members: 2,
      civil_status: 'single',
      education_level: 'bachelor',
      occupation_type: 1,
      days_employed: 100,
      birthdate: new Date('1990-01-01'),
      has_own_car: true,
      has_own_realty: false,
      sub: 'ignored-sub',
    };

    const result = await service.create(dto);
    expect(result).toEqual({
      id: '2',
      sub: 'sub-db',
      email: 'john@example.com',
    });
  });

  it('create() should normalize email and use lowercased trimmed username', async () => {
    sendMock.mockResolvedValue({});
    repo.create.mockResolvedValue({
      id: '3',
      sub: '',
      email: 'john@example.com',
    });

    const dto: CreateRequesterDto = {
      curp: 'CUPR800101HDFABC01',
      rfc: 'ABCD800101XYZ',
      firstname: 'John',
      lastname: 'Doe',
      monthly_income: 1000,
      email: '  John@Example.com\t',
      password: 'Abcdef1!',
      address: 'Street 1',
      gender: 'M',
      count_children: 0,
      count_adults: 2,
      count_family_members: 2,
      civil_status: 'single',
      education_level: 'bachelor',
      occupation_type: 1,
      days_employed: 100,
      birthdate: new Date('1990-01-01'),
      has_own_car: true,
      has_own_realty: false,
      sub: '',
    };

    await service.create(dto);
    // Ensure repository receives normalized email
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'john@example.com' }),
    );
  });
});
