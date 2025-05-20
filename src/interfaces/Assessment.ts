export interface Assessment {
  assessment_id?: number;
  assessment_name: string;
  description: string;
  create_date: string; 
  last_update: string; 
  assessment_status: "Not finished" | "Finished" | "Unsuccessful";
  set_number_id?: number; 
  status: "Active" | "Inactive";
}
