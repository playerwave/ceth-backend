// // src/dtos/activity/update-activity.dto.ts
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
// import { ExistsInDatabase } from "../../middleware/isExistindatabase.validator";
// import { Assessment } from "../../entity/assessment.entity";
// import { Room } from "../../entity/room.entity";

// export class UpdateActivityDto {
//   @ValidateIf((o) => o.activity_status === "Public")
//   @IsString()
//   @MinLength(5, { message: "ชื่อกิจกรรมต้องมีอย่างน้อย 5 ตัวอักษร" })
//   @MaxLength(50, { message: "ชื่อกิจกรรมต้องไม่เกิน 50 ตัวอักษร" })
//   activity_name!: string;

//   @ValidateIf((o) => o.activity_status === "Public")
//   @IsString()
//   @MinLength(5, { message: "ชื่อบริษัท/วิทยากรต้องมีอย่างน้อย 5 ตัวอักษร" })
//   @MaxLength(50, { message: "ชื่อบริษัท/วิทยากรต้องไม่เกิน 50 ตัวอักษร" })
//   presenter_company_name!: string;

//   @ValidateIf((o) => o.activity_status === "Public")
//   @IsString()
//   @MinLength(10, { message: "คำอธิบายกิจกรรมต้องมีอย่างน้อย 10 ตัวอักษร" })
//   @MaxLength(500, { message: "คำอธิบายกิจกรรมต้องไม่เกิน 500 ตัวอักษร" })
//   description!: string;

//   @ValidateIf((o) => o.activity_status === "Public")
//   @IsEnum(["Soft", "Hard"], { message: "ต้องเลือกประเภทกิจกรรม" })
//   type!: "Soft" | "Hard";

//   @IsEnum(["Online", "Onsite", "Course"])
//   event_format!: "Online" | "Onsite" | "Course";

//   @ValidateIf(
//     (o) => o.event_format === "Online" && o.activity_status === "Public"
//   )
//   @IsInt({ message: "จำนวนที่นั่งต้องเป็นตัวเลข" })
//   seat?: number;

//   @ValidateIf(
//     (o) => o.event_format === "Course" && o.activity_status === "Public"
//   )
//   @IsInt({ message: "จำนวนชั่วโมงต้องเป็นตัวเลข" })
//   recieve_hours?: number;

//   @IsDate()
//   @Type(() => Date)
//   create_activity_date!: Date;

//   @ValidateIf(
//     (o) => o.event_format !== "Course" && o.activity_status === "Public"
//   )
//   @IsDate()
//   @Type(() => Date)
//   special_start_register_date!: Date;

//   @ValidateIf(
//     (o) => o.event_format !== "Course" && o.activity_status === "Public"
//   )
//   @IsDate()
//   @Type(() => Date)
//   start_register_date!: Date;

//   @ValidateIf(
//     (o) => o.event_format !== "Course" && o.activity_status === "Public"
//   )
//   @IsDate()
//   @Type(() => Date)
//   end_register_date!: Date;

//   @ValidateIf((o) => o.activity_status === "Public")
//   @IsDate()
//   @Type(() => Date)
//   start_activity_date!: Date;

//   @ValidateIf((o) => o.activity_status === "Public")
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

//   @ValidateIf(
//     (o) => o.event_format !== "Course" && o.activity_status === "Public"
//   )
//   @IsInt()
//   @ExistsInDatabase(Assessment, "assessment_id", {
//     message: "assessment_id ไม่พบในระบบ",
//   })
//   assessment_id!: number;

//   @ValidateIf(
//     (o) => o.event_format === "Onsite" && o.activity_status === "Public"
//   )
//   @IsInt({ message: "ต้องเลือกห้องสำหรับกิจกรรม Onsite" })
//   @ExistsInDatabase(Room, "room_id", {
//     message: "room_id ไม่พบในระบบ",
//   })
//   room_id!: number;

//   @ValidateIf(
//     (o) => o.event_format === "Onsite" && o.activity_status === "Public"
//   )
//   @IsArray()
//   @ArrayNotEmpty({ message: "ต้องเลือกอาหารอย่างน้อย 1 รายการ" })
//   foodIds!: number[];
// }

// src/dtos/activity/update-activity.dto.ts
import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  ValidateIf,
  IsInt,
  IsDate,
  IsOptional,
  Matches,
  IsArray,
  ArrayNotEmpty,
  IsUrl,
} from "class-validator";
import { Type } from "class-transformer";
import { ExistsInDatabase } from "../../middleware/isExistindatabase.validator";
import { Assessment } from "../../entity/Assessment/assessment.entity";
import { Room } from "../../entity/room.entity";

export class UpdateActivityDto {
  @IsEnum(["Private", "Public"])
  activity_status: "Private" | "Public" = "Private";

  // ––– เฉพาะเมื่อ Public –––
  @ValidateIf((o) => o.activity_status === "Public")
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  activity_name: string = "ไม่ระบุ";

  @ValidateIf((o) => o.activity_status === "Public")
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  presenter_company_name: string = "ไม่ระบุ";

  @ValidateIf((o) => o.activity_status === "Public")
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string = "ไม่ระบุ";

  @ValidateIf((o) => o.activity_status === "Public")
  @IsEnum(["Soft", "Hard"])
  type!: "Soft" | "Hard";

  // ––– event_format ทุกกรณี –––
  @IsEnum(["Online", "Onsite", "Course"])
  event_format!: "Online" | "Onsite" | "Course";

  // ––– floor + room_id + foodIds เฉพาะ Onsite & Public –––
  @ValidateIf(
    (o) => o.activity_status === "Public" && o.event_format === "Onsite"
  )
  @IsString()
  @MinLength(1)
  floor!: string;

  @ValidateIf(
    (o) => o.activity_status === "Public" && o.event_format === "Onsite"
  )
  @IsInt()
  @ExistsInDatabase(Room, "room_id", { message: "room_id ไม่พบ" })
  room_id!: number;

  @ValidateIf(
    (o) => o.activity_status === "Public" && o.event_format === "Onsite"
  )
  @IsOptional()
  @IsArray()
  foodIds?: number[];

  // ––– seat เฉพาะ Online & Public –––
  @ValidateIf(
    (o) => o.activity_status === "Public" && o.event_format === "Online"
  )
  @IsInt()
  seat?: number;

  // ––– recieve_hours เฉพาะ Course & Public –––
  @ValidateIf(
    (o) => o.activity_status === "Public" && o.event_format === "Course"
  )
  @IsInt()
  recieve_hours?: number;

  // ––– assessment_id เฉพาะ Public & ไม่ใช่ Course –––
  @ValidateIf(
    (o) => o.activity_status === "Public" && o.event_format !== "Course"
  )
  @IsInt()
  @ExistsInDatabase(Assessment, "assessment_id", {
    message: "assessment_id ไม่พบ",
  })
  assessment_id!: number;

  // ––– วันที่ต่างๆ เฉพาะ Public & ไม่ใช่ Course –––
  @ValidateIf((o) => o.activity_status === "Public")
  @IsDate()
  @Type(() => Date)
  start_activity_date!: Date;

  @ValidateIf((o) => o.activity_status === "Public")
  @IsDate()
  @Type(() => Date)
  end_activity_date!: Date;

  @ValidateIf(
    (o) => o.activity_status === "Public" && o.event_format !== "Course"
  )
  @IsDate()
  @Type(() => Date)
  special_start_register_date!: Date;

  @ValidateIf(
    (o) => o.activity_status === "Public" && o.event_format !== "Course"
  )
  @IsDate()
  @Type(() => Date)
  start_register_date!: Date;

  @ValidateIf(
    (o) => o.activity_status === "Public" && o.event_format !== "Course"
  )
  @IsDate()
  @Type(() => Date)
  end_register_date!: Date;

  // ––– อื่นๆ –––
  @ValidateIf((o) => o.activity_status === "Public")
  @Matches(/\.(jpg|png)$/i)
  image_url?: string = "ไม่ระบุ";

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

  @ValidateIf(
    (o) =>
      o.activity_status === "Public" &&
      o.url !== undefined &&
      o.url !== null &&
      String(o.url).trim() !== ""
  )
  @IsUrl({}, { message: "url ต้องเป็นลิงก์ที่ถูกต้อง" })
  url?: string;
}
