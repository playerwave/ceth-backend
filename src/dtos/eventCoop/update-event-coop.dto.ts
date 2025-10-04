import {
  IsInt,
  IsOptional,
  IsDateString,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEventCoopDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1, { message: 'department_id ต้องเป็นจำนวนเต็มบวก' })
  department_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1, { message: 'grade_id ต้องเป็นจำนวนเต็มบวก' })
  grade_id?: number;

  @IsOptional()
  @IsDateString({}, { message: 'date ต้องเป็นรูปแบบวันที่ที่ถูกต้อง' })
  date?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0, { message: 'remaining_days ต้องเป็นจำนวนเต็มที่ไม่ติดลบ' })
  remaining_days?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_on_coop?: boolean;
}
