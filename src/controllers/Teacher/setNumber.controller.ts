import { Request, Response } from "express";
import { SetNumberService } from "../../services/Teacher/setNumber.service";
import { ErrorHandledController } from "../error.handled.controller";

export class SetNumberController extends ErrorHandledController {
  constructor(private readonly setNumberService: SetNumberService) {
    super();
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {

      const setNumbers = await this.setNumberService.getSetNumbers();

      res.status(200).json({
        message: "ดึงข้อมูลหัวข้อคำถามสำเร็จ!",
        data: setNumbers,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server not found"
      })
      this.handleError("SetNumberController.getAll", error, res);
    }
  }


  public async getSetNumbersByAssessmentID(req: Request, res: Response): Promise<void> {
    const { assessment_id } = req.params
    const AssessmentID = parseInt(assessment_id)

    try {

      const setNumbers = await this.setNumberService.getSetNumbersByAssessmentID(AssessmentID)

      res.status(200).json({
        message: "ดึงข้อมูลหัวข้อคำถามสำเร็จ!",
        data: setNumbers,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server not found"
      })
      this.handleError("SetNumberController.getAll", error, res);
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    const { name, status, assessment_id } = req.body;
    const AssessmentID = parseInt(assessment_id)
    try {
      const create = await this.setNumberService.createSetNumber(name, status, AssessmentID)
      if (create !== null) {
        res.status(200).json({
          message: "สร้างหัวข้อคำถามสำเร็จ!",
          data: create,
        });
      } else {
        res.status(404).json({
          message: "สร้างหัวข้อคำถามไม่สำเร็จ!",
        });
      }
    } catch (error) {
      res.status(500).json({
        message: "Server not found"
      })
      this.handleError("SetNumberController.create", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { set_number_id } = req.params
    const { name, status, assessment_id } = req.body
    const SetNumberID = parseInt(set_number_id)
    const AssessmentID = parseInt(assessment_id)
    console.log("SET ID :", set_number_id)
    try {
      const updated = await this.setNumberService.updateSetNumber(SetNumberID, name, status, AssessmentID)
      if (updated !== null) {
        res.status(200).json({
          message: "แก้ไขหัวข้อคำถามสำเร็จ!",
          data: updated,
        });
      } else {
        res.status(404).json({
          message: "แก้ไขหัวข้อคำถามไม่สำเร็จ!",
        });
      }
    } catch (error) {
      res.status(500).json({
        message: "Server not found"
      })
      this.handleError("SetNumberController.update", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { set_number_id } = req.params
    const SetNumberID = parseInt(set_number_id)
    try {


      if (isNaN(SetNumberID)) {
        res.status(400).json({ message: "ID ชุดคำถามไม่ถูกต้อง" });
        return;
      }

      const deleted = await this.setNumberService.deleteSetNumber(SetNumberID);

      if (!deleted) {
        res.status(404).json({ message: "ไม่พบชุดคำถามที่ต้องการลบ" });
        return;
      }

      res.status(200).json({
        message: "ลบชุดคำถามสำเร็จ!",
        data: deleted,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server not found"
      })
      this.handleError("SetNumberController.delete", error, res);
    }
  }
}





// import { Request, Response } from "express";
// import { SetNumberService } from "../../services/Teacher/setNumber.service";
// import { ErrorHandledController } from "../error.handled.controller";

// export class SetNumberController extends ErrorHandledController {
//   constructor(private readonly setNumberService: SetNumberService) {
//     super();
//   }

//   public async create(req: Request, res: Response): Promise<void> {
//     try {
//       // ตรวจสอบว่า request body มีข้อมูลหรือไม่
//       if (!req.body || Object.keys(req.body).length === 0) {
//         res.status(400).json({
//           message: "กรุณาส่งข้อมูลที่จำเป็น",
//           errors: [
//             {
//               field: "body",
//               messages: ["Request body ไม่สามารถเป็นค่าว่างได้"]
//             }
//           ]
//         });
//         return;
//       }

//       // ข้อมูลจะถูก validate แล้วโดย middleware validateDTO
//       const { name, status } = req.body;

//       // ตรวจสอบข้อมูลที่จำเป็น
//       if (!name || name.trim() === '') {
//         res.status(400).json({
//           message: "ข้อมูลไม่ครบถ้วน",
//           errors: [
//             {
//               field: "name",
//               messages: ["ชื่อชุดคำถามไม่สามารถเป็นค่าว่างได้"]
//             }
//           ]
//         });
//         return;
//       }

//       const created = await this.setNumberService.createSetNumber(name, status || 'Active');

//       if (created) {
//         res.status(201).json({
//           message: "สร้างชุดคำถามสำเร็จ!",
//           setNumber: created,
//         });
//       } else {
//         res.status(409).json({ message: "มีชุดคำถามนี้อยู่ในระบบแล้ว!" });
//       }
//     } catch (error) {
//       this.handleError("SetNumberController.create", error, res);
//     }
//   }

//   public async getAll(req: Request, res: Response): Promise<void> {
//     try {
//       const page = parseInt(req.query.page as string) || 1;
//       const limit = parseInt(req.query.limit as string) || 10;

//       const setNumbers = await this.setNumberService.getSetNumbers(page, limit);
//       const totalCount = await this.setNumberService.countSetNumbers();

//       res.status(200).json({
//         message: "ดึงข้อมูลชุดคำถามสำเร็จ!",
//         data: setNumbers,
//         pagination: {
//           page,
//           limit,
//           total: totalCount,
//           totalPages: Math.ceil(totalCount / limit),
//         },
//       });
//     } catch (error) {
//       this.handleError("SetNumberController.getAll", error, res);
//     }
//   }

//   public async getSetNumbersQuestionByID(req: Request, res: Response): Promise<void> {
//     try {
//       const setNumberId = parseInt(req.params.id);

//       if (isNaN(setNumberId)) {
//         res.status(400).json({ message: "ID ชุดคำถามไม่ถูกต้อง" });
//         return;
//       }

//       const setNumber = await this.setNumberService.getSetNumbersQuestionByID(setNumberId)

//       if (!setNumber) {
//         res.status(404).json({ message: "ไม่พบชุดคำถามที่ต้องการ" });
//         return;
//       }

//       res.status(200).json({
//         message: "ดึงข้อมูลชุดคำถามสำเร็จ!",
//         data: setNumber,
//       });
//     } catch (error) {
//       this.handleError("SetNumberController.getById", error, res);
//     }
//   }

//   public async getById(req: Request, res: Response): Promise<void> {
//     try {
//       const setNumberId = parseInt(req.params.id);

//       if (isNaN(setNumberId)) {
//         res.status(400).json({ message: "ID ชุดคำถามไม่ถูกต้อง" });
//         return;
//       }

//       const setNumber = await this.setNumberService.getSetNumberByID(setNumberId);

//       if (!setNumber) {
//         res.status(404).json({ message: "ไม่พบชุดคำถามที่ต้องการ" });
//         return;
//       }

//       res.status(200).json({
//         message: "ดึงข้อมูลชุดคำถามสำเร็จ!",
//         data: setNumber,
//       });
//     } catch (error) {
//       this.handleError("SetNumberController.getById", error, res);
//     }
//   }

//   public async update(req: Request, res: Response): Promise<void> {
//     try {
//       const setNumberId = parseInt(req.params.id);

//       if (isNaN(setNumberId)) {
//         res.status(400).json({ message: "ID ชุดคำถามไม่ถูกต้อง" });
//         return;
//       }

//       const { name, status } = req.body;

//       const updated = await this.setNumberService.updateSetNumber(
//         setNumberId,
//         name,
//         status
//       );

//       if (!updated) {
//         res.status(404).json({ message: "ไม่พบชุดคำถามที่ต้องการอัปเดต" });
//         return;
//       }

//       res.status(200).json({
//         message: "อัปเดตชุดคำถามสำเร็จ!",
//         data: updated,
//       });
//     } catch (error) {
//       this.handleError("SetNumberController.update", error, res);
//     }
//   }

//   public async delete(req: Request, res: Response): Promise<void> {
//     try {
//       const setNumberId = parseInt(req.params.id);

//       if (isNaN(setNumberId)) {
//         res.status(400).json({ message: "ID ชุดคำถามไม่ถูกต้อง" });
//         return;
//       }

//       const deleted = await this.setNumberService.deleteSetNumber(setNumberId);

//       if (!deleted) {
//         res.status(404).json({ message: "ไม่พบชุดคำถามที่ต้องการลบ" });
//         return;
//       }

//       res.status(200).json({
//         message: "ลบชุดคำถามสำเร็จ!",
//         data: deleted,
//       });
//     } catch (error) {
//       this.handleError("SetNumberController.delete", error, res);
//     }
//   }
// }
