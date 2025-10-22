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

  @ValidateIf((o) => o.activity_status === "Public" && o.event_format !== "Course")
  @IsDate()
  @Type(() => Date)
  special_start_register_date?: Date;

  @ValidateIf((o) => o.activity_status === "Public" && o.event_format !== "Course")
  @IsDate()
  @Type(() => Date)
  start_register_date?: Date;

  @ValidateIf((o) => o.activity_status === "Public" && o.event_format !== "Course")
  @IsDate()
  @Type(() => Date)
  end_register_date?: Date;

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

  @ValidateIf(
    (o) =>
      o.activity_status === "Public" &&
      (o.event_format === "Onsite" || o.event_format === "Online") &&
      o.url !== undefined &&
      o.url !== null &&
      String(o.url).trim() !== ""
  )
  @IsUrl({}, { message: "url ต้องเป็นลิงก์ที่ถูกต้อง" })
  url?: string;

  @ValidateIf((o) => o.activity_status === "Public" && o.event_format !== "Course")
  @IsInt()
  assessment_id?: number;

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

  // ✅ Certificate fields สำหรับ Course
  @ValidateIf((o) => o.event_format === "Course")
  @IsOptional()
  @IsString()
  upload_certificate_description?: string;

  @ValidateIf((o) => o.event_format === "Course")
  @IsOptional()
  @IsString()
  certificate_template_url?: string;

  @ValidateIf((o) => o.event_format === "Course")
  @IsOptional()
  certificate_ocr_data?: any;

  @ValidateIf((o) => o.event_format === "Course")
  @IsOptional()
  certificate_image_analysis?: any;
}
