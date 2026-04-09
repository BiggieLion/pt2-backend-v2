import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateRequesterDto } from './create-requester.dto';

export class UpdateRequesterDto extends PartialType(
  OmitType(CreateRequesterDto, ['password'] as const),
) {}
