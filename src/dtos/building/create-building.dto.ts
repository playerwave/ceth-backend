import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Faculty } from '../../entity/faculty.entity';
import { ExistsInDatabase } from '../../middleware/isExistindatabase.validator';

export class CreateBuildingDto {
  @IsInt()
  @Type(() => Number)
  @ExistsInDatabase(Faculty, 'faculty_id', {
    message: 'faculty_id ไม่พบในระบบ',
  })
  faculty_id!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  building_name!: string;
}
