// import { Request, Response } from "express";
// import { AssessmentService } from "../../services/Teacher/assessment.service";
// import { ErrorHandledController } from "../error.handled.controller";
// import xss from "xss";

// export class AssessmentController extends ErrorHandledController {
//   constructor(private readonly assessmentService: AssessmentService) {
//     super();
//   }

//   public async count(req: Request, res: Response): Promise<void> {
//     try {
//       const result = await this.assessmentService.countAssessments();
//       res.status(200).json(result);
//     } catch (error) {
//       this.handleError("AssessmentController.count", error, res);
//     }
//   }

//   public async getAll(req: Request, res: Response): Promise<void> {
//     try {
//       const page = parseInt(req.query.page as string, 10) || 1;
//       const limit = parseInt(req.query.limit as string, 10) || 10;

//       const assessments = await this.assessmentService.getAssessments(
//         page,
//         limit
//       );
//       res.status(200).json(assessments);
//     } catch (error) {
//       this.handleError("AssessmentController.getAll", error, res);
//     }
//   }

//   public async create(req: Request, res: Response): Promise<void> {
//     try {
//       const data = this.parseAssessmentPayload(req.body);
//       const created = await this.assessmentService.addAssessment(
//         data.title,
//         data.description,
//         data.status
//       );

//       if (created) {
//         res.status(201).json({
//           message: "สร้างแบบประเมินสำเร็จ!",
//           assessment: created,
//         });
//       } else {
//         res.status(409).json({ message: "มีแบบประเมินนี้อยู่ในระบบแล้ว!" });
//       }
//     } catch (error) {
//       this.handleError("AssessmentController.create", error, res);
//     }
//   }

//   public async update(req: Request, res: Response): Promise<void> {
//     try {
//       const assessment_id = this.parseId(req.params.assessment_id);
//       const data = this.parseAssessmentPayload(req.body);

//       const updated = await this.assessmentService.updateAssessment(
//         assessment_id,
//         data.title,
//         data.description,
//         data.status
//       );

//       if (updated) {
//         res.status(200).json({
//           message: "แก้ไขแบบประเมินสำเร็จ!",
//           updated,
//         });
//       } else {
//         res.status(409).json({
//           message: "แบบประเมินนี้มีอยู่แล้ว หรือไม่พบที่ต้องการแก้ไข!",
//         });
//       }
//     } catch (error) {
//       this.handleError("AssessmentController.update", error, res);
//     }
//   }

//   public async delete(req: Request, res: Response): Promise<void> {
//     try {
//       const assessment_id = this.parseId(req.params.assessment_id);
//       const deleted = await this.assessmentService.deleteAssessment(
//         assessment_id
//       );

//       if (deleted) {
//         res.status(200).json({ message: "ลบแบบประเมินสำเร็จ!" });
//       } else {
//         res.status(404).json({ message: "ไม่พบแบบประเมินที่ต้องการลบ!" });
//       }
//     } catch (error) {
//       this.handleError("AssessmentController.delete", error, res);
//     }
//   }

//   // 🔧 Utils
//   private parseId(value: string): number {
//     const id = parseInt(xss(value), 10);
//     if (isNaN(id)) throw new Error("Invalid ID format");
//     return id;
//   }

//   private sanitize(input: string): string {
//     return xss(input);
//   }

//   private parseAssessmentPayload(body: any): {
//     title: string;
//     description: string;
//     status: string;
//   } {
//     return {
//       title: this.sanitize(body.title),
//       description: this.sanitize(body.description),
//       status: this.sanitize(body.status),
//     };
//   }
// }

import { Request, Response } from "express";
import { AssessmentService } from "../../services/Teacher/assessment.service";
import { ErrorHandledController } from "../error.handled.controller";
import xss from "xss";

export class AssessmentController extends ErrorHandledController {
  constructor(private readonly assessmentService: AssessmentService) {
    super();
  }

  public async count(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.assessmentService.countAssessments();
      res.status(200).json(result);
    } catch (error) {
      this.handleError("AssessmentController.count", error, res);
    }
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      const assessments = await this.assessmentService.getAssessments(
        page,
        limit
      );
      res.status(200).json(assessments);
    } catch (error) {
      this.handleError("AssessmentController.getAll", error, res);
    }
  }



public async getAssessmentFullById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await this.assessmentService.getAssessmentFullById(id);

    if (!data) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    res.status(200).json(data);
  } catch (error) {
    this.handleError("AssessmentController.getAssessmentFullById", error, res);
  }
}



public async getById(req: Request, res: Response): Promise<void> {
  try {
    const assessment_id = this.parseId(req.params.assessment_id);

    const assessment = await this.assessmentService.getAssessmentById(assessment_id);

    if (assessment) {
      res.status(200).json(assessment);
    } else {
      res.status(404).json({ message: "ไม่พบแบบประเมิน!" });
    }
  } catch (error) {
    this.handleError("AssessmentController.getById", error, res);
  }
}


  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data = this.parseAssessmentPayload(req.body);
      const created = await this.assessmentService.addAssessment(
        data.assessment_name,
        data.description,
        data.status,
        data.assessment_status,
      
        data.create_date,
        data.last_update
      );

      if (created) {
        res.status(201).json({
          message: "สร้างแบบประเมินสำเร็จ!",
          assessment: created,
        });
      } else {
        res.status(409).json({ message: "มีแบบประเมินนี้อยู่ในระบบแล้ว!" });
      }
    } catch (error) {
      this.handleError("AssessmentController.create", error, res);
    }
  }

  public async createAssessmentFull(req: Request, res: Response): Promise<void> {
  try {
    const result = await this.assessmentService.createAssessmentFull(req.body);
    res.status(201).json(result);
  } catch (error) {
    this.handleError("AssessmentController.createAssessmentFull", error, res);
  }
}


  public async update(req: Request, res: Response): Promise<void> {
    try {
      const assessment_id = this.parseId(req.params.assessment_id);
      const data = this.parseAssessmentPayload(req.body);

      const updated = await this.assessmentService.updateAssessment(
        assessment_id,
        data.assessment_name,
        data.description,
        data.status,
        data.assessment_status,
     
        data.last_update
      );

      if (updated) {
        res.status(200).json({
          message: "แก้ไขแบบประเมินสำเร็จ!",
          updated,
        });
      } else {
        res.status(409).json({
          message: "แบบประเมินนี้มีอยู่แล้ว หรือไม่พบที่ต้องการแก้ไข!",
        });
      }
    } catch (error) {
      this.handleError("AssessmentController.update", error, res);
    }
  }

  // public async delete(req: Request, res: Response): Promise<void> {
  //   try {
  //     const assessment_id = this.parseId(req.params.assessment_id);
  //     const deleted = await this.assessmentService.deleteAssessment(
  //       assessment_id
  //     );

  //     if (deleted) {
  //       res.status(200).json({ message: "ลบแบบประเมินสำเร็จ!" });
  //     } else {
  //       res.status(404).json({ message: "ไม่พบแบบประเมินที่ต้องการลบ!" });
  //     }
  //   } catch (error) {
  //     this.handleError("AssessmentController.delete", error, res);
  //   }
  // }


  public async delete(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10); // ✅ อ่านจาก params.id
    const deleted = await this.assessmentService.deleteAssessment(id);

    if (deleted) {
      res.status(200).json({ message: "ลบแบบประเมินสำเร็จ!" });
    } else {
      res.status(404).json({ message: "ไม่พบแบบประเมินที่ต้องการลบ!" });
    }
  } catch (error) {
    this.handleError("AssessmentController.delete", error, res);
  }
}

  // 🔧 Utils
  private parseId(value: string): number {
    const id = parseInt(xss(value), 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }

  private sanitize(input: string): string {
    return xss(input);
  }

  private parseAssessmentPayload(body: any): {
    assessment_name: string;
    description: string;
    status: "Active" | "Inactive";
    assessment_status: "Not finished" | "Finished" | "Unsuccessful";

    create_date: Date;
    last_update: Date;
  } {
    return {
      assessment_name: this.sanitize(body.assessment_name),
      description: this.sanitize(body.description),
      status: this.sanitize(body.status) as "Active" | "Inactive",
      assessment_status: this.sanitize(body.assessment_status) as
        | "Not finished"
        | "Finished"
        | "Unsuccessful",
   
      create_date: body.create_date ? new Date(body.create_date) : new Date(),
      last_update: body.last_update ? new Date(body.last_update) : new Date(),
    };
  }
}


