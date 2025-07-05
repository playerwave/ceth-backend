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
  @IsInt()
  users_id!: number;

  @IsString()
  @IsNotEmpty()
  first_name!: string;

  @IsString()
  @IsNotEmpty()
  last_name!: string;

  @IsEmail()
  email!: string;

  @IsEnum(EducationStatus)
  education_status!: EducationStatus;

  @IsEnum(RiskStatus)
  risk_status!: RiskStatus;

  @IsInt()
  faculty_id!: number;

  @IsInt()
  department_id!: number;

  @IsInt()
  grade_id!: number;

  @IsInt()
  eventcoop_id!: number;
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
