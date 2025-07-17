import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class CreateFacultyDto {
  @IsString()
  @IsNotEmpty({ message: "กรุณาระบุชื่อคณะ" })
  @MaxLength(255, { message: "ชื่อคณะต้องมีความยาวไม่เกิน 255 ตัวอักษร" })
  faculty_name!: string;
}
