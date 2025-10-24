import { CreditType, RequestStatus } from '@request/constants';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateRequestDto {
  @IsEnum(CreditType)
  credit_type: CreditType;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsDateString()
  termination_date: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsBoolean()
  has_guarantee: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  guarantee_value?: number;

  @IsUUID()
  @IsNotEmpty()
  requester_id: string;
}
