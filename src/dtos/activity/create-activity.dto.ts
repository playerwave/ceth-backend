// // src/dtos/activity/create-activity.dto.ts
// import {
//   IsString,
//   IsNotEmpty,
//   MaxLength,
//   MinLength,
//   IsEnum,
//   IsOptional,
//   IsInt,
//   IsDate,
//   IsUrl,
//   ValidateIf,
//   IsArray,
//   ArrayNotEmpty,
//   Matches,
// } from "class-validator";
// import { Type } from "class-transformer";

// export class CreateActivityDto {
//   @IsString()
//   @MinLength(5, { message: "ชื่อกิจกรรมต้องมีอย่างน้อย 5 ตัวอักษร" })
//   @MaxLength(50, { message: "ชื่อกิจกรรมต้องไม่เกิน 50 ตัวอักษร" })
//   activity_name!: string;

//   @IsString()
//   @MinLength(5, { message: "ชื่อบริษัท/วิทยากรต้องมีอย่างน้อย 5 ตัวอักษร" })
//   @MaxLength(50, { message: "ชื่อบริษัท/วิทยากรต้องไม่เกิน 50 ตัวอักษร" })
//   presenter_company_name!: string;

//   @IsString()
//   @MinLength(10, { message: "คำอธิบายกิจกรรมต้องมีอย่างน้อย 10 ตัวอักษร" })
//   @MaxLength(500, { message: "คำอธิบายกิจกรรมต้องไม่เกิน 500 ตัวอักษร" })
//   description!: string;

//   @IsEnum(["Soft", "Hard"], { message: "ต้องเลือกประเภทกิจกรรม" })
//   type!: "Soft" | "Hard";

//   @IsEnum(["Online", "Onsite", "Course"])
//   event_format!: "Online" | "Onsite" | "Course";

//   @IsOptional()
//   @IsInt()
//   @ValidateIf((o) => o.event_format === "Online")
//   seat?: number;

//   @ValidateIf((o) => o.event_format !== "Course")
//   @IsInt({ message: "จำนวนชั่วโมงต้องเป็นตัวเลข" })
//   recieve_hours!: number;

//   @IsDate()
//   @Type(() => Date)
//   create_activity_date!: Date;

//   @ValidateIf((o) => o.event_format !== "Course")
//   @IsDate()
//   @Type(() => Date)
//   special_start_register_date!: Date;

//   @ValidateIf((o) => o.event_format !== "Course")
//   @IsDate()
//   @Type(() => Date)
//   start_register_date!: Date;

//   @ValidateIf((o) => o.event_format !== "Course")
//   @IsDate()
//   @Type(() => Date)
//   end_register_date!: Date;

//   @IsDate()
//   @Type(() => Date)
//   start_activity_date!: Date;

//   @IsDate()
//   @Type(() => Date)
//   end_activity_date!: Date;

//   @IsOptional()
//   @Matches(/\.(jpg|png)$/i, {
//     message: "รองรับเฉพาะไฟล์ .jpg หรือ .png",
//   })
//   image_url?: string;

//   @IsEnum(["Private", "Public"])
//   activity_status: "Private" | "Public" = "Private";

//   @IsEnum([
//     "Not Start",
//     "Special Open Register",
//     "Open Register",
//     "Close Register",
//     "Start Activity",
//     "End Activity",
//     "Start Assessment",
//     "End Assessment",
//   ])
//   activity_state!: string;

//   @IsEnum(["Active", "Inactive"])
//   status!: "Active" | "Inactive";

//   @IsOptional()
//   @IsUrl()
//   url?: string;

//   @IsInt()
//   assessment_id!: number;

//   @ValidateIf((o) => o.event_format === "Onsite")
//   @IsInt({ message: "ต้องเลือกห้องสำหรับกิจกรรม Onsite" })
//   room_id!: number;

//   @ValidateIf((o) => o.event_format === "Onsite")
//   @IsArray()
//   @ArrayNotEmpty({ message: "ต้องเลือกอาหารอย่างน้อย 1 รายการ" })
//   foodIds!: number[];
// }

import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsEnum,
  IsOptional,
  IsInt,
  IsDate,
  IsUrl,
  ValidateIf,
  IsArray,
  ArrayNotEmpty,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateActivityDto {
  @ValidateIf((o) => o.activity_status === "Public")
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  activity_name: string = "ไม่ระบุชื่อกิจกรรม";

  @ValidateIf((o) => o.activity_status === "Public")
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  presenter_company_name: string = "ไม่ระบุชื่อบริษัท/วิทยากร";

  @ValidateIf((o) => o.activity_status === "Public")
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string = "ไม่ระบุ";

  @ValidateIf((o) => o.activity_status === "Public")
  @IsEnum(["Soft", "Hard"])
  type!: "Soft" | "Hard";

  @IsEnum(["Online", "Onsite", "Course"])
  event_format!: "Online" | "Onsite" | "Course";

  @ValidateIf(
    (o) => o.activity_status === "Public" && o.event_format === "Online"
  )
  @IsOptional()
  @IsInt()
  seat?: number;

  @ValidateIf((o) => o.activity_status === "Public")
  @IsInt()
  recieve_hours: number = 0;

  @ValidateIf((o) => o.activity_status === "Public")
  @IsDate()
  @Type(() => Date)
  special_start_register_date!: Date;

  @ValidateIf((o) => o.activity_status === "Public")
  @IsDate()
  @Type(() => Date)
  start_register_date!: Date;

  @ValidateIf((o) => o.activity_status === "Public")
  @IsDate()
  @Type(() => Date)
  end_register_date!: Date;

  @ValidateIf((o) => o.activity_status === "Public")
  @IsDate()
  @Type(() => Date)
  start_activity_date!: Date;

  @ValidateIf((o) => o.activity_status === "Public")
  @IsDate()
  @Type(() => Date)
  end_activity_date!: Date;

  @IsOptional()
  @ValidateIf((o) => o.activity_status === "Public" && !!o.image_url)
  @Matches(/\.(jpg|png)$/i, {
    message: "รองรับเฉพาะไฟล์ .jpg หรือ .png",
  })
  image_url?: string = "ไม่ระบุ";

  @IsEnum(["Private", "Public"])
  activity_status: "Private" | "Public" = "Private";

  @IsEnum([
    "Not Start",
    "Special Open Register",
    "Open Register",
    "Close Register",
    "Start Activity",
    "End Activity",
    "Start Assessment",
    "End Assessment",
  ])
  activity_state: string = "Not Start";

  @IsEnum(["Active", "Inactive"])
  status: "Active" | "Inactive" = "Active";

  @ValidateIf((o) => o.activity_status === "Public")
  @IsOptional()
  @IsUrl()
  url?: string = "ไม่ระบุ";

  @ValidateIf((o) => o.activity_status === "Public")
  @IsInt()
  assessment_id!: number;

  @ValidateIf(
    (o) => o.event_format === "Onsite" && o.activity_status === "Public"
  )
  @IsInt({ message: "ต้องเลือกห้องสำหรับกิจกรรม Onsite" })
  room_id!: number;

  @ValidateIf(
    (o) => o.event_format === "Onsite" && o.activity_status === "Public"
  )
  @IsOptional()
  @IsArray()
  foodIds?: number[];
}
