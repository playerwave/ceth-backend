import {
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  IsEnum,
  IsInt,
  IsBase64,
  ValidateIf,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";

// ✅ ENUM สำหรับ ac_status และ ac_type
export enum ActivityStatus {
  PUBLIC = "Public",
  PRIVATE = "Private",
}

export enum ActivityType {
  HARD_SKILL = "Hard Skill",
  SOFT_SKILL = "Soft Skill",
}

// create
export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  ac_name!: string; // ✅ ใช้ ! เพื่อบอกว่า field นี้จะมีค่าแน่นอน

  @IsOptional()
  @IsString()
  ac_company_lecturer?: string;

  @IsString()
  @IsNotEmpty()
  ac_description!: string;

  @IsEnum(ActivityType, {
    message: "ac_type must be 'Hard Skill' or 'Soft Skill'",
  })
  ac_type!: ActivityType;

  @IsOptional()
  @IsString()
  ac_room?: string;

  @IsInt()
  @IsNotEmpty()
  ac_seat!: number;

  @IsOptional()
  @IsString()
  ac_food?: string; // ✅ ควรใช้ JSON.stringify() ก่อนบันทึก

  @IsEnum(ActivityStatus, {
    message: "ac_status must be 'Public' or 'Private'",
  })
  ac_status!: ActivityStatus;

  @IsString()
  @IsNotEmpty()
  ac_location_type!: string;

  @IsOptional()
  @IsString()
  ac_state?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ac_start_register?: Date;

  @IsDate()
  @Type(() => Date)
  ac_end_register!: Date;

  @IsDate()
  @Type(() => Date)
  ac_create_date: Date = new Date(); // ✅ กำหนดค่าเริ่มต้นเป็น Date ปัจจุบัน

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ac_last_update?: Date;

  @IsNumber()
  ac_registered_count: number = 0; // ✅ ค่าเริ่มต้นเป็น 0

  @IsNumber()
  ac_attended_count: number = 0;

  @IsNumber()
  ac_not_attended_count: number = 0;

  @IsDate()
  @Type(() => Date)
  ac_start_time!: Date;

  @IsDate()
  @Type(() => Date)
  ac_end_time!: Date;

  @IsOptional()
  @IsBase64()
  ac_image_data?: string;

  @IsDate()
  @Type(() => Date)
  ac_normal_register!: Date;

  @IsOptional()
  @IsNumber()
  assessment_id?: number; // ✅ ใช้ assessment_id ในการเชื่อมกับตารางอื่น (ถ้ามี)
}

// update
export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ac_name?: string;

  @IsOptional()
  @IsString()
  ac_company_lecturer?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ac_description?: string;

  @IsOptional()
  @IsEnum(ActivityType, {
    message: "ac_type must be 'Hard Skill' or 'Soft Skill'",
  })
  ac_type?: ActivityType;

  @IsOptional()
  @IsString()
  ac_room?: string;

  @IsOptional()
  @IsInt()
  @IsNotEmpty()
  ac_seat?: number;

  @IsOptional()
  @IsString()
  ac_food?: string;

  @IsOptional()
  @IsEnum(ActivityStatus, {
    message: "ac_status must be 'Public' or 'Private'",
  })
  ac_status?: ActivityStatus;

  @IsOptional()
  @IsString()
  ac_location_type?: string;

  @IsOptional()
  @IsString()
  ac_state?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ac_start_register?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ac_end_register?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ac_last_update: Date = new Date(); // ✅ ตั้งค่าให้มีค่าเวลาปัจจุบัน

  @IsOptional()
  @IsInt()
  ac_registered_count?: number;

  @IsOptional()
  @IsInt()
  ac_attended_count?: number;

  @IsOptional()
  @IsInt()
  ac_not_attended_count?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ac_start_time?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ac_end_time?: Date;

  @IsOptional()
  @IsBase64()
  ac_image_data?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ac_normal_register?: Date;

  @IsOptional()
  @IsNumber()
  assessment_id?: number;
}
