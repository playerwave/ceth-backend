export interface Food {
  food_id?: number;
  food_name: string;
  status: "Active" | "Inactive";
  faculty_id: number;
}
