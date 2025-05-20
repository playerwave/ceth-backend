export interface Activity {
  activity_id?: number; // Primary key
  activity_name: string;
  presenter_company_name?: string | null;
  type: "Soft" | "Hard";
  description?: string | null;
  seat?: number | null;
  recieve_hours?: number | null;
  event_format?: "Online" | "Onsite" | "Course" | null;
  create_activity_date?: Date | null;
  special_start_register_date?: Date | null;
  start_register_date?: Date | null;
  end_register_date?: Date | null;
  start_activity_date?: Date | null;
  end_activity_date?: Date | null;
  image_url?: string | null;
  activity_status: "Private" | "Public";
  activity_state:
    | "Not Start"
    | "Special Open Register"
    | "Open Register"
    | "Close Register"
    | "Start Activity"
    | "End Activity"
    | "Start Assessment"
    | "End Assessment";
  status: "Active" | "Inactive";
  last_update_activity_date?: Date | null;
  url?: string | null;
  assessment_id?: number | null; // foreign key
  room_id?: number | null;       // foreign key 
}
