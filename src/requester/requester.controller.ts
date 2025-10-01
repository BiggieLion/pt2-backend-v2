import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CreateRequesterDto } from './dto/create-requester.dto';
import { RequesterService } from './requester.service';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators';
import type { UserDto } from '@common/dto';
import { AuthGuard } from '@nestjs/passport';
import { RequesterViewDto } from './dto/requester-view.dto';
import { UpdateRequesterDto } from './dto/update-requester.dto';
import { Throttle } from '@nestjs/throttler';

@Controller({ path: 'requester', version: '1' })
export class RequesterController {
  constructor(private readonly requesterSvc: RequesterService) {}

  @Get('health')
  getHealth(): string {
    return 'Requester service is healthy';
  }

  @Post()
  @Throttle({ 'requester-create': {} })
  async create(@Body() createRequesterDto: CreateRequesterDto) {
    const data = await this.requesterSvc.create(createRequesterDto);
    return { data, message: 'Requester created successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('requester')
  @Get()
  async getCurrentRequester(@CurrentUser() requester: UserDto) {
    const data: RequesterViewDto = await this.requesterSvc.getRequester(
      requester.id,
    );
    return { data, message: 'Requester fetched successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('analyst', 'supervisor')
  @Get('/:id')
  async getRequesterById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const data: RequesterViewDto = await this.requesterSvc.getRequester(id);
    return { data, message: 'Requester fetched successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('requester')
  @Patch()
  async updateCurrentRequester(
    @CurrentUser() requester: UserDto,
    @Body() body: UpdateRequesterDto,
  ) {
    await this.requesterSvc.updateRequester(requester.id, body);
    return { message: 'Requester updated successfully', data: {} };
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('analyst', 'supervisor')
  @Patch('/:id')
  async updateRequesterById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateRequesterDto,
  ) {
    await this.requesterSvc.updateRequester(id, body);
    return { message: 'Requester updated successfully', data: {} };
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('requester')
  @Delete()
  async deleteCurrentRequester(@CurrentUser() requester: UserDto) {
    await this.requesterSvc.deleteRequester(requester.id);
    return { message: 'Requester deleted successfully', data: {} };
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('analyst', 'supervisor')
  @Delete('/:id')
  async deleteRequesterById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    await this.requesterSvc.deleteRequester(id);
    return { message: 'Requester deleted successfully', data: {} };
  }
}
