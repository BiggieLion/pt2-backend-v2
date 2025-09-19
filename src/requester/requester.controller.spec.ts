import { Test, TestingModule } from '@nestjs/testing';
import { RequesterController } from './requester.controller';
import { RequesterService } from './requester.service';
import { CreateRequesterDto } from './dto/create-requester.dto';
import { BadRequestException } from '@nestjs/common';

describe('RequesterController', () => {
  let controller: RequesterController;
  type RequesterServiceMock = Pick<RequesterService, 'create'> & {
    create: jest.Mock;
  };
  let service: RequesterServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequesterController],
      providers: [
        {
          provide: RequesterService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RequesterController>(RequesterController);
    service = module.get<RequesterService>(
      RequesterService,
    ) as unknown as RequesterServiceMock;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return the health message', () => {
      const result = controller.getHealth();
      expect(result).toBe('Requester service is healthy');
    });
  });

  describe('create', () => {
    it('should delegate to service and wrap response', async () => {
      const dto: CreateRequesterDto = {
        curp: 'CUPR800101HDFABC01',
        rfc: 'ABCD800101XYZ',
        firstname: 'John',
        lastname: 'Doe',
        monthly_income: 1000,
        email: 'john@example.com',
        password: 'Abcdef1!',
        sub: 'sub-123',
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

      service.create.mockResolvedValue({
        id: '1',
        sub: 'sub-123',
        email: 'john@example.com',
      });

      const response = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(response).toEqual({
        data: { id: '1', sub: 'sub-123', email: 'john@example.com' },
        message: 'Requester created successfully',
      });
    });

    it('should propagate service exceptions', async () => {
      const dto: CreateRequesterDto = {
        curp: 'CUPR800101HDFABC01',
        rfc: 'ABCD800101XYZ',
        firstname: 'John',
        lastname: 'Doe',
        monthly_income: 1000,
        email: 'john@example.com',
        password: 'Abcdef1!',
        sub: 'sub-123',
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

      service.create.mockRejectedValue(new BadRequestException('Invalid'));
      await expect(controller.create(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });
});
