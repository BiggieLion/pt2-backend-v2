import { Test, TestingModule } from '@nestjs/testing';
import { RequesterService } from './requester.service';
import { ConfigService } from '@nestjs/config';
import { RequesterRepository } from './requester.repository';
import {
  AdminAddUserToGroupCommand,
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
  SignUpCommand,
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
                'cognito.clientId': 'client-123',
              };
              return map[key];
            }),
          },
        },
        { provide: RequesterRepository, useValue: repo },
        {
          provide: CognitoIdentityProviderClient,
          useValue: { send: sendMock },
        },
      ],
    }).compile();

    service = module.get<RequesterService>(RequesterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create() should create user, add to group, capture UserSub, and persist', async () => {
    // Mock AWS send sequence: SignUp (with UserSub), AdminAddUserToGroup
    sendMock.mockImplementation((cmd: unknown) => {
      if (cmd instanceof SignUpCommand) {
        return Promise.resolve({ UserSub: 'sub-123' });
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
    expect(sendMock).toHaveBeenCalledWith(expect.any(SignUpCommand));
    expect(sendMock).toHaveBeenCalledWith(
      expect.any(AdminAddUserToGroupCommand),
    );
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
    sendMock.mockImplementation((cmd: unknown) => {
      if (cmd instanceof SignUpCommand)
        return Promise.resolve({ UserSub: 'sub-123' });
      return Promise.resolve({});
    });
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

  it('create() should prefer DB sub if UserSub is missing', async () => {
    // SignUp without UserSub
    sendMock.mockImplementation((cmd: unknown) => {
      if (cmd instanceof SignUpCommand) return Promise.resolve({});
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
    };

    await service.create(dto);
    // Ensure Cognito receives normalized username
    let signUpCmd: SignUpCommand | undefined;
    for (const call of sendMock.mock.calls as Array<[unknown, ...unknown[]]>) {
      const [cmd] = call;
      if (cmd instanceof SignUpCommand) {
        signUpCmd = cmd;
        break;
      }
    }
    expect(signUpCmd).toBeDefined();
    expect((signUpCmd as SignUpCommand).input.Username).toBe(
      'john@example.com',
    );
  });

  it('getRequester() should return a view DTO without exposing sub', async () => {
    // Arrange repository to return a full entity including sub
    const repoAny = (service as unknown as { requesterRepo: any })
      .requesterRepo as { findOne: jest.Mock };
    if (!repoAny.findOne) {
      // If repository is not directly accessible, rebind provider with spy
      (service as unknown as { requesterRepo: any }).requesterRepo = {
        findOne: jest.fn().mockResolvedValue({
          id: '10',
          curp: 'CUPR800101HDFABC01',
          rfc: 'ABCD800101XYZ',
          firstname: 'John',
          lastname: 'Doe',
          monthly_income: 1000,
          email: 'john@example.com',
          sub: 'sub-secret',
          address: 'Street 1',
          gender: 'M',
          has_ine: true,
          has_birth: false,
          has_domicile: true,
          has_guarantee: false,
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
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        }),
      };
    } else {
      repoAny.findOne.mockResolvedValue({
        id: '10',
        curp: 'CUPR800101HDFABC01',
        rfc: 'ABCD800101XYZ',
        firstname: 'John',
        lastname: 'Doe',
        monthly_income: 1000,
        email: 'john@example.com',
        sub: 'sub-secret',
        address: 'Street 1',
        gender: 'M',
        has_ine: true,
        has_birth: false,
        has_domicile: true,
        has_guarantee: false,
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
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });
    }

    // Act
    const view = await service.getRequester('10');

    // Assert
    expect(view).toMatchObject({
      id: '10',
      email: 'john@example.com',
      firstname: 'John',
      lastname: 'Doe',
    });
    expect((view as unknown as { [k: string]: unknown })['sub']).toBe(
      undefined,
    );
    expect(Object.hasOwn(view as object, 'sub')).toBe(false);
  });
});
