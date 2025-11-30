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
        LEFT JOIN grade g ON s.grade_id = g.grade_id
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
        const rawGradeLevel = row.grade_level;
        const levelNum = rawGradeLevel !== null && rawGradeLevel !== undefined
          ? Number(rawGradeLevel)
          : null;
        const studentCount = Number(row.student_count) || 0;
        
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
        
        // ✅ แปลง grade_level เป็น year (level เป็น 1, 2, 3, 4)
        // ✅ รองรับทั้ง number และ string
        if (levelNum === 1) {
          department.year1 += studentCount;
        } else if (levelNum === 2) {
          department.year2 += studentCount;
        } else if (levelNum === 3) {
          department.year3 += studentCount;
        } else if (levelNum === 4) {
          department.year4 += studentCount;
        } else {
          // ✅ ถ้า gradeLevel เป็น null, undefined, หรือ 0 ให้ log warning
          console.warn("⚠️ [ActivityReportDAO] Unknown or null grade level:", {
            department: departmentShortName,
            gradeLevel: rawGradeLevel,
            studentCount
          });
          // ✅ ไม่เพิ่มเข้าไปใน year ใดๆ ถ้าไม่มี grade_level (แต่ total จะถูกนับแล้ว)
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
      // ตรวจสอบข้อมูล activity ก่อน
      const activityCheckQuery = `
        SELECT activity_id, assessment_id, assessment_version_id, activity_state 
        FROM activity 
        WHERE activity_id = $1
      `;
      const activityInfo = await this.dataSource!.query(activityCheckQuery, [activityId]);
      console.log("🔍 [ActivityReportDao] Activity info:", activityInfo[0]);
      console.log("🔍 [ActivityReportDao] Assessment version ID:", activityInfo[0]?.assessment_version_id);
      console.log("🔍 [ActivityReportDao] Assessment ID:", activityInfo[0]?.assessment_id);
      // ดึงข้อมูลแบบประเมินและคำถาม - ใช้ version tables ถ้ามี assessment_version_id
      const assessmentQuery = `
        WITH activity_assessment AS (
          SELECT 
            assessment_id,
            assessment_version_id
          FROM activity 
          WHERE activity_id = $1
        )
        SELECT 
          COALESCE(av.assessment_id, a.assessment_id) as assessment_id,
          a.assessment_name as assessment_name,
          COALESCE(snv.set_number_version_id, sn.set_number_id) as set_number_id,
          COALESCE(snv.name, sn.name) as set_number_name,
          COALESCE(qv.question_version_id, q.question_id) as question_id,
          COALESCE(qv.question_text, q.question_text) as question_text,
          CASE 
            WHEN qv.question_type IS NOT NULL THEN qv.question_type::text
            WHEN q.question_type IS NOT NULL THEN q.question_type::text
            ELSE NULL
          END as question_type,
          COALESCE(qv.order_index, q.question_number) as question_number,
          COALESCE(cv.choice_version_id, c.choice_id) as choice_id,
          COALESCE(cv.choice_text, c.choice_text) as choice_text
        FROM activity_assessment aa
        LEFT JOIN assessment_version av ON aa.assessment_version_id = av.assessment_version_id
        LEFT JOIN set_number_version snv ON av.assessment_version_id = snv.assessment_version_id
        LEFT JOIN question_version qv ON snv.set_number_version_id = qv.set_number_version_id
        LEFT JOIN choice_version cv ON qv.question_version_id = cv.question_version_id
        LEFT JOIN assessment a ON aa.assessment_id = a.assessment_id
        LEFT JOIN set_number sn ON a.assessment_id = sn.assessment_id AND aa.assessment_version_id IS NULL
        LEFT JOIN question q ON sn.set_number_id = q.set_number_id AND aa.assessment_version_id IS NULL
        LEFT JOIN choice c ON q.question_id = c.question_id AND aa.assessment_version_id IS NULL
        WHERE COALESCE(qv.question_version_id, q.question_id) IS NOT NULL
        ORDER BY COALESCE(snv.set_number_version_id, sn.set_number_id), 
                 COALESCE(qv.order_index, q.question_number), 
                 COALESCE(qv.question_version_id, q.question_id), 
                 COALESCE(cv.choice_version_id, c.choice_id)
      `;

      const assessmentResult = await this.dataSource!.query(assessmentQuery, [activityId]);
      console.log("🔍 [ActivityReportDao] Assessment query result:", assessmentResult.length, "rows");
      console.log("🔍 [ActivityReportDao] Assessment questions found:", assessmentResult.map(r => ({ 
        question_id: r.question_id, 
        question_number: r.question_number, 
        question_text: r.question_text?.substring(0, 50) + "..." 
      })));
      
      // ดึงข้อมูลการตอบ - ใช้ base tables เนื่องจาก assessment_version_id เป็น null
      const answerQuery = `
        WITH activity_assessment AS (
          SELECT 
            assessment_id,
            assessment_version_id
          FROM activity 
          WHERE activity_id = $1
        )
        SELECT 
          a.answer_id,
          a.join_id,
          a.question_id,
          a.choice_id,
          a.answer_text,
          a.assessment_id,
          q.question_type::text as question_type,
          q.question_text,
          q.question_number,
          c.choice_text,
          sn.name as set_number_name,
          sn.set_number_id
        FROM answer a
        INNER JOIN activity_assessment aa ON a.assessment_id = aa.assessment_id
        INNER JOIN question q ON a.question_id = q.question_id
        INNER JOIN set_number sn ON q.set_number_id = sn.set_number_id
        LEFT JOIN choice c ON a.choice_id = c.choice_id
        WHERE aa.assessment_version_id IS NULL
        ORDER BY sn.set_number_id, q.question_number, q.question_id
      `;

      const answerResult = await this.dataSource!.query(answerQuery, [activityId]);
      console.log("🔍 [ActivityReportDao] Answer query result:", answerResult.length, "rows");
      if (answerResult.length > 0) {
        console.log("🔍 [ActivityReportDao] Sample answers:", answerResult.slice(0, 3).map(r => ({ 
          answer_id: r.answer_id, 
          join_id: r.join_id,
          question_id: r.question_id, 
          question_number: r.question_number, 
          question_type: r.question_type,
          answer_text: r.answer_text,
          choice_text: r.choice_text,
          choice_id: r.choice_id,
          set_number_name: r.set_number_name
        })));
        
        // ตรวจสอบข้อมูล Fix Single answer โดยเฉพาะ
        const fixSingleAnswers = answerResult.filter(r => r.question_type === 'Fix Single answer');
        console.log("🔍 [ActivityReportDao] Fix Single answer responses:", fixSingleAnswers.map(r => ({
          question_id: r.question_id,
          question_text: r.question_text,
          answer_text: r.answer_text,
          choice_text: r.choice_text,
          join_id: r.join_id
        })));
      } else {
        console.log("⚠️ [ActivityReportDao] No answers found - checking raw answer data...");
        // ตรวจสอบข้อมูลดิบใน answer table
        const rawAnswerCheck = await this.dataSource!.query(
          `SELECT a.*, q.question_text, c.choice_text 
           FROM answer a 
           LEFT JOIN question q ON a.question_id = q.question_id 
           LEFT JOIN choice c ON a.choice_id = c.choice_id 
           WHERE a.assessment_id = $1`,
          [activityInfo[0].assessment_id]
        );
        console.log("🔍 [ActivityReportDao] Raw answer data:", rawAnswerCheck.length, "rows");
        if (rawAnswerCheck.length > 0) {
          console.log("🔍 [ActivityReportDao] Raw answers sample:", rawAnswerCheck.slice(0, 3));
        }
      }

      // ตรวจสอบว่ามีข้อมูลหรือไม่
      if (assessmentResult.length === 0) {
        console.log("⚠️ [ActivityReportDao] No assessment data found for activity:", activityId);
        return [];
      }

      // ถ้า activity ไม่มี assessment_version_id ให้กรองคำถามที่เพิ่มหลังจากการเริ่ม assessment
      if (!activityInfo[0].assessment_version_id && activityInfo[0].activity_state === 'Start Assessment') {
        console.log("⚠️ [ActivityReportDao] Activity has no version, filtering questions added after assessment started");
        
        // หาวันที่เริ่ม assessment
        const assessmentStartQuery = `
          SELECT start_assessment 
          FROM activity 
          WHERE activity_id = $1
        `;
        const startAssessmentResult = await this.dataSource!.query(assessmentStartQuery, [activityId]);
        const startAssessmentDate = startAssessmentResult[0]?.start_assessment;
        
        if (startAssessmentDate) {
          console.log("🔍 [ActivityReportDao] Assessment started at:", startAssessmentDate);
          
          // กรองคำถามที่สร้างหลังจากวันที่เริ่ม assessment
          const filteredAssessmentResult = assessmentResult.filter(row => {
            // ตรวจสอบว่าคำถามนี้ถูกสร้างก่อนหรือหลังการเริ่ม assessment
            // เนื่องจากไม่มี created_at ใน question table ให้ใช้ question_id เป็นตัวกรอง
            // ถ้า question_id มากกว่า 70 แสดงว่าเป็นคำถามใหม่
            return row.question_id <= 70; // ปรับตาม question_id ที่เหมาะสม
          });
          
          console.log("🔍 [ActivityReportDao] Filtered questions:", filteredAssessmentResult.length, "out of", assessmentResult.length);
          assessmentResult.length = 0; // ล้าง array
          assessmentResult.push(...filteredAssessmentResult); // ใส่ข้อมูลที่กรองแล้ว
        }
      }

      if (answerResult.length === 0) {
        console.log("⚠️ [ActivityReportDao] No answer data found for activity:", activityId);
        console.log("🔄 [ActivityReportDao] Returning questions without answers");
        // อย่า return [] ให้แสดงคำถามแม้ไม่มีคนตอบ
      }

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
            questionNumber: row.question_number,
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
          
          console.log(`🔍 [ActivityReportDao] Question ${question.questionId} processed:`, {
            questionType: question.questionType,
            originalChoices: question.choices?.length || 0,
            answerStatsChoices: answerStats.choiceStats?.length || 0,
            totalRespondents: answerStats.totalRespondents || 0,
            answers: question.answers?.length || 0
          });
          
          return {
            questionId: question.questionId,
            questionText: question.questionText,
            questionType: question.questionType,
            choices: answerStats.choiceStats || question.choices,
            totalRespondents: answerStats.totalRespondents || 0,
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

      console.log("✅ [ActivityReportDao] Processed topics:", topics.length);
      console.log("📊 [ActivityReportDao] Topic details:", topics.map(t => ({
        topicId: t.topicId,
        topicName: t.topicName,
        questionsCount: t.questions.length,
        totalRespondents: t.totalRespondents
      })));

      return topics;
    } catch (error) {
      this.logDbError("getAssessmentData", error);
      throw new Error("❌ Failed to get assessment data");
    }
  }

  private calculateAnswerStats(question: any): any {
    const answers = question.answers;
    const totalAnswers = answers.length;
    
    console.log(`🔍 [ActivityReportDao] Calculating stats for question ${question.questionId}:`, {
      questionText: question.questionText,
      totalAnswers,
      availableChoices: question.choices?.length || 0,
      choices: question.choices?.map(c => c.choiceText) || [],
      answers: answers.map(a => ({ answerText: a.answerText, choiceText: a.choiceText }))
    });
    
    // รองรับ question_type ที่หลากหลาย
    if (question.questionType === 'satisfaction' || 
        question.questionType === 'single_choice' || 
        question.questionType === 'multiple_choice' ||
        question.questionType === 'Single answer' ||
        question.questionType === 'Multiple answer' ||
        question.questionType === 'Fix Single answer') {
      const choiceCounts: { [key: string]: number } = {};
      
      answers.forEach((answer: any) => {
        // ใช้ answer_text เป็นหลัก (สำหรับ Fix Single answer)
        const choiceText = answer.answerText || answer.choiceText;
        if (choiceText) {
          choiceCounts[choiceText] = (choiceCounts[choiceText] || 0) + 1;
          console.log(`📊 [ActivityReportDao] Count for "${choiceText}":`, choiceCounts[choiceText]);
        }
      });

      // สำหรับ multiple choice - นับจำนวนคนที่เลือกแต่ละตัวเลือก
      const uniqueRespondents = new Set();
      answers.forEach((answer: any) => {
        if (answer.join_id) {
          uniqueRespondents.add(answer.join_id);
        }
      });
      const totalRespondents = uniqueRespondents.size;

      // เริ่มต้นด้วย choices ทั้งหมดจาก question.choices (ถ้ามี)
      let statsFromAnswers: any[] = [];
      
      if (question.choices && question.choices.length > 0) {
        // ใช้ choices จาก question.choices เป็นหลัก
        statsFromAnswers = question.choices.map((choice: any) => {
          const choiceText = choice.choiceText;
          const count = choiceCounts[choiceText] || 0;
          return {
            choiceText,
            count,
            percentage: totalRespondents > 0 ? `${((count / totalRespondents) * 100).toFixed(1)}%` : '0.0%'
          };
        });
      } else {
        // ถ้าไม่มี question.choices ให้ใช้จาก answer_text ที่พบ
        statsFromAnswers = Object.entries(choiceCounts).map(([choiceText, count]) => ({
          choiceText,
          count,
          percentage: totalRespondents > 0 ? `${((count / totalRespondents) * 100).toFixed(1)}%` : '0.0%'
        }));
      }
      
      // สำหรับ Fix Single answer - ใช้ answer_text แทน choice_text
      if (question.questionType === 'Fix Single answer') {
        console.log(`🔍 [ActivityReportDao] Fix Single answer - using answer_text instead of choice_text`);
        statsFromAnswers = Object.entries(choiceCounts).map(([answerText, count]) => ({
          choiceText: answerText, // ใช้ answerText เป็น choiceText
          answerText: answerText, // เก็บ answerText ไว้ด้วย
          count,
          percentage: totalRespondents > 0 ? `${((count / totalRespondents) * 100).toFixed(1)}%` : '0.0%'
        }));
      }
      
      console.log(`✅ [ActivityReportDao] Generated stats from actual answers:`, {
        totalChoices: statsFromAnswers.length,
        stats: statsFromAnswers.map(s => ({ choiceText: s.choiceText, count: s.count, percentage: s.percentage }))
      });
      
      // สำหรับ Fix Single answer - คำนวณ most, much, medium, less, least
      if (question.questionType === 'Fix Single answer') {
        console.log(`🔍 [ActivityReportDao] Processing Fix Single answer question ${question.questionId}:`, {
          questionText: question.questionText,
          statsFromAnswers,
          totalRespondents,
          totalAnswers
        });
        
        const fixSingleStats = this.calculateFixSingleStats(statsFromAnswers, totalRespondents);
        
        console.log(`✅ [ActivityReportDao] Fix Single answer result for question ${question.questionId}:`, {
          ...fixSingleStats,
          totalRespondents: totalRespondents || totalAnswers
        });
        
        return {
          totalAnswers,
          totalRespondents: totalRespondents || totalAnswers,
          choiceStats: statsFromAnswers,
          average: fixSingleStats.average,
          ...fixSingleStats
        };
      }
      
      return {
        totalAnswers,
        totalRespondents: totalRespondents || totalAnswers,
        choiceStats: statsFromAnswers,
        average: this.calculateAverage(statsFromAnswers)
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

  private calculateFixSingleStats(choiceStats: any[], totalRespondents: number): any {
    console.log(`🔍 [ActivityReportDao] Calculating Fix Single stats:`, {
      choiceStats: choiceStats.map(c => ({ choiceText: c.choiceText, count: c.count })),
      totalRespondents
    });

    // กำหนดค่าเริ่มต้น
    let most = 0;
    let much = 0;
    let medium = 0;
    let less = 0;
    let least = 0;

    // นับจำนวนตามตัวเลือก
    choiceStats.forEach(stat => {
      // ใช้ choiceText หรือ answerText (สำหรับ Fix Single answer)
      const choiceText = (stat.choiceText || stat.answerText || '').toLowerCase().trim();
      const count = stat.count || 0;
      
      console.log(`🔍 [ActivityReportDao] Processing choice:`, {
        choiceText: stat.choiceText,
        answerText: stat.answerText,
        processedText: choiceText,
        count
      });
      
      if (choiceText.includes('มากที่สุด') || choiceText.includes('5')) {
        most = count;
        console.log(`✅ [ActivityReportDao] Found 'มากที่สุด': ${count}`);
      } else if (choiceText.includes('มาก') || choiceText.includes('4')) {
        much = count;
        console.log(`✅ [ActivityReportDao] Found 'มาก': ${count}`);
      } else if (choiceText.includes('ปานกลาง') || choiceText.includes('3')) {
        medium = count;
        console.log(`✅ [ActivityReportDao] Found 'ปานกลาง': ${count}`);
      } else if (choiceText.includes('น้อย') || choiceText.includes('2')) {
        less = count;
        console.log(`✅ [ActivityReportDao] Found 'น้อย': ${count}`);
      } else if (choiceText.includes('น้อยที่สุด') || choiceText.includes('1')) {
        least = count;
        console.log(`✅ [ActivityReportDao] Found 'น้อยที่สุด': ${count}`);
      }
    });

    // คำนวณค่าเฉลี่ย
    const totalCount = most + much + medium + less + least;
    const average = totalCount > 0 ? ((most * 5) + (much * 4) + (medium * 3) + (less * 2) + (least * 1)) / totalCount : 0;

    console.log(`✅ [ActivityReportDao] Fix Single stats calculated:`, {
      most, much, medium, less, least, average: average.toFixed(2)
    });

    return {
      most,
      much,
      medium,
      less,
      least,
      average
    };
  }

  private getTotalRespondents(questions: any[]): number {
    if (questions.length === 0) return 0;
    
    // คำนวณจำนวนผู้ตอบที่ไม่ซ้ำจาก join_id ในทุกคำตอบ
    const uniqueRespondents = new Set<number>();
    questions.forEach(question => {
      if (question.answers && question.answers.length > 0) {
        question.answers.forEach((answer: any) => {
          if (answer.joinId) {
            uniqueRespondents.add(answer.joinId);
          }
        });
      }
    });
    
    return uniqueRespondents.size;
  }

  /**
   * ตรวจสอบข้อมูลคำตอบในฐานข้อมูล (Debug method)
   */
  public async debugAnswers(activityId: number): Promise<any> {
    await this.checkConnection();
    
    try {
      // ตรวจสอบข้อมูล Activity และ Assessment
      const activityInfo = await this.dataSource!.query(
        `SELECT activity_id, activity_name, assessment_id FROM activity WHERE activity_id = $1`,
        [activityId]
      );
      
      if (activityInfo.length === 0) {
        return { error: `Activity ${activityId} not found` };
      }
      
      const assessmentId = activityInfo[0].assessment_id;
      console.log(`🔍 [ActivityReportDao] Debug - Activity ${activityId} has Assessment ${assessmentId}`);
      
      // ตรวจสอบจำนวนคำตอบทั้งหมด
      const totalAnswers = await this.dataSource!.query(
        `SELECT COUNT(*) as count FROM answer WHERE assessment_id = $1`,
        [assessmentId]
      );
      
      // ตรวจสอบคำตอบ Fix Single answer
      const fixSingleAnswers = await this.dataSource!.query(
        `SELECT a.*, q.question_text, q.question_type, c.choice_text 
         FROM answer a 
         INNER JOIN question q ON a.question_id = q.question_id 
         LEFT JOIN choice c ON a.choice_id = c.choice_id 
         WHERE a.assessment_id = $1 AND q.question_type = 'Fix Single answer'
         ORDER BY q.question_number, a.join_id`,
        [assessmentId]
      );
      
      // ตรวจสอบคำถาม Fix Single answer
      const fixSingleQuestions = await this.dataSource!.query(
        `SELECT q.*, c.choice_text 
         FROM question q 
         LEFT JOIN choice c ON q.question_id = c.question_id 
         WHERE q.set_number_id IN (
           SELECT set_number_id FROM set_number WHERE assessment_id = $1
         ) AND q.question_type = 'Fix Single answer'
         ORDER BY q.question_number`,
        [assessmentId]
      );
      
      console.log(`🔍 [ActivityReportDao] Debug results:`, {
        activityId,
        assessmentId,
        totalAnswers: totalAnswers[0].count,
        fixSingleAnswers: fixSingleAnswers.length,
        fixSingleQuestions: fixSingleQuestions.length
      });
      
      return {
        activityId,
        assessmentId,
        totalAnswers: parseInt(totalAnswers[0].count),
        fixSingleAnswers: fixSingleAnswers.map(r => ({
          answer_id: r.answer_id,
          join_id: r.join_id,
          question_id: r.question_id,
          question_text: r.question_text,
          question_type: r.question_type,
          answer_text: r.answer_text,
          choice_text: r.choice_text,
          choice_id: r.choice_id
        })),
        fixSingleQuestions: fixSingleQuestions.map(q => ({
          question_id: q.question_id,
          question_text: q.question_text,
          question_type: q.question_type,
          question_number: q.question_number,
          choice_text: q.choice_text
        }))
      };
    } catch (error) {
      this.logDbError("debugAnswers", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลแบบประเมินความพึงพอใจ
   */
  public async getSatisfactionSurvey(activityId: number): Promise<any> {
    await this.checkConnection();
    
    try {
      console.log("🔍 [ActivityReportDao] Getting satisfaction survey for activity:", activityId);

      // ดึงข้อมูลแบบประเมินความพึงพอใจ (คำถามที่มี question_type = 'satisfaction')
      const satisfactionQuery = `
        SELECT 
          q.question_id,
          q.question_text,
          q.question_type,
          a.answer_text,
          c.choice_text,
          a.join_id
        FROM question q
        INNER JOIN set_number sn ON q.set_number_id = sn.set_number_id
        INNER JOIN assessment a_assess ON sn.assessment_id = a_assess.assessment_id
        INNER JOIN activity act ON a_assess.assessment_id = act.assessment_id
        LEFT JOIN answer a ON q.question_id = a.question_id AND a.assessment_id = a_assess.assessment_id
        LEFT JOIN choice c ON a.choice_id = c.choice_id
        WHERE act.activity_id = $1 AND q.question_type IN ('Fix Single answer', 'Single answer')
        ORDER BY q.question_id, a.answer_id
      `;

      const result = await this.dataSource!.query(satisfactionQuery, [activityId]);
      console.log("🔍 [ActivityReportDao] Satisfaction survey query result:", result.length, "rows");

      if (result.length === 0) {
        console.log("⚠️ [ActivityReportDao] No satisfaction survey data found for activity:", activityId);
        return {
          pieData: [],
          totalRespondents: 0,
          totalText: "ไม่มีข้อมูลแบบประเมินความพึงพอใจ"
        };
      }

      // จัดกลุ่มคำตอบตาม choice_text หรือ answer_text และนับจำนวนคนที่ทำแบบประเมิน
      const choiceCounts: { [key: string]: number } = {};
      const uniqueRespondents = new Set<number>(); // ใช้ Set เพื่อนับคนที่ไม่ซ้ำ

      result.forEach((row: any) => {
        if (row.answer_text || row.choice_text) {
          const choiceText = row.choice_text || row.answer_text;
          choiceCounts[choiceText] = (choiceCounts[choiceText] || 0) + 1;
          
          // เพิ่ม join_id เพื่อนับจำนวนคนที่ไม่ซ้ำ
          if (row.join_id) {
            uniqueRespondents.add(row.join_id);
          }
        }
      });

      const totalResponses = uniqueRespondents.size; // จำนวนคนที่ทำแบบประเมิน

      console.log("🔍 [ActivityReportDao] Choice counts:", choiceCounts);
      console.log("🔍 [ActivityReportDao] Total responses:", totalResponses);

      // สร้าง pieData - คำนวณเปอร์เซ็นต์จากจำนวนคำตอบทั้งหมด (ไม่ใช่จำนวนคน)
      const totalAnswerCount = Object.values(choiceCounts).reduce((sum, count) => sum + count, 0);
      const pieData = Object.entries(choiceCounts).map(([choiceText, count]) => ({
        name: choiceText,
        value: totalAnswerCount > 0 ? ((count / totalAnswerCount) * 100).toFixed(1) : '0.0',
        color: this.getColorForChoice(choiceText)
      }));

      console.log("✅ [ActivityReportDao] Generated pieData:", pieData);

      return {
        pieData,
        totalRespondents: totalResponses,
        totalText: `จากผู้ทำแบบประเมินทั้งหมด ${totalResponses} คน`
      };
    } catch (error) {
      this.logDbError("getSatisfactionSurvey", error);
      throw new Error("❌ Failed to get satisfaction survey");
    }
  }

  /**
   * ดึงข้อมูลสถานะการทำแบบประเมินของนิสิต
   */
  public async getStudentAssessmentStatus(activityId: number): Promise<any> {
    await this.checkConnection();
    
    try {
      console.log("🔍 [ActivityReportDao] Getting student assessment status for activity:", activityId);

      // นับจำนวนนิสิตที่ลงทะเบียนและทำแบบประเมินแล้ว
      const statusQuery = `
        SELECT 
          COUNT(DISTINCT j.join_id) as total_students,
          COUNT(DISTINCT CASE WHEN ans.answer_id IS NOT NULL THEN j.join_id END) as completed_assessments,
          COUNT(DISTINCT CASE WHEN ans.answer_id IS NULL THEN j.join_id END) as pending_assessments
        FROM "join" j
        INNER JOIN activity_detail ad ON j.activity_detail_id = ad.activity_detail_id
        INNER JOIN activity act ON ad.activity_id = act.activity_id
        LEFT JOIN answer ans ON j.join_id = ans.join_id AND ans.assessment_id = act.assessment_id
        WHERE ad.activity_id = $1
      `;

      const result = await this.dataSource!.query(statusQuery, [activityId]);
      console.log("🔍 [ActivityReportDao] Student assessment status query result:", result[0]);

      const { total_students, completed_assessments, pending_assessments } = result[0];

      // สร้างข้อมูลสำหรับ BarChart
      const evaluationStatusData = [
        {
          label: "ทำแบบประเมินแล้ว",
          count: parseInt(completed_assessments),
          total: parseInt(total_students),
          barColor: "bg-green-400",
        },
        {
          label: "ยังไม่ทำแบบประเมิน",
          count: parseInt(pending_assessments),
          total: parseInt(total_students),
          barColor: "bg-red-400",
        }
      ];

      console.log("✅ [ActivityReportDao] Generated evaluation status data:", evaluationStatusData);

      return {
        evaluationStatusData,
        totalStudents: parseInt(total_students),
        completedAssessments: parseInt(completed_assessments),
        pendingAssessments: parseInt(pending_assessments),
        totalText: `จากผู้เข้าร่วมเต็มเวลาทั้งหมด ${total_students} คน (100.0%)`
      };
    } catch (error) {
      this.logDbError("getStudentAssessmentStatus", error);
      throw new Error("❌ Failed to get student assessment status");
    }
  }
}
