import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsEnum,
  IsOptional,
} from "class-validator";

export class UpdateSetNumberDto {
  @IsOptional()
  @IsString({ message: "ชื่อชุดคำถามต้องเป็นข้อความ" })
  @IsNotEmpty({ message: "ชื่อชุดคำถามไม่สามารถเป็นค่าว่างได้" })
  @MinLength(1, { message: "ชื่อชุดคำถามต้องมีความยาวอย่างน้อย 1 ตัวอักษร" })
  @MaxLength(255, { message: "ชื่อชุดคำถามต้องมีความยาวไม่เกิน 255 ตัวอักษร" })
  name?: string;

  @IsOptional()
  @IsEnum(["Active", "Inactive"], { 
    message: "สถานะต้องเป็น 'Active' หรือ 'Inactive' เท่านั้น" 
  })
  status?: "Active" | "Inactive";
}
