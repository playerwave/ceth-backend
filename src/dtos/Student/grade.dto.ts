import { IsString, IsNotEmpty, IsOptional, IsNumber } from "class-validator";

export class CreateGradeDto {
  @IsString()
  @IsNotEmpty()
  level!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateGradeDto {
  @IsNumber()
  @IsOptional()
  grade_id?: number;

  @IsString()
  @IsOptional()
  level?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
