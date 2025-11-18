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
    summary: 'Health check',
    description: 'Checks if the app service is running',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'App service is healthy',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CustomResponseDto) },
        {
          properties: {
            statusCode: { example: 200 },
            success: { example: true },
            message: { example: 'App service is healthy' },
            data: {
              type: 'object',
              example: {},
            },
          },
        },
      ],
    },
  })
  getHello() {
    return { data: {}, message: 'App service is healthy' };
  }
}
