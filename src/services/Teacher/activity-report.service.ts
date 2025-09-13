import { ActivityReportDao } from "../../daos/Teacher/activity-report.dao";
import { ErrorHandledService } from "../error.handdled.service";

export class ActivityReportService extends ErrorHandledService {
  private activityReportDao = new ActivityReportDao();

  /**
   * ดึงข้อมูลจำนวนนิสิตที่ลงทะเบียนแยกตามสาขาและชั้นปี
   */
  public async getEnrollmentByDepartmentService(activityId: number): Promise<any> {
    try {
      this.logInfo("📊 Getting enrollment by department", { activityId });
      
      const result = await this.activityReportDao.getEnrollmentByDepartment(activityId);
      
      this.logInfo("✅ Enrollment by department retrieved", {
        activityId,
        totalStudents: result.totalStudents,
        departments: result.departments.length
      });
      
      return result;
    } catch (error) {
      this.logError("❌ Error in getEnrollmentByDepartmentService", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลสถานะการเข้าร่วมกิจกรรมและสถานะนิสิต
   */
  public async getParticipationStatusService(activityId: number): Promise<any> {
    try {
      this.logInfo("📊 Getting participation status", { activityId });
      
      const result = await this.activityReportDao.getParticipationStatus(activityId);
      
      this.logInfo("✅ Participation status retrieved", {
        activityId,
        totalRegistered: result.totalRegistered,
        fullTimeAttendance: result.fullTimeAttendance,
        partTimeAttendance: result.partTimeAttendance,
        noParticipation: result.noParticipation
      });
      
      return result;
    } catch (error) {
      this.logError("❌ Error in getParticipationStatusService", error);
      throw error;
    }
  }
}
