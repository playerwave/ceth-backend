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
  Min,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ✅ ENUM สำหรับ ac_status และ ac_type
export enum ActivityStatus {
  PUBLIC = 'Public',
  PRIVATE = 'Private',
}

export enum ActivityType {
  HARD_SKILL = 'Hard Skill',
  SOFT_SKILL = 'Soft Skill',
  NULL = '',
}

export enum LocationType {
  ONSITE = 'Onsite',
  ONLINE = 'Online',
  COURSE = 'Course',
}

// create

export function IsBefore(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBefore',
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
    if (obj.ac_location_type !== LocationType.ONSITE) return '';
    return value;
  })
  @ValidateIf(
    (o) =>
      o.ac_location_type === LocationType.ONSITE &&
      o.ac_status === ActivityStatus.PUBLIC,
  )
  @IsString()
  @IsNotEmpty({
    message: "ac_room ต้องไม่ว่างเมื่อ ac_location_type เป็น 'Onsite'",
  })
  ac_room!: string;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @IsInt()
  @IsNotEmpty()
  ac_seat!: number;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ac_food?: string[];

  @IsEnum(ActivityStatus)
  ac_status!: ActivityStatus;

  @IsOptional()
  @IsString()
  ac_state?: string;

  // ✅ ตรวจสอบเฉพาะเมื่อ `ac_status` เป็น Public
  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore('ac_normal_register')
  ac_start_register!: Date;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore('ac_end_register')
  ac_normal_register!: Date;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore('ac_start_time')
  ac_end_register!: Date;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore('ac_end_time')
  ac_start_time!: Date;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  ac_end_time!: Date;

  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  @Type(() => Date)
  ac_create_date: Date = new Date();

  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ac_last_update?: Date;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @IsOptional()
  @IsNumber()
  ac_registered_count?: number | null;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @IsOptional()
  @IsNumber()
  ac_attended_count?: number | null;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @IsOptional()
  @IsNumber()
  ac_not_attended_count?: number | null;

  @IsOptional()
  ac_image_url?: string | null;

  @IsOptional()
  @IsNumber()
  assessment_id?: number | null;

  // ✅ ถ้า `ac_status` เป็น Public ต้องมีค่าทุกตัวที่สำคัญ
  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @IsNotEmpty({
    message: 'ac_recieve_hours ห้ามเป็นค่าว่างเมื่อ ac_status เป็น Public',
  })
  @Min(1, { message: 'ac_recieve_hours ต้องมากกว่า 0' })
  @IsNumber()
  ac_recieve_hours!: number;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  // @IsDate()
  // @Type(() => Date)
  // @IsNotEmpty()
  ac_start_assesment!: Date;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  // @IsDate()
  // @Type(() => Date)
  // @IsNotEmpty()
  ac_end_assesment!: Date;
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
    message: "ac_location_type ต้องเป็น 'Onsite', 'Online' หรือ 'Course'",
  })
  ac_location_type!: LocationType;

  @Transform(({ value, obj }) => {
    if (obj.ac_location_type !== LocationType.ONSITE) return '';
    return value;
  })
  @ValidateIf(
    (o) =>
      o.ac_location_type === LocationType.ONSITE &&
      o.ac_status === ActivityStatus.PUBLIC,
  )
  @IsString()
  @IsNotEmpty({
    message: "ac_room ต้องไม่ว่างเมื่อ ac_location_type เป็น 'Onsite'",
  })
  ac_room!: string;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @IsInt()
  @IsNotEmpty()
  ac_seat!: number;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ac_food?: string[];

  @IsEnum(ActivityStatus)
  ac_status!: ActivityStatus;

  @IsOptional()
  @IsString()
  ac_state?: string;

  // ✅ ตรวจสอบเฉพาะเมื่อ `ac_status` เป็น Public
  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore('ac_normal_register')
  ac_start_register!: Date;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore('ac_end_register')
  ac_normal_register!: Date;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore('ac_start_time')
  ac_end_register!: Date;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @IsBefore('ac_end_time')
  ac_start_time!: Date;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  ac_end_time!: Date;

  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  @Type(() => Date)
  ac_create_date: Date = new Date();

  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ac_last_update?: Date;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @IsOptional()
  @IsNumber()
  ac_registered_count?: number | null;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @IsOptional()
  @IsNumber()
  ac_attended_count?: number | null;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @IsOptional()
  @IsNumber()
  ac_not_attended_count?: number | null;

  @IsOptional()
  ac_image_url?: string | null;

  @IsOptional()
  @IsNumber()
  assessment_id?: number | null;

  // ✅ ถ้า `ac_status` เป็น Public ต้องมีค่าทุกตัวที่สำคัญ
  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @IsNotEmpty({
    message: 'ac_recieve_hours ห้ามเป็นค่าว่างเมื่อ ac_status เป็น Public',
  })
  @Min(1, { message: 'ac_recieve_hours ต้องมากกว่า 0' })
  @IsNumber()
  ac_recieve_hours!: number;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  // @IsDate()
  // @Type(() => Date)
  // @IsNotEmpty()
  ac_start_assesment!: Date;

  @ValidateIf((o) => o.ac_status === ActivityStatus.PUBLIC)
  @Transform(({ value }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  // @IsDate()
  // @Type(() => Date)
  // @IsNotEmpty()
  ac_end_assesment!: Date;
}
