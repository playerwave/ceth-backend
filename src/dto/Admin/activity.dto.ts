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
  
  // ✅ กำหนด ENUM สำหรับ ac_status และ ac_type
  export enum ActivityStatus {
    PUBLIC = "Public",
    PRIVATE = "Private",
  }
  
  export enum ActivityType {
    HARD_SKILL = "Hard Skill",
    SOFT_SKILL = "Soft Skill",
  }
  
  export class CreateActivityDto {
    @IsString()
    @IsNotEmpty()
    ac_name: string;
  
    @IsOptional()
    @IsString()
    ac_company_lecturer?: string;
  
    @IsString()
    @IsNotEmpty()
    ac_description: string;
  
    @IsEnum(ActivityType, { message: "ac_type must be 'Hard Skill' or 'Soft Skill'" })
    ac_type: ActivityType;
  
    @IsOptional()
    @IsString()
    ac_room?: string;
  
    @IsInt()
    @IsNotEmpty()
    ac_seat: number;
  
    @IsOptional()
    @IsString()
    ac_food?: string; // ควรเป็น JSON.stringify() ก่อนบันทึก
  
    @IsEnum(ActivityStatus, { message: "ac_status must be 'Public' or 'Private'" })
    ac_status: ActivityStatus;
  
    @IsString()
    @IsNotEmpty()
    ac_location_type: string;
  
    @IsString()
    @IsOptional()
    ac_state?: string;
  
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    ac_start_register?: Date;
  
    @IsDate()
    @Type(() => Date)
    ac_end_register: Date;
  
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    ac_last_update?: Date;
  
    @IsInt()
    @IsOptional()
    ac_registered_count?: number = 0;
  
    @IsInt()
    @IsOptional()
    ac_attended_count?: number = 0;
  
    @IsInt()
    @IsOptional()
    ac_not_attended_count?: number = 0;
  
    @IsDate()
    @Type(() => Date)
    ac_start_time: Date;
  
    @IsDate()
    @Type(() => Date)
    ac_end_time: Date;
  
    @IsOptional()
    @IsBase64()
    ac_image_data?: string; // ✅ ใช้ Base64 string สำหรับรูปภาพ
  
    @IsDate()
    @Type(() => Date)
    ac_normal_register: Date;
  
    @IsOptional()
    @IsInt()
    assessment_id?: number; // ✅ เชื่อมกับ Assessment
  }

  
  