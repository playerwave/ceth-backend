import {
  IsString,
  IsInt,
  IsEmail,
  IsEnum,
  IsOptional,
  IsNotEmpty,
} from "class-validator";
import { Transform } from "class-transformer";

export enum RiskStatus {
  NORMAL = "Normal",
  RISK = "Risk",
}

export enum EducationStatus {
  STUDYING = "Studying",
  GRADUATE = "Graduate",
}

export class CreateStudentDto {
  @IsOptional()
  @IsInt()
  users_id?: number;

  @IsString()
  @IsNotEmpty()
  first_name!: string;

  @IsString()
  @IsNotEmpty()
  last_name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(EducationStatus)
  education_status?: EducationStatus;

  @IsOptional()
  @IsEnum(RiskStatus)
  risk_status?: RiskStatus;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value === null ? null : parseInt(value))
  faculty_id?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value === null ? null : parseInt(value))
  department_id?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value === null ? null : parseInt(value))
  grade_id?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value === null ? null : parseInt(value))
  eventcoop_id?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value === null ? null : parseInt(value))
  soft_hours?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value === null ? null : parseInt(value))
  hard_hours?: number;

  // สำหรับสร้าง user อัตโนมัติ
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class CreateStudentWithUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  first_name!: string;

  @IsString()
  @IsNotEmpty()
  last_name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(EducationStatus)
  education_status?: EducationStatus;

  @IsOptional()
  @IsEnum(RiskStatus)
  risk_status?: RiskStatus;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value === null ? null : parseInt(value))
  faculty_id?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value === null ? null : parseInt(value))
  department_id?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value === null ? null : parseInt(value))
  grade_id?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value === null ? null : parseInt(value))
  eventcoop_id?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value === null ? null : parseInt(value))
  soft_hours?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value === null ? null : parseInt(value))
  hard_hours?: number;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsInt()
  users_id?: number;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(EducationStatus)
  education_status?: EducationStatus;

  @IsOptional()
  @IsEnum(RiskStatus)
  risk_status?: RiskStatus;

  @IsOptional()
  @IsInt()
  faculty_id?: number;

  @IsOptional()
  @IsInt()
  department_id?: number;

  @IsOptional()
  @IsInt()
  grade_id?: number;

  @IsOptional()
  @IsInt()
  eventcoop_id?: number;
}
