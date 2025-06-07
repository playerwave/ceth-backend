import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsDate,
  IsArray,
  IsNumber,
  Min,
  ValidateIf,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export enum ActivityStatus {
  PUBLIC = "Public",
  PRIVATE = "Private",
}

export enum ActivityType {
  SOFT = "Soft",
  HARD = "Hard",
}

export enum EventFormat {
  ONSITE = "Onsite",
  ONLINE = "Online",
  COURSE = "Course",
}

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  activity_name!: string;

  @IsOptional()
  @IsString()
  presenter_company_name?: string;

  @IsEnum(ActivityType)
  type!: ActivityType;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsInt()
  seat?: number;

  @IsOptional()
  @IsInt()
  recieve_hours?: number;

  @IsEnum(EventFormat)
  event_format!: EventFormat;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  @Type(() => Date)
  create_activity_date: Date = new Date();

  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : null)
  @IsDate()
  @Type(() => Date)
  special_start_register_date?: Date;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  @Type(() => Date)
  start_register_date!: Date;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  @Type(() => Date)
  end_register_date!: Date;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  @Type(() => Date)
  start_activity_date!: Date;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  @Type(() => Date)
  end_activity_date!: Date;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsEnum(ActivityStatus)
  activity_status!: ActivityStatus;

  @IsOptional()
  @IsString()
  activity_state?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsEnum(["Active", "Inactive"])
  status?: "Active" | "Inactive";

  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : null)
  @IsDate()
  @Type(() => Date)
  last_update_activity_date?: Date;

  @IsOptional()
  @IsInt()
  assessment_id?: number;

  @IsOptional()
  @IsInt()
  room_id?: number;

  // ✅ ใช้ food_ids แทน ac_food (เพื่อ insert activity_food)
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  food_ids?: number[];
}

