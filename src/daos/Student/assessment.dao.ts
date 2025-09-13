import { DataSource } from "typeorm";
import { ErrorHandledDao } from "../error.handled.dao";
import { connectDatabase } from "../../db/database";

export class AssessmentDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ AssessmentDao initialized");
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
   * ส่งคำตอบ assessment
   * @param assessment_id - ID ของ assessment
   * @param join_id - ID ของ join (student enrollment)
   * @param answers - คำตอบทั้งหมด
   */
  public async submitAssessment(
    assessment_id: number,
    join_id: number,
    answers: {
      satisfaction: { [questionId: number]: string };
      multiple_choice: { [questionId: number]: string[] };
      single_choice: { [questionId: number]: string };
      open_ended: { [questionId: number]: string };
    }
  ): Promise<any> {
    await this.checkConnection();
    
    const queryRunner = this.dataSource!.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log("🔄 [AssessmentDao] Submitting assessment:", {
        assessment_id,
        join_id,
        answersCount: {
          satisfaction: Object.keys(answers.satisfaction).length,
          multiple_choice: Object.keys(answers.multiple_choice).length,
          single_choice: Object.keys(answers.single_choice).length,
          open_ended: Object.keys(answers.open_ended).length,
        }
      });

      let totalAnswersInserted = 0;

      // ส่งคำตอบ satisfaction
      for (const [questionId, answer] of Object.entries(answers.satisfaction)) {
        if (answer) {
          // หา choice_id จาก choice_text สำหรับ satisfaction questions
          const choiceResult = await queryRunner.query(
            `SELECT choice_id FROM choice WHERE question_id = $1 AND choice_text = $2`,
            [parseInt(questionId), answer]
          );
          
          if (choiceResult.length > 0) {
            await queryRunner.query(
              `INSERT INTO answer (join_id, question_id, choice_id, answer_text, set_number_id, assessment_id) 
               SELECT $1, $2, $3, $4, q.set_number_id, $5 
               FROM question q WHERE q.question_id = $2`,
              [join_id, parseInt(questionId), choiceResult[0].choice_id, answer, assessment_id]
            );
            totalAnswersInserted++;
          }
        }
      }

      // ส่งคำตอบ multiple choice
      for (const [questionId, selectedOptions] of Object.entries(answers.multiple_choice)) {
        if (selectedOptions && selectedOptions.length > 0) {
          for (const option of selectedOptions) {
            // หา choice_id จาก choice_text
            const choiceResult = await queryRunner.query(
              `SELECT choice_id FROM choice WHERE question_id = $1 AND choice_text = $2`,
              [parseInt(questionId), option]
            );
            
            if (choiceResult.length > 0) {
              await queryRunner.query(
                `INSERT INTO answer (join_id, question_id, choice_id, set_number_id, assessment_id) 
                 SELECT $1, $2, $3, q.set_number_id, $4 
                 FROM question q WHERE q.question_id = $2`,
                [join_id, parseInt(questionId), choiceResult[0].choice_id, assessment_id]
              );
              totalAnswersInserted++;
            }
          }
        }
      }

      // ส่งคำตอบ single choice
      for (const [questionId, selectedOption] of Object.entries(answers.single_choice)) {
        if (selectedOption) {
          // หา choice_id จาก choice_text
          const choiceResult = await queryRunner.query(
            `SELECT choice_id FROM choice WHERE question_id = $1 AND choice_text = $2`,
            [parseInt(questionId), selectedOption]
          );
          
          if (choiceResult.length > 0) {
            await queryRunner.query(
              `INSERT INTO answer (join_id, question_id, choice_id, set_number_id, assessment_id) 
               SELECT $1, $2, $3, q.set_number_id, $4 
               FROM question q WHERE q.question_id = $2`,
              [join_id, parseInt(questionId), choiceResult[0].choice_id, assessment_id]
            );
            totalAnswersInserted++;
          }
        }
      }

      // ส่งคำตอบ open ended
      for (const [questionId, answer] of Object.entries(answers.open_ended)) {
        if (answer) {
          // สำหรับ open_ended questions ใช้ choice_id = 1 (dummy choice) หรือหา choice แรกของคำถามนั้น
          const firstChoiceResult = await queryRunner.query(
            `SELECT choice_id FROM choice WHERE question_id = $1 ORDER BY choice_id LIMIT 1`,
            [parseInt(questionId)]
          );
          
          const choiceId = firstChoiceResult.length > 0 ? firstChoiceResult[0].choice_id : 1;
          
          await queryRunner.query(
            `INSERT INTO answer (join_id, question_id, choice_id, answer_text, set_number_id, assessment_id) 
             SELECT $1, $2, $3, $4, q.set_number_id, $5 
             FROM question q WHERE q.question_id = $2`,
            [join_id, parseInt(questionId), choiceId, answer, assessment_id]
          );
          totalAnswersInserted++;
        }
      }

      await queryRunner.commitTransaction();

      console.log("✅ [AssessmentDao] Assessment submitted successfully:", {
        assessment_id,
        join_id,
        totalAnswersInserted
      });

      return {
        success: true,
        assessment_id,
        join_id,
        answersCount: totalAnswersInserted
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logDbError("submitAssessment", error);
      throw new Error("❌ Failed to submit assessment");
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * ดึงข้อมูล assessment พร้อมคำถาม
   * @param assessment_id - ID ของ assessment
   */
  public async getAssessmentWithQuestions(assessment_id: number): Promise<any> {
    await this.checkConnection();
    try {
      // ดึงข้อมูล assessment
      const assessmentResult = await this.dataSource!.query(
        `SELECT * FROM assessment WHERE assessment_id = $1`,
        [assessment_id]
      );

      if (assessmentResult.length === 0) {
        return null;
      }

      const assessment = assessmentResult[0];

      // ดึงข้อมูล set numbers
      const setNumbersResult = await this.dataSource!.query(
        `SELECT * FROM set_number WHERE assessment_id = $1 ORDER BY set_number_id`,
        [assessment_id]
      );

      // ดึงข้อมูลคำถามและตัวเลือก
      const questionsResult = await this.dataSource!.query(
        `SELECT 
           q.question_id,
           q.question_text,
           q.question_number,
           q.question_type,
           q.set_number_id,
           sn.name as set_name,
           sn.set_number_id
         FROM question q
         LEFT JOIN set_number sn ON q.set_number_id = sn.set_number_id
         WHERE sn.assessment_id = $1
         ORDER BY sn.set_number_id, q.question_number`,
        [assessment_id]
      );

      // ดึงข้อมูลตัวเลือกสำหรับแต่ละคำถาม
      const questionsWithChoices = await Promise.all(
        questionsResult.map(async (question: any) => {
          const choicesResult = await this.dataSource!.query(
            `SELECT choice_id, choice_text FROM choice WHERE question_id = $1 ORDER BY choice_id`,
            [question.question_id]
          );

          return {
            ...question,
            options: choicesResult.map((choice: any) => choice.choice_text)
          };
        })
      );

      // จัดกลุ่มคำถามตาม set
      const sections = setNumbersResult.map((set: any) => ({
        section_id: set.set_number_id,
        section_name: set.name,
        section_order: set.set_number_id,
        questions: questionsWithChoices.filter((q: any) => q.set_number_id === set.set_number_id)
      }));

      return {
        ...assessment,
        sections,
        questions: questionsWithChoices
      };
    } catch (error) {
      this.logDbError("getAssessmentWithQuestions", error);
      throw new Error("❌ Failed to get assessment with questions");
    }
  }

  /**
   * ดึงข้อมูล assessment ตาม activity ID
   * @param activity_id - ID ของ activity
   */
  public async getAssessmentByActivityId(activity_id: number): Promise<any> {
    await this.checkConnection();
    try {
      // ดึงข้อมูล assessment จาก activity
      const assessmentResult = await this.dataSource!.query(
        `SELECT a.*, act.activity_name 
         FROM assessment a
         INNER JOIN activity act ON a.assessment_id = act.assessment_id
         WHERE act.activity_id = $1`,
        [activity_id]
      );

      if (assessmentResult.length === 0) {
        return null;
      }

      const assessment = assessmentResult[0];
      const assessment_id = assessment.assessment_id;

      // ดึงข้อมูลคำถามและตัวเลือก (ใช้ฟังก์ชันเดิม)
      const assessmentWithQuestions = await this.getAssessmentWithQuestions(assessment_id);
      
      if (assessmentWithQuestions) {
        return {
          ...assessmentWithQuestions,
          activity_name: assessment.activity_name
        };
      }

      return assessment;
    } catch (error) {
      this.logDbError("getAssessmentByActivityId", error);
      throw new Error("❌ Failed to get assessment by activity ID");
    }
  }

  /**
   * ดึงข้อมูล assessment ตาม ID
   * @param assessment_id - ID ของ assessment
   */
  public async getAssessmentById(assessment_id: number): Promise<any> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM assessment WHERE assessment_id = $1`,
        [assessment_id]
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logDbError("getAssessmentById", error);
      throw new Error("❌ Failed to get assessment by ID");
    }
  }

  /**
   * ดึงข้อมูล join ตาม ID
   * @param join_id - ID ของ join
   */
  public async getJoinById(join_id: number): Promise<any> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM "join" WHERE join_id = $1`,
        [join_id]
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logDbError("getJoinById", error);
      throw new Error("❌ Failed to get join by ID");
    }
  }

  /**
   * ตรวจสอบว่าส่งคำตอบไปแล้วหรือยัง
   * @param join_id - ID ของ join
   * @param assessment_id - ID ของ assessment
   */
  public async getAnswersByJoinAndAssessment(join_id: number, assessment_id: number): Promise<any[]> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM answer WHERE join_id = $1 AND assessment_id = $2`,
        [join_id, assessment_id]
      );
      return result;
    } catch (error) {
      this.logDbError("getAnswersByJoinAndAssessment", error);
      throw new Error("❌ Failed to get answers by join and assessment");
    }
  }

  /**
   * ดึงข้อมูล set numbers ตาม assessment ID
   * @param assessment_id - ID ของ assessment
   */
  public async getSetNumbersByAssessmentId(assessment_id: number): Promise<any[]> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM set_number WHERE assessment_id = $1 ORDER BY set_number_id`,
        [assessment_id]
      );
      return result;
    } catch (error) {
      this.logDbError("getSetNumbersByAssessmentId", error);
      throw new Error("❌ Failed to get set numbers by assessment ID");
    }
  }

  /**
   * ดึงข้อมูลคำถามและตัวเลือกตาม assessment ID
   * @param assessment_id - ID ของ assessment
   */
  public async getQuestionsByAssessmentId(assessment_id: number): Promise<any[]> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        `SELECT 
           q.question_id,
           q.question_text,
           q.question_number,
           q.question_type,
           q.set_number_id,
           sn.name as set_name,
           sn.set_number_id
         FROM question q
         LEFT JOIN set_number sn ON q.set_number_id = sn.set_number_id
         WHERE sn.assessment_id = $1
         ORDER BY sn.set_number_id, q.question_number`,
        [assessment_id]
      );

      // ดึงข้อมูลตัวเลือกสำหรับแต่ละคำถาม
      const questionsWithChoices = await Promise.all(
        result.map(async (question: any) => {
          const choicesResult = await this.dataSource!.query(
            `SELECT choice_id, choice_text FROM choice WHERE question_id = $1 ORDER BY choice_id`,
            [question.question_id]
          );

          return {
            ...question,
            options: choicesResult.map((choice: any) => choice.choice_text)
          };
        })
      );

      return questionsWithChoices;
    } catch (error) {
      this.logDbError("getQuestionsByAssessmentId", error);
      throw new Error("❌ Failed to get questions by assessment ID");
    }
  }
}
