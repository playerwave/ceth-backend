export class ActivityDao {
  private static activities = [
    {
      ac_id: 1,
      ac_name: "Participating in cooperative education activities",
      ac_company_lecturer: "Clicknext",
      ac_description: "Lorem ipsum dolor sit amet...",
      ac_type: "Soft Skill",
      ac_room: "3M210",
      ac_seat: 50,
      ac_food: ["ข้าวกระเพราหมูสับไข่ดาว", "ข้าวไก่กระเทียมไข่ดาว"],
      ac_status: "Public",
      ac_start_time: "2025-02-06 13:00:00",
      ac_end_time: "2025-02-06 16:00:00",
      ac_create_date: "2025-02-01 18:36:10",
      ac_end_enrolled_date: "2025-01-31 23:59:00",
      ac_registerant_count: 50,
      ac_state: "InProgress",
    },
  ];

  private static enrolledUsers: Record<number, string[]> = {
    1: ["user1", "user2"],
  };

  static getAllActivities() {
    return this.activities;
  }

  static getActivityById(id: number) {
    return this.activities.find((activity) => activity.ac_id === id) || null;
  }

  static getEnrolledUsersByActivityId(id: number): string[] {
    return this.enrolledUsers[id] || [];
  }
  

  static createActivity(newActivity: any) {
    const newId = this.activities.length + 1;
    const activity = { ac_id: newId, ...newActivity };
    this.activities.push(activity);
    return activity;
  }

  static updateActivity(id: number, updatedData: any) {
    const index = this.activities.findIndex((activity) => activity.ac_id === id);
    if (index === -1) return null;
    this.activities[index] = { ...this.activities[index], ...updatedData };
    return this.activities[index];
  }

  static deleteActivity(id: number) {
    const index = this.activities.findIndex((activity) => activity.ac_id === id);
    if (index === -1) return false;
    this.activities.splice(index, 1);
    return true;
  }
}