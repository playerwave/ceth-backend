import { Request, Response } from "express";
import { ErrorHandledController } from "../error.handled.controller";
import { AssessmentVersionService } from "../../services/Assessment/assessment-version.service";
import { AssessmentPublishService } from "../../services/Assessment/assessment-publish.service";

export class AssessmentVersionController extends ErrorHandledController {
  private readonly assessmentVersionService = new AssessmentVersionService();
  private readonly assessmentPublishService = new AssessmentPublishService();

  /**
   * สร้างเวอร์ชันใหม่
   */
  public async createVersion(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      
      if (!assessmentId || isNaN(Number(assessmentId))) {
        res.status(400).json({ message: "Invalid assessment ID" });
        return;
      }

      const newVersion = await this.assessmentVersionService.createNewVersion(Number(assessmentId));
      
      res.status(201).json({
        message: "Assessment version created successfully",
        version: newVersion
      });
    } catch (error) {
      this.handleError("AssessmentVersionController.createVersion", error, res);
    }
  }

  /**
   * Publish เวอร์ชัน
   */
  public async publishVersion(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId, versionId } = req.params;
      
      if (!assessmentId || isNaN(Number(assessmentId))) {
        res.status(400).json({ message: "Invalid assessment ID" });
        return;
      }

      if (!versionId || isNaN(Number(versionId))) {
        res.status(400).json({ message: "Invalid version ID" });
        return;
      }

      await this.assessmentVersionService.publishVersion(Number(versionId));
      
      res.status(200).json({
        message: "Assessment version published successfully"
      });
    } catch (error) {
      this.handleError("AssessmentVersionController.publishVersion", error, res);
    }
  }

  /**
   * ดึงประวัติเวอร์ชัน
   */
  public async getVersionHistory(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      
      if (!assessmentId || isNaN(Number(assessmentId))) {
        res.status(400).json({ message: "Invalid assessment ID" });
        return;
      }

      const versions = await this.assessmentVersionService.getVersionHistory(Number(assessmentId));
      
      res.status(200).json({
        message: "Assessment versions retrieved successfully",
        versions
      });
    } catch (error) {
      this.handleError("AssessmentVersionController.getVersionHistory", error, res);
    }
  }

  /**
   * ดึงเวอร์ชันตาม ID
   */
  public async getVersionById(req: Request, res: Response): Promise<void> {
    try {
      const { versionId } = req.params;
      
      if (!versionId || isNaN(Number(versionId))) {
        res.status(400).json({ message: "Invalid version ID" });
        return;
      }

      const version = await this.assessmentVersionService.getVersionWithFullData(Number(versionId));
      
      if (!version) {
        res.status(404).json({ message: "Assessment version not found" });
        return;
      }
      
      res.status(200).json({
        message: "Assessment version retrieved successfully",
        version
      });
    } catch (error) {
      this.handleError("AssessmentVersionController.getVersionById", error, res);
    }
  }

  /**
   * Clone เวอร์ชัน
   */
  public async cloneVersion(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId, versionId } = req.params;
      
      if (!assessmentId || isNaN(Number(assessmentId))) {
        res.status(400).json({ message: "Invalid assessment ID" });
        return;
      }

      if (!versionId || isNaN(Number(versionId))) {
        res.status(400).json({ message: "Invalid version ID" });
        return;
      }

      const clonedVersion = await this.assessmentVersionService.cloneVersion(
        Number(versionId), 
        Number(assessmentId)
      );
      
      res.status(201).json({
        message: "Assessment version cloned successfully",
        version: clonedVersion
      });
    } catch (error) {
      this.handleError("AssessmentVersionController.cloneVersion", error, res);
    }
  }
}
