export interface ActivityDetail {
  activity_detail_id?: number;
  join_id: number;
  activity_id: number;
  food_id: number;
  register_date?: Date;
  time_in?: Date;
  time_out?: Date;
  status: "Registered" | "Cancelled";
}
