import { Test, TestingModule } from '@nestjs/testing';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

describe('StaffController', () => {
  let controller: StaffController;
  let mockStaffSvc: { getHealth: jest.Mock };

  beforeEach(async () => {
    mockStaffSvc = { getHealth: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffController],
      providers: [{ provide: StaffService, useValue: mockStaffSvc }],
    }).compile();

    controller = module.get<StaffController>(StaffController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('deberia retornar data vacio y message del servicio', () => {
      // Arrange
      mockStaffSvc.getHealth.mockReturnValue('Staff module is healthy');

      // Act
      const result = controller.getHealth();

      // Assert
      expect(mockStaffSvc.getHealth).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: {}, message: 'Staff module is healthy' });
    });
  });
});
