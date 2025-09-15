import { SetNumber } from "../../entity/Assessment/setNumbers.entity";
import { ErrorHandledService } from "../error.handdled.service";
import { SetNumberDao } from "../../daos/Teacher/setNumber.dao";
import { QuestionDao } from "../../daos/Teacher/question.dao";
import { AssessmentDao } from "../../daos/Teacher/assessment.dao";
import { ChoiceDao } from "../../daos/Teacher/choice.dao";

export class SetNumberService extends ErrorHandledService {
  constructor(private readonly setNumberDao = new SetNumberDao(), private readonly questionDao = new QuestionDao(), private readonly assessmentDao = new AssessmentDao(), private readonly choiceDao = new ChoiceDao()) {
    super();
  }


  // public async getSetNumbersQuestionByID(set_number_id: number): Promise<SetNumber[]> {
  //   try {
  //     const result = await this.setNumberDao.getSetNumbersQuestionByID(set_number_id)
  //     this.logInfo("📦 SetNumbers fetched");
  //     return result;
  //   } catch (error) {
  //     this.logError("❌ Error in getSetNumbers", error);
  //     throw error;
  //   }
  // }

  // public async getSetNumbers(page: number, limit: number): Promise<SetNumber[]> {
  //   try {
  //     const result = await this.setNumberDao.getSetNumbers(page, limit);
  //     this.logInfo("📦 SetNumbers fetched", { count: result.length });
  //     return result;
  //   } catch (error) {
  //     this.logError("❌ Error in getSetNumbers", error);
  //     throw error;
  //   }
  // }

  public async getSetNumbers(): Promise<SetNumber[]> {
    try {
      const result = await this.setNumberDao.getSetNumbers();
      this.logInfo("📦 SetNumbers fetched", { count: result.length });
      return result;
    } catch (error) {
      this.logError("❌ Error in getSetNumbers", error);
      throw error;
    }
  }

  public async getSetNumbersByAssessmentID(assessment_id: number): Promise<SetNumber[]> {
    try {
      const result = await this.setNumberDao.getSetNumbersByAssessmentID(assessment_id)
      this.logInfo("📦 SetNumbers fetched", { count: result.length });
      return result;
    } catch (error) {
      this.logError("❌ Error in getSetNumbersByAssessmentID", error);
      throw error;
    }
  }

  // public async createSetNumber(name: string, status: string | undefined, assessment_id: number): Promise<SetNumber> {
  //   const Find_Assessment = await this.getSetNumbersByAssessmentID(assessment_id)
  //   const trimmedName = name.trim();
  //   const trimmedStatus = status?.trim() || 'Active';
  //   try {
  //     // ตรวจสอบว่าชื่อไม่ว่างเปล่า
  //     if (!trimmedName) {
  //       throw new Error("ชื่อชุดคำถามไม่สามารถเป็นค่าว่างได้");
  //     }

  //     // ตรวจสอบ status ที่อนุญาต
  //     const allowedStatuses = ["Active", "Inactive"];
  //     if (!allowedStatuses.includes(trimmedStatus)) {
  //       throw new Error(`สถานะต้องเป็น 'Active' หรือ 'Inactive' เท่านั้น`);
  //     }

  //     if (Find_Assessment.length > 0) {
  //       const AssessmentID = Find_Assessment[0].assessment_id
  //       const result = await this.setNumberDao.addSetNumber(trimmedName, trimmedStatus, AssessmentID)
  //       return result
  //     } else {
  //       console.log(`ไม่พบ Assessment ID : ${assessment_id} อยู่ในระบบ`)
  //       return null;
  //     }
  //   } catch (error) {
  //     this.logError("❌ Error in createSetNumber", error);
  //     throw error;
  //   }
  // }


  public async createSetNumber(
    name: string,
    status: string | undefined,
    assessment_id: number
  ): Promise<SetNumber | null> {
    const Find_Assessment = await this.assessmentDao.getAssessmentByID(assessment_id); // ✅ ใช้ assessmentDao
    const trimmedName = name.trim();
    const trimmedStatus = status?.trim() || "Active";

    try {
      if (!trimmedName) {
        throw new Error("ชื่อชุดคำถามไม่สามารถเป็นค่าว่างได้");
      }

      const allowedStatuses = ["Active", "Inactive"];
      if (!allowedStatuses.includes(trimmedStatus)) {
        throw new Error(`สถานะต้องเป็น 'Active' หรือ 'Inactive' เท่านั้น`);
      }

      if (Find_Assessment.length > 0) {
        const AssessmentID = Find_Assessment[0].assessment_id; // ✅ เอามาจาก assessment table
        const result = await this.setNumberDao.addSetNumber(
          trimmedName,
          trimmedStatus,
          AssessmentID
        );
        return result;
      } else {
        console.log(`ไม่พบ Assessment ID : ${assessment_id} อยู่ในระบบ`);
        return null;
      }
    } catch (error) {
      this.logError("❌ Error in createSetNumber", error);
      throw error;
    }
  }


  //duplicate 
  public async duplicateSetNumber(set_number_id: number): Promise<SetNumber | null> {
    // 1) หา set_number เดิม
    const oldSet = await this.setNumberDao.getSetNumberByID(set_number_id);
    if (!oldSet.length) return null;

    const original = oldSet[0];
    console.log("🔍 Original setNumber:", { id: original.set_number_id, name: original.name, assessment_id: original.assessment_id });

    // 2) ดึง setNumbers ทั้งหมดใน assessment เดียวกันเพื่อหา order
    const allSetNumbers = await this.setNumberDao.getSetNumbersByAssessmentID(original.assessment_id);
    console.log("📋 All setNumbers in assessment:", allSetNumbers.map(sn => ({ id: sn.set_number_id, name: sn.name })));

    // 3) หาตำแหน่งของ setNumber ต้นฉบับ
    const originalIndex = allSetNumbers.findIndex(sn => sn.set_number_id === original.set_number_id);
    console.log("🎯 Original index:", originalIndex);

    // 4) สร้าง set_number ใหม่
    const newSet = await this.setNumberDao.addSetNumber(
      original.name + " (Copy)",
      original.status,
      original.assessment_id
    );
    console.log("✅ Created new setNumber:", { id: newSet.set_number_id, name: newSet.name });

    // 5) ดึงคำถามทั้งหมดของหัวข้อเก่า
    const oldQuestions = await this.questionDao.getQuestionBySetNumberID(original.set_number_id);

    for (const q of oldQuestions) {
      // 6) สร้างคำถามใหม่ผูกกับ set_number ใหม่
      const newQuestion = await this.questionDao.addQuestion(
        q.question_text,
        newSet.set_number_id,
        q.question_type
      );

      // 7) ดึง choices ของคำถามเก่า
      const oldChoices = await this.choiceDao.getChoiceByQuestionID(q.question_id);

      for (const c of oldChoices) {
        // 8) คัดลอก choice ใหม่ไปยัง question ใหม่
        await this.choiceDao.addChoice(c.choice_text, newQuestion.question_id);
      }
    }

    return newSet;
  }


  public async updateSetNumber(
    set_number_id: number,
    name: string,
    status: string | undefined,
    assessment_id: number
  ): Promise<SetNumber | null> {
    const Find_SETNUMBER = await this.setNumberDao.getSetNumberByID(set_number_id)
    const Fint_Assessment = await this.assessmentDao.getAssessmentByID(assessment_id)
    try {
      if (Find_SETNUMBER.length > 0) {
        if (Fint_Assessment.length > 0) {
          const SetNumberID = Find_SETNUMBER[0].set_number_id
          const AssessmentID = Fint_Assessment[0].assessment_id
          const result = await this.setNumberDao.updateSetNumber(SetNumberID, name, status, AssessmentID)
          return result
        } else {
          console.log(`ไม่พบ Assessment ID : ${assessment_id} อยู่ในระบบ`)
          return null;
        }
      } else {
        console.log(`ไม่พบ SETNUMBER ID : ${assessment_id} นี้อยู่ในระบบ`)
        return null;
      }
    } catch (error) {
      this.logError("❌ Error in updateSetNumber", error);
      throw error;
    }
  }

  public async deleteSetNumber(set_number_id: number): Promise<boolean> {
    const Find_SetNumber = await this.setNumberDao.getSetNumberByID(set_number_id)
    const SetNumberID = Find_SetNumber[0].set_number_id
    const Find_Question = await this.questionDao.getQuestionBySetNumberID(SetNumberID)
    const Find_Choice = await this.choiceDao.getChoiceBySetNumberID(SetNumberID)
    try {

      if (Find_SetNumber.length > 0) {
        if (Find_Question.length > 0) {
          if (Find_Choice.length > 0) {
            await this.choiceDao.deleteChoiceBySetnumberID(SetNumberID)
            await this.questionDao.deleteQuestionBySetNumberID(SetNumberID)
            await this.setNumberDao.deleteSetNumber(SetNumberID)
            return true
          } else {
            await this.questionDao.deleteQuestionBySetNumberID(SetNumberID)
            await this.setNumberDao.deleteSetNumber(SetNumberID)
            return true
          }
        } else {
          await this.setNumberDao.deleteSetNumber(SetNumberID)
          return true
        }
      } else {
        console.log(`ไม่พบชุดแบบสอบถาม ID ${set_number_id} อยู่ในระบบ`)
        return false;
      }

    } catch (error) {
      this.logError("❌ Error in deleteSetNumber", error);
      throw error;
    }
  }
}





// import { SetNumber } from "../../entity/setNumbers.entity";
// import { ErrorHandledService } from "../error.handdled.service";
// import { SetNumberDao } from "../../daos/Teacher/setNumber.dao";
// import { QuestionDao } from "../../daos/Teacher/question.dao";

// export class SetNumberService extends ErrorHandledService {
//   constructor(private readonly setNumberDao = new SetNumberDao(), private readonly questionDao = new QuestionDao()) {
//     super();
//   }

//   public async createSetNumber(name: string, status: string | undefined): Promise<SetNumber> {
//     try {
//       // ข้อมูลจะถูก validate แล้วโดย DTO และ middleware
//       const trimmedName = name.trim();
//       const trimmedStatus = status?.trim() || 'Active'; // Default to 'Active' if status is undefined

//       // ตรวจสอบว่าชื่อไม่ว่างเปล่า
//       if (!trimmedName) {
//         throw new Error("ชื่อชุดคำถามไม่สามารถเป็นค่าว่างได้");
//       }

//       // ตรวจสอบ status ที่อนุญาต
//       const allowedStatuses = ["Active", "Inactive"];
//       if (!allowedStatuses.includes(trimmedStatus)) {
//         throw new Error(`สถานะต้องเป็น 'Active' หรือ 'Inactive' เท่านั้น`);
//       }

//       const existing = await this.setNumberDao.getSetNumberByName(trimmedName);
//       if (existing.length > 0) {
//         this.logInfo("🚫 Duplicate set name", { name: trimmedName });
//         throw new Error("มีชุดคำถามนี้อยู่ในระบบแล้ว");
//       }

//       const created = await this.setNumberDao.addSetNumber(trimmedName, trimmedStatus);
//       this.logInfo("🆕 SetNumber created", { set_number_id: created.set_number_id });
//       return created;
//     } catch (error) {
//       this.logError("❌ Error in createSetNumber", error);
//       throw error;
//     }
//   }



//   public async getSetNumbersQuestionByID(set_number_id: number): Promise<SetNumber[]> {
//     try {
//       const result = await this.setNumberDao.getSetNumbersQuestionByID(set_number_id)
//       this.logInfo("📦 SetNumbers fetched");
//       return result;
//     } catch (error) {
//       this.logError("❌ Error in getSetNumbers", error);
//       throw error;
//     }
//   }

//   public async getSetNumbers(page: number, limit: number): Promise<SetNumber[]> {
//     try {
//       const result = await this.setNumberDao.getSetNumbers(page, limit);
//       this.logInfo("📦 SetNumbers fetched", { count: result.length });
//       return result;
//     } catch (error) {
//       this.logError("❌ Error in getSetNumbers", error);
//       throw error;
//     }
//   }

//   public async getSetNumberByID(set_number_id: number): Promise<SetNumber | null> {
//     try {
//       const result = await this.setNumberDao.getSetNumberByID(set_number_id);
//       return result[0] || null;
//     } catch (error) {
//       this.logError("❌ Error in getSetNumberByID", error);
//       throw error;
//     }
//   }

//   public async updateSetNumber(
//     set_number_id: number,
//     name: string,
//     status: string | undefined
//   ): Promise<SetNumber | null> {
//     try {
//       const updated = await this.setNumberDao.updateSetNumber(set_number_id, name, status);
//       if (updated) {
//         this.logInfo("✏️ SetNumber updated", { set_number_id });
//       }
//       return updated;
//     } catch (error) {
//       this.logError("❌ Error in updateSetNumber", error);
//       throw error;
//     }
//   }

//   public async deleteSetNumber(set_number_id: number): Promise<SetNumber | null> {
//     const Find_SetNumber = await this.setNumberDao.getSetNumberByID(set_number_id)
//     const Question_IN_SetNumber = await this.questionDao.getQuestionBySetNumberID(set_number_id)
//     try {

//       if (Find_SetNumber.length > 0) {
//         const ID = Find_SetNumber[0].set_number_id
//         if (Question_IN_SetNumber.length > 0) {
//           await this.questionDao.deleteQuestionBySetNumberID(ID)
//           const deleted = await this.setNumberDao.deleteSetNumber(ID);
//           if (deleted) {
//             this.logInfo("🗑️ SetNumber deleted", { ID });
//           }
//           return deleted;
//         } else {
//           const deleted = await this.setNumberDao.deleteSetNumber(ID);
//           if (deleted) {
//             this.logInfo("🗑️ SetNumber deleted", { ID });
//           }
//           return deleted;
//         }
//       } else {
//         console.log(`ไม่พบชุดแบบสอบถาม ID ${set_number_id} อยู่ในระบบ`)
//         return null;
//       }

//     } catch (error) {
//       this.logError("❌ Error in deleteSetNumber", error);
//       throw error;
//     }
//   }

//   public async countSetNumbers(): Promise<number> {
//     try {
//       const count = await this.setNumberDao.countSetNumbers();
//       this.logInfo("📊 SetNumber count fetched", { count });
//       return count;
//     } catch (error) {
//       this.logError("❌ Error in countSetNumbers", error);
//       throw error;
//     }
//   }
// }
