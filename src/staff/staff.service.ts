import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  getHealth(): string {
    this.logger.log('Staff health check requested');
    return 'Staff module is healthy';
  }
}
