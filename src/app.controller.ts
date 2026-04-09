import { Controller, Get, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CustomResponseDto } from '@common/dto';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Global health check',
    description:
      'Single global health endpoint for the API (load balancers, probes)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API is healthy',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CustomResponseDto) },
        {
          properties: {
            statusCode: { example: 200 },
            success: { example: true },
            message: { example: 'API is healthy' },
            data: {
              type: 'object',
              example: {},
            },
          },
        },
      ],
    },
  })
  getHealth() {
    return { data: {}, message: 'API is healthy' };
  }
}
