import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEmail,
  IsInt,
  IsEnum,
  Validate,
} from "class-validator";
import { Type } from "class-transformer";
import { ExistsInDatabase } from "../../middleware/isExistindatabase.validator";
import { Users } from "../../entity/users.entity";
import { Faculty } from "../../entity/faculty.entity";
import { Department } from "../../entity/department.entity";
import { Grade } from "../../entity/grade.entity";
import { EventCoop } from "../../entity/eventcoop.entity";

export class CreateStudentDto {
  @IsInt()
  @Type(() => Number)
  @ExistsInDatabase(Users, "users_id", {
    message: "users_id ไม่พบในระบบ",
  })
  users_id!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  first_name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  last_name!: string;

  @IsEmail({}, { message: "email ไม่ถูกต้อง" })
  @MaxLength(255)
  email!: string;

  @IsInt()
  @Type(() => Number)
  soft_hours!: number;

  @IsInt()
  @Type(() => Number)
  hard_hours!: number;

  @IsEnum(["Normal", "Risk"], {
    message: "risk_status ต้องเป็น Normal หรือ Risk",
  })
  risk_status!: "Normal" | "Risk";

  @IsEnum(["Studying", "Graduate"], {
    message: "education_status ต้องเป็น Studying หรือ Graduate",
  })
  education_status!: "Studying" | "Graduate";

  @IsInt()
  @Type(() => Number)
  @ExistsInDatabase(Faculty, "faculty_id", {
    message: "faculty_id ไม่พบในระบบ",
  })
  faculty_id!: number;

  @IsInt()
  @Type(() => Number)
  @ExistsInDatabase(Department, "department_id", {
    message: "department_id ไม่พบในระบบ",
  })
  department_id!: number;

  @IsInt()
  @Type(() => Number)
  @ExistsInDatabase(Grade, "grade_id", {
    message: "grade_id ไม่พบในระบบ",
  })
  grade_id!: number;

  @IsInt()
  @Type(() => Number)
  @ExistsInDatabase(EventCoop, "eventcoop_id", {
    message: "eventcoop_id ไม่พบในระบบ",
  })
  eventcoop_id!: number;
}
