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
  Validate,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from "class-validator";
import { Type, Transform } from "class-transformer";

// ✅ ENUM สำหรับ ac_status และ ac_type
export enum ActivityStatus {
  PUBLIC = "Public",
  PRIVATE = "Private",
}

export enum ActivityType {
  HARD_SKILL = "Hard Skill",
  SOFT_SKILL = "Soft Skill",
}

export enum LocationType {
  ONSITE = "Onsite",
  ONLINE = "Online",
  COURSE = "Course",
}

// create

export function IsBefore(
  property: string,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isBefore",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];

          if (!value || !relatedValue) return false; // ❌ ไม่อนุญาตให้เป็น undefined หรือ null
          return new Date(value) < new Date(relatedValue); // ✅ ต้องมาก่อน
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} ต้องอยู่ก่อน ${args.constraints[0]}`;
        },
      },
    });
  };
}

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  ac_name!: string;

  @IsOptional()
  @IsString()
  ac_company_lecturer?: string;

  @IsString()
  @IsNotEmpty()
  ac_description!: string;

  @IsEnum(ActivityType)
  ac_type!: ActivityType;

  @IsEnum(LocationType, {
    message: "ac_location_type ต้องเป็น 'Onsite', 'Online' หรือ 'Course'",
  })
  ac_location_type!: LocationType;

  @Transform(({ value, obj }) => {
    if (obj.ac_location_type !== LocationType.ONSITE) return ""; // ✅ ถ้าไม่ใช่ "Onsite Meeting" ต้องเป็น ""
    return value;
  })
  @ValidateIf((o) => o.ac_location_type === LocationType.ONSITE)
  @IsString()
  @IsNotEmpty({
    message: "ac_room ต้องไม่ว่างเมื่อ ac_location_type เป็น 'Onsite'",
  })
  ac_room!: string;

  @IsInt()
  @IsNotEmpty()
  ac_seat!: number;

  @IsOptional()
  @IsString()
  ac_food?: string;

  @IsEnum(ActivityStatus)
  ac_status!: ActivityStatus;

  @IsOptional()
  @IsString()
  ac_state?: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore("ac_normal_register", {
    message: "ac_start_register ต้องมาก่อน ac_normal_register",
  })
  ac_start_register!: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore("ac_end_register", {
    message: "ac_normal_register ต้องมาก่อน ac_end_register",
  })
  ac_normal_register!: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore("ac_start_time", {
    message: "ac_end_register ต้องมาก่อน ac_start_time",
  })
  ac_end_register!: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore("ac_end_time", { message: "ac_start_time ต้องมาก่อน ac_end_time" })
  ac_start_time!: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  ac_end_time!: Date;

  @IsDate()
  @Type(() => Date)
  ac_create_date: Date = new Date();

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ac_last_update?: Date;

  @IsNumber()
  ac_registered_count: number = 0;

  @IsNumber()
  ac_attended_count: number = 0;

  @IsNumber()
  ac_not_attended_count: number = 0;

  @IsOptional()
  ac_image_data?: string | null;

  @IsOptional()
  @IsNumber()
  assessment_id?: number;
}
// update
export class UpdateActivityDto {
  @IsString()
  @IsNotEmpty()
  ac_name!: string;

  @IsOptional()
  @IsString()
  ac_company_lecturer?: string;

  @IsString()
  @IsNotEmpty()
  ac_description!: string;

  @IsEnum(ActivityType)
  ac_type!: ActivityType;

  @IsEnum(LocationType, {
    message:
      "ac_location_type ต้องเป็น 'Onsite Meeting', 'Online Meeting' หรือ 'Online Course'",
  })
  ac_location_type!: LocationType;

  @Transform(({ value, obj }) => {
    if (obj.ac_location_type !== LocationType.ONSITE) return ""; // ✅ ถ้าไม่ใช่ "Onsite Meeting" ต้องเป็น ""
    return value;
  })
  @ValidateIf((o) => o.ac_location_type === LocationType.ONSITE)
  @IsString()
  @IsNotEmpty({
    message: "ac_room ต้องไม่ว่างเมื่อ ac_location_type เป็น 'Onsite Meeting'",
  })
  ac_room!: string;

  @IsInt()
  @IsNotEmpty()
  ac_seat!: number;

  @IsOptional()
  @IsString()
  ac_food?: string;

  @IsEnum(ActivityStatus)
  ac_status!: ActivityStatus;

  @IsOptional()
  @IsString()
  ac_state?: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore("ac_normal_register", {
    message: "ac_start_register ต้องมาก่อน ac_normal_register",
  })
  ac_start_register!: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore("ac_end_register", {
    message: "ac_normal_register ต้องมาก่อน ac_end_register",
  })
  ac_normal_register!: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore("ac_start_time", {
    message: "ac_end_register ต้องมาก่อน ac_start_time",
  })
  ac_end_register!: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore("ac_end_time", { message: "ac_start_time ต้องมาก่อน ac_end_time" })
  ac_start_time!: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  ac_end_time!: Date;

  @IsDate()
  @Type(() => Date)
  ac_create_date: Date = new Date();

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ac_last_update?: Date;

  @IsNumber()
  ac_registered_count: number = 0;

  @IsNumber()
  ac_attended_count: number = 0;

  @IsNumber()
  ac_not_attended_count: number = 0;

  @IsOptional()
  ac_image_data?: string | null;

  @IsOptional()
  @IsNumber()
  assessment_id?: number;
}
