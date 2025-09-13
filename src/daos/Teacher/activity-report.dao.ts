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

  /**
   * ดึงข้อมูลแบบประเมินและผลการตอบ
   */
  public async getAssessmentData(activityId: number): Promise<any> {
    await this.checkConnection();
    
    try {
      // ดึงข้อมูลแบบประเมินและคำถาม
      const assessmentQuery = `
        SELECT 
          a.assessment_id,
          a.assessment_name,
          sn.set_number_id,
          sn.name as set_number_name,
          q.question_id,
          q.question_text,
          q.question_type,
          c.choice_id,
          c.choice_text
        FROM assessment a
        INNER JOIN set_number sn ON a.assessment_id = sn.assessment_id
        INNER JOIN question q ON sn.set_number_id = q.set_number_id
        LEFT JOIN choice c ON q.question_id = c.question_id
        WHERE a.assessment_id = (
          SELECT assessment_id FROM activity WHERE activity_id = $1
        )
        ORDER BY sn.set_number_id, q.question_id, c.choice_id
      `;

      const assessmentResult = await this.dataSource!.query(assessmentQuery, [activityId]);
      
      // ดึงข้อมูลการตอบ
      const answerQuery = `
        SELECT 
          a.answer_id,
          a.join_id,
          a.question_id,
          a.choice_id,
          a.answer_text,
          q.question_type,
          c.choice_text,
          sn.name as set_number_name
        FROM answer a
        INNER JOIN question q ON a.question_id = q.question_id
        INNER JOIN set_number sn ON q.set_number_id = sn.set_number_id
        LEFT JOIN choice c ON a.choice_id = c.choice_id
        WHERE a.assessment_id = (
          SELECT assessment_id FROM activity WHERE activity_id = $1
        )
        ORDER BY sn.set_number_id, q.question_id
      `;

      const answerResult = await this.dataSource!.query(answerQuery, [activityId]);

      // จัดกลุ่มข้อมูลตาม set_number (หัวข้อ)
      const topicsMap = new Map();
      
      // จัดกลุ่มคำถามตามหัวข้อ
      assessmentResult.forEach((row: any) => {
        const topicId = row.set_number_id;
        const topicName = row.set_number_name;
        
        if (!topicsMap.has(topicId)) {
          topicsMap.set(topicId, {
            topicId,
            topicName,
            questions: new Map(),
            totalRespondents: 0
          });
        }
        
        const topic = topicsMap.get(topicId);
        
        if (!topic.questions.has(row.question_id)) {
          topic.questions.set(row.question_id, {
            questionId: row.question_id,
            questionText: row.question_text,
            questionType: row.question_type,
            choices: [],
            answers: []
          });
        }
        
        const question = topic.questions.get(row.question_id);
        
        if (row.choice_id && !question.choices.find((c: any) => c.choiceId === row.choice_id)) {
          question.choices.push({
            choiceId: row.choice_id,
            choiceText: row.choice_text
          });
        }
      });

      // จัดกลุ่มคำตอบตามหัวข้อและคำถาม
      answerResult.forEach((row: any) => {
        const topicId = row.set_number_id;
        const questionId = row.question_id;
        
        if (topicsMap.has(topicId)) {
          const topic = topicsMap.get(topicId);
          if (topic.questions.has(questionId)) {
            const question = topic.questions.get(questionId);
            question.answers.push({
              answerId: row.answer_id,
              joinId: row.join_id,
              choiceId: row.choice_id,
              answerText: row.answer_text,
              choiceText: row.choice_text
            });
          }
        }
      });

      // แปลงข้อมูลเป็นรูปแบบที่ frontend ต้องการ
      const topics = Array.from(topicsMap.values()).map((topic: any) => {
        const questions = Array.from(topic.questions.values()).map((question: any) => {
          // คำนวณสถิติการตอบ
          const answerStats = this.calculateAnswerStats(question);
          
          return {
            questionId: question.questionId,
            questionText: question.questionText,
            questionType: question.questionType,
            choices: question.choices,
            ...answerStats
          };
        });

        // คำนวณข้อมูล PieChart สำหรับหัวข้อนี้
        const pieData = this.calculatePieChartData(questions);
        
        return {
          topicId: topic.topicId,
          topicName: topic.topicName,
          questions,
          pieData,
          totalRespondents: this.getTotalRespondents(questions)
        };
      });

      return topics;
    } catch (error) {
      this.logDbError("getAssessmentData", error);
      throw new Error("❌ Failed to get assessment data");
    }
  }

  private calculateAnswerStats(question: any): any {
    const answers = question.answers;
    const totalAnswers = answers.length;
    
    if (question.questionType === 'satisfaction' || question.questionType === 'single_choice') {
      const choiceCounts: { [key: string]: number } = {};
      
      answers.forEach((answer: any) => {
        const choiceText = answer.choiceText || answer.answerText;
        choiceCounts[choiceText] = (choiceCounts[choiceText] || 0) + 1;
      });

      const stats = question.choices.map((choice: any) => {
        const count = choiceCounts[choice.choiceText] || 0;
        return {
          choiceText: choice.choiceText,
          count,
          percentage: totalAnswers > 0 ? ((count / totalAnswers) * 100).toFixed(1) : '0.0'
        };
      });

      return {
        totalAnswers,
        choiceStats: stats,
        average: this.calculateAverage(stats)
      };
    }
    
    return { totalAnswers };
  }

  private calculatePieChartData(questions: any[]): any[] {
    // รวมข้อมูลจากทุกคำถามในหัวข้อ
    const allAnswers: any[] = [];
    questions.forEach(question => {
      if (question.choiceStats) {
        question.choiceStats.forEach((stat: any) => {
          allAnswers.push({
            choiceText: stat.choiceText,
            count: stat.count
          });
        });
      }
    });

    // จัดกลุ่มและรวมจำนวน
    const groupedAnswers: { [key: string]: number } = {};
    allAnswers.forEach(answer => {
      groupedAnswers[answer.choiceText] = (groupedAnswers[answer.choiceText] || 0) + answer.count;
    });

    const total = Object.values(groupedAnswers).reduce((sum: number, count: number) => sum + count, 0);
    
    // สร้าง PieChart data
    const pieData = Object.entries(groupedAnswers).map(([choiceText, count]) => ({
      name: choiceText,
      value: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0',
      color: this.getColorForChoice(choiceText)
    }));

    return pieData;
  }

  private getColorForChoice(choiceText: string): string {
    const colorMap: { [key: string]: string } = {
      'มากที่สุด': '#52C41A',
      'มาก': '#B7EB8F',
      'ปานกลาง': '#FADB14',
      'น้อย': '#FA8C16',
      'น้อยที่สุด': '#F5222D'
    };
    
    return colorMap[choiceText] || '#D9D9D9';
  }

  private calculateAverage(stats: any[]): number {
    const scoreMap: { [key: string]: number } = {
      'มากที่สุด': 5,
      'มาก': 4,
      'ปานกลาง': 3,
      'น้อย': 2,
      'น้อยที่สุด': 1
    };

    let totalScore = 0;
    let totalCount = 0;

    stats.forEach(stat => {
      const score = scoreMap[stat.choiceText] || 0;
      totalScore += score * stat.count;
      totalCount += stat.count;
    });

    return totalCount > 0 ? (totalScore / totalCount) : 0;
  }

  private getTotalRespondents(questions: any[]): number {
    if (questions.length === 0) return 0;
    
    // ใช้จำนวนคำตอบจากคำถามแรกเป็นตัวแทน
    return questions[0].totalAnswers || 0;
  }
}
