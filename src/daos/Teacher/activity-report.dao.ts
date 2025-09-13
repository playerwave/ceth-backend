import { DataSource } from "typeorm";
import { ErrorHandledDao } from "../error.handled.dao";
import { connectDatabase } from "../../db/database";

export class ActivityReportDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ ActivityReportDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private async checkConnection(): Promise<void> {
    if (!this.dataSource) {
      this.dataSource = await connectDatabase();
    }
    if (!this.dataSource) {
      throw new Error("❌ Database connection is not established");
    }
  }

  /**
   * ดึงข้อมูลจำนวนนิสิตที่ลงทะเบียนแยกตามสาขาและชั้นปี
   */
  public async getEnrollmentByDepartment(activityId: number): Promise<any> {
    await this.checkConnection();
    
    try {
      const query = `
        SELECT 
          d.department_short_name,
          g.level as grade_level,
          g.description as grade_description,
          COUNT(j.join_id) as student_count
        FROM "join" j
        INNER JOIN activity_detail ad ON j.activity_detail_id = ad.activity_detail_id
        INNER JOIN students s ON j.students_id = s.students_id
        INNER JOIN department d ON s.department_id = d.department_id
        INNER JOIN grade g ON s.grade_id = g.grade_id
        WHERE ad.activity_id = $1
        GROUP BY d.department_short_name, g.level, g.description, d.department_id, g.grade_id
        ORDER BY d.department_short_name, g.level
      `;

      const result = await this.dataSource!.query(query, [activityId]);
      
      // จัดกลุ่มข้อมูลตาม department และ grade
      const departmentMap = new Map();
      let totalStudents = 0;

      result.forEach((row: any) => {
        const departmentShortName = row.department_short_name;
        const gradeLevel = row.grade_level; // ใช้ level แทน grade_name
        const studentCount = parseInt(row.student_count);
        
        totalStudents += studentCount;

        if (!departmentMap.has(departmentShortName)) {
          departmentMap.set(departmentShortName, {
            name: departmentShortName,
            year1: 0,
            year2: 0,
            year3: 0,
            year4: 0,
            total: 0
          });
        }

        const department = departmentMap.get(departmentShortName);
        
        // แปลง grade_level เป็น year (level เป็น 1, 2, 3, 4)
        if (gradeLevel === 1) {
          department.year1 += studentCount;
        } else if (gradeLevel === 2) {
          department.year2 += studentCount;
        } else if (gradeLevel === 3) {
          department.year3 += studentCount;
        } else if (gradeLevel === 4) {
          department.year4 += studentCount;
        }
        
        department.total += studentCount;
      });

      // แปลง Map เป็น Array และคำนวณเปอร์เซ็นต์
      const departments = Array.from(departmentMap.values()).map(dept => ({
        ...dept,
        percent: totalStudents > 0 ? `${((dept.total / totalStudents) * 100).toFixed(1)}%` : "0%"
      }));

      // สร้าง legend สำหรับแต่ละชั้นปี
      const year1Total = departments.reduce((sum, dept) => sum + dept.year1, 0);
      const year2Total = departments.reduce((sum, dept) => sum + dept.year2, 0);
      const year3Total = departments.reduce((sum, dept) => sum + dept.year3, 0);
      const year4Total = departments.reduce((sum, dept) => sum + dept.year4, 0);

      const legend = [
        { 
          label: "ชั้นปี 1", 
          count: year1Total, 
          percent: totalStudents > 0 ? `${((year1Total / totalStudents) * 100).toFixed(1)}%` : "0%", 
          color: "#6659FF" 
        },
        { 
          label: "ชั้นปี 2", 
          count: year2Total, 
          percent: totalStudents > 0 ? `${((year2Total / totalStudents) * 100).toFixed(1)}%` : "0%", 
          color: "#404CCC" 
        },
        { 
          label: "ชั้นปี 3", 
          count: year3Total, 
          percent: totalStudents > 0 ? `${((year3Total / totalStudents) * 100).toFixed(1)}%` : "0%", 
          color: "#89AFFF" 
        },
        { 
          label: "ชั้นปี 4", 
          count: year4Total, 
          percent: totalStudents > 0 ? `${((year4Total / totalStudents) * 100).toFixed(1)}%` : "0%", 
          color: "#D9D9D9" 
        }
      ];

      return {
        departments,
        legend,
        totalStudents,
        totalText: `จากผู้เข้าร่วมเต็มเวลาทั้งหมด ${totalStudents} คน (100.0%)`
      };
    } catch (error) {
      this.logDbError("getEnrollmentByDepartment", error);
      throw new Error("❌ Failed to get enrollment by department");
    }
  }

  /**
   * ดึงข้อมูลสถานะการเข้าร่วมกิจกรรมและสถานะนิสิต
   */
  public async getParticipationStatus(activityId: number): Promise<any> {
    await this.checkConnection();
    
    try {
      const query = `
        SELECT 
          j.join_id,
          ad.time_in,
          ad.time_out,
          s.risk_status,
          CASE 
            WHEN ad.time_in IS NOT NULL AND ad.time_out IS NOT NULL THEN 'full_time'
            WHEN ad.time_in IS NOT NULL OR ad.time_out IS NOT NULL THEN 'part_time'
            ELSE 'no_participation'
          END as participation_status
        FROM "join" j
        INNER JOIN activity_detail ad ON j.activity_detail_id = ad.activity_detail_id
        INNER JOIN students s ON j.students_id = s.students_id
        WHERE ad.activity_id = $1
      `;

      const result = await this.dataSource!.query(query, [activityId]);
      
      // นับจำนวนตามสถานะการเข้าร่วม
      let totalRegistered = result.length;
      let fullTimeAttendance = 0;
      let partTimeAttendance = 0;
      let noParticipation = 0;
      let normalStatus = 0;
      let riskStatus = 0;

      result.forEach((row: any) => {
        // นับสถานะการเข้าร่วม
        if (row.participation_status === 'full_time') {
          fullTimeAttendance++;
        } else if (row.participation_status === 'part_time') {
          partTimeAttendance++;
        } else {
          noParticipation++;
        }

        // นับสถานะนิสิต (เฉพาะผู้ที่เข้าร่วมเต็มเวลา)
        if (row.participation_status === 'full_time') {
          if (row.risk_status === 'Normal') {
            normalStatus++;
          } else if (row.risk_status === 'Risk') {
            riskStatus++;
          }
        }
      });

      return {
        totalRegistered,
        fullTimeAttendance,
        partTimeAttendance,
        noParticipation,
        normalStatus,
        riskStatus,
        registeredInfo: {
          label: "ผู้ลงทะเบียน",
          count: totalRegistered,
          percent: "100%",
          color: "#8B5CF6"
        },
        participationData: [
          {
            label: "เข้าเต็มเวลา",
            count: fullTimeAttendance,
            percent: totalRegistered > 0 ? `${((fullTimeAttendance / totalRegistered) * 100).toFixed(0)}%` : "0%",
            color: "#10B981"
          },
          {
            label: "เข้าไม่เต็มเวลา",
            count: partTimeAttendance,
            percent: totalRegistered > 0 ? `${((partTimeAttendance / totalRegistered) * 100).toFixed(0)}%` : "0%",
            color: "#F59E0B"
          },
          {
            label: "ไม่ได้เข้าร่วม",
            count: noParticipation,
            percent: totalRegistered > 0 ? `${((noParticipation / totalRegistered) * 100).toFixed(0)}%` : "0%",
            color: "#EF4444"
          }
        ],
        studentStatusData: [
          {
            label: "Normal",
            count: normalStatus,
            percent: fullTimeAttendance > 0 ? `${((normalStatus / fullTimeAttendance) * 100).toFixed(0)}%` : "0%",
            color: "#10B981"
          },
          {
            label: "Risk",
            count: riskStatus,
            percent: fullTimeAttendance > 0 ? `${((riskStatus / fullTimeAttendance) * 100).toFixed(0)}%` : "0%",
            color: "#EF4444"
          }
        ]
      };
    } catch (error) {
      this.logDbError("getParticipationStatus", error);
      throw new Error("❌ Failed to get participation status");
    }
  }
}
