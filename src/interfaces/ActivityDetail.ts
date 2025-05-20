export interface ActivityDetail {
  activity_detail_id?: number;
  join_id: number;
  activity_id: number;
  activity_food_id: number;  // เปลี่ยนชื่อจาก food_id เป็น activity_food_id ตาม ERD
  register_date?: Date;
  time_in?: Date;
  time_out?: Date;
  status: "Registered" | "Cancelled";
}
