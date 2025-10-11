import { Request, Response } from "express";
import { UltraOptimizedUserManagementService } from "../../services/Teacher/ultra-optimized-user-management.service";
import { ErrorHandledController } from "../error.handled.controller";

export class UltraOptimizedUserManagementController extends ErrorHandledController {
  constructor(private readonly ultraOptimizedUserManagementService: UltraOptimizedUserManagementService) {
    super();
  }

  // ================= Ultra Optimized Upload Students =================
  public async ultraOptimizedUploadStudents(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      if (!req.file) {
        res.status(400).json({ 
          success: false,
          error: "File is required" 
        });
        return;
      }

      console.log(`🚀 Starting ultra-optimized upload for file: ${req.file.originalname}`);
      
      const result = await this.ultraOptimizedUserManagementService.ultraOptimizedUploadStudents(req.file);
      
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      
      res.json({
        success: true,
        message: result.message,
        count: result.count,
        totalRecords: result.totalRecords,
        newRecords: result.newRecords,
        duplicateRecords: result.duplicateRecords,
        processingTimeSeconds: totalTime,
        errors: result.errors,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      
      console.error(`❌ Ultra-optimized upload failed after ${totalTime.toFixed(2)} seconds:`, error);
      this.handleError("UltraOptimizedUserManagementController.ultraOptimizedUploadStudents", error, res);
    }
  }

  // ================= Get Performance Metrics =================
  public async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      // This could be expanded to include database performance metrics
      const metrics = {
        algorithm: "O(n) with O(1) database queries",
        optimization: "Ultra-optimized batch processing",
        features: [
          "Single query per batch insert",
          "In-memory processing",
          "Preloaded reference data",
          "Batch user creation",
          "PostgreSQL VALUES clause optimization"
        ],
        expectedPerformance: {
          "100_students": "< 5 seconds",
          "500_students": "< 15 seconds", 
          "1000_students": "< 30 seconds",
          "5000_students": "< 2 minutes"
        }
      };
      
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.handleError("UltraOptimizedUserManagementController.getPerformanceMetrics", error, res);
    }
  }

  // ================= ULTRA-FAST RESET STUDENTS (FASTEST METHOD) =================
  public async ultraFastResetStudents(req: Request, res: Response): Promise<void> {
    try {
      console.log("⚡ ULTRA-FAST reset students request received");
      
      const result = await this.ultraOptimizedUserManagementService.ultraFastResetStudents();
      
      res.status(200).json({
        success: true,
        message: result.message,
        deletedCount: result.deletedCount,
        processingTimeSeconds: result.processingTimeSeconds,
        totalQueries: result.totalQueries,
        algorithm: "ULTRA-FAST O(1)",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError("UltraOptimizedUserManagementController.ultraFastResetStudents", error, res);
    }
  }

  // ================= Get Reset Performance Metrics =================
  public async getResetPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      console.log("📊 Reset performance metrics request received");
      
      const result = await this.ultraOptimizedUserManagementService.getResetPerformanceMetrics();
      
      res.status(200).json(result);
    } catch (error) {
      this.handleError("UltraOptimizedUserManagementController.getResetPerformanceMetrics", error, res);
    }
  }
}

// ✅ Create service and controller instances
const ultraOptimizedUserManagementService = new UltraOptimizedUserManagementService();
const ultraOptimizedController = new UltraOptimizedUserManagementController(ultraOptimizedUserManagementService);

// ✅ Export pattern
export const ultraOptimizedUserManagementController = {
  ultraOptimizedUploadStudents: ultraOptimizedController.ultraOptimizedUploadStudents.bind(ultraOptimizedController),
  getPerformanceMetrics: ultraOptimizedController.getPerformanceMetrics.bind(ultraOptimizedController),
  ultraFastResetStudents: ultraOptimizedController.ultraFastResetStudents.bind(ultraOptimizedController),
  getResetPerformanceMetrics: ultraOptimizedController.getResetPerformanceMetrics.bind(ultraOptimizedController),
};
