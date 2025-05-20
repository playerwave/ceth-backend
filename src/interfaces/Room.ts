export interface Room {
  room_id?: number;
  faculty_id: number;
  room_name: string;
  floor: string;
  seat_number: number;
  building_id: number;
  status: "Active" | "Available";
}
