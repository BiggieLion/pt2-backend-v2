import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CustomResponseDto } from '@common/dto';

@ApiTags('staff')
@Controller({ path: 'staff', version: '1' })
export class StaffController {
  constructor(private readonly staffSvc: StaffService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Staff module health check',
    description:
      'Health endpoint for the staff module (load balancers, probes)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staff module is healthy',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CustomResponseDto) },
        {
          properties: {
            statusCode: { example: 200 },
            success: { example: true },
            message: { example: 'Staff module is healthy' },
            data: { type: 'object', example: {} },
          },
        },
      ],
    },
  })
  getHealth() {
    const message = this.staffSvc.getHealth();
    return { data: {}, message };
  }
}
