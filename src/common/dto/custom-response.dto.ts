import { ApiProperty } from '@nestjs/swagger';

export class CustomResponseDto<T = any> {
  @ApiProperty({ example: 200, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({
    example: true,
    description: 'Indicates if the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: '2024-04-27T12:34:56Z',
    description: 'ISO timestamp of the response',
  })
  timestamp: string;

  @ApiProperty({
    example: '/api/v1/module/health',
    description: 'Request path',
  })
  path: string;

  @ApiProperty({
    enum: ['CONTINUE', 'CANCEL'],
    description: 'Action status of the response',
  })
  action: 'CONTINUE' | 'CANCEL';

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({
    example: '1.0.0',
    description: 'API version',
  })
  version: string;

  @ApiProperty({ description: 'Response data payload' })
  data: T;
}
