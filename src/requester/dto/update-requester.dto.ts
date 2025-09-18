import { CreateRequesterDto } from './create-requester.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateRequesterDto extends PartialType(CreateRequesterDto) {}
