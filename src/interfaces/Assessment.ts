export interface Assessment {
  assessment_id?: number;
  join_id: number;
  assessment_name: string;
  description: string;
  create_date: Date;
  last_update: Date;
  assessment_status: "Not finished" | "Finished" | "Unsuccessful";
  set_number: number;
  status: "Active" | "Inactive";
}
