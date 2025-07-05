import {
  ValidateIf,
  IsString,
  MaxLength,
  IsEmail,
  IsInt,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { ExistsInDatabase } from "../../middleware/isExistindatabase.validator";
import { Users } from "../../entity/users.entity";
import { Faculty } from "../../entity/faculty.entity";
import { Department } from "../../entity/department.entity";
import { Grade } from "../../entity/grade.entity";
import { EventCoop } from "../../entity/eventcoop.entity";

export class UpdateStudentDto {
  @ValidateIf((o) => o.users_id !== undefined)
  @IsInt()
  @Type(() => Number)
  @ExistsInDatabase(Users, "users_id", { message: "users_id ไม่พบในระบบ" })
  users_id?: number;

  @ValidateIf((o) => o.first_name !== undefined)
  @IsString()
  @MaxLength(255)
  first_name?: string;

  @ValidateIf((o) => o.last_name !== undefined)
  @IsString()
  @MaxLength(255)
  last_name?: string;

  @ValidateIf((o) => o.email !== undefined)
  @IsEmail({}, { message: "email ไม่ถูกต้อง" })
  @MaxLength(255)
  email?: string;

  @ValidateIf((o) => o.soft_hours !== undefined)
  @IsInt()
  @Type(() => Number)
  soft_hours?: number;

  @ValidateIf((o) => o.hard_hours !== undefined)
  @IsInt()
  @Type(() => Number)
  hard_hours?: number;

  @ValidateIf((o) => o.risk_status !== undefined)
  @IsEnum(["Normal", "Risk"], {
    message: "risk_status ต้องเป็น Normal หรือ Risk",
  })
  risk_status?: "Normal" | "Risk";

  @ValidateIf((o) => o.education_status !== undefined)
  @IsEnum(["Studying", "Graduate"], {
    message: "education_status ต้องเป็น Studying หรือ Graduate",
  })
  education_status?: "Studying" | "Graduate";

  @ValidateIf((o) => o.faculty_id !== undefined)
  @IsInt()
  @Type(() => Number)
  @ExistsInDatabase(Faculty, "faculty_id", {
    message: "faculty_id ไม่พบในระบบ",
  })
  faculty_id?: number;

  @ValidateIf((o) => o.department_id !== undefined)
  @IsInt()
  @Type(() => Number)
  @ExistsInDatabase(Department, "department_id", {
    message: "department_id ไม่พบในระบบ",
  })
  department_id?: number;

  @ValidateIf((o) => o.grade_id !== undefined)
  @IsInt()
  @Type(() => Number)
  @ExistsInDatabase(Grade, "grade_id", { message: "grade_id ไม่พบในระบบ" })
  grade_id?: number;

  @ValidateIf((o) => o.eventcoop_id !== undefined)
  @IsInt()
  @Type(() => Number)
  @ExistsInDatabase(EventCoop, "eventcoop_id", {
    message: "eventcoop_id ไม่พบในระบบ",
  })
  eventcoop_id?: number;
}
