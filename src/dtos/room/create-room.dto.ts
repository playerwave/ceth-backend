// src/dtos/room/create-room.dto.ts
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";
import { Faculty } from "../../entity/faculty.entity";
import { Building } from "../../entity/building.entity";
import { ExistsInDatabase } from "../../middleware/isExistindatabase.validator";

export class CreateRoomDto {
  @IsInt()
  @Type(() => Number)
  @ExistsInDatabase(Faculty, "faculty_id", {
    message: "faculty_id ไม่พบในระบบ",
  })
  faculty_id!: number;

  @IsInt()
  @Type(() => Number)
  @ExistsInDatabase(Building, "building_id", {
    message: "building_id ไม่พบในระบบ",
  })
  building_id!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  room_name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  floor!: string;

  @IsInt()
  @Type(() => Number)
  seat_number!: number;

  @IsEnum(["Active", "Available"], {
    message: "status ต้องเป็น Active หรือ Available",
  })
  status!: "Active" | "Available";
}
