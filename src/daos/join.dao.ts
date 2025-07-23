import { DataSource } from "typeorm";
import { Join } from "../entity/join.entity";
import { connectDatabase } from "../db/database";
import { ErrorHandledDao } from "./error.handled.dao";

export class JoinDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ JoinDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource) {
      throw new Error("❌ Database connection is not established");
    }
  }

  // ✅ ค้นหา Join ตาม studentId และ activityId
  public async findJoinByStudentAndActivity(
    studentId: number,
    activityId: number
  ): Promise<Join | null> {
    this.checkConnection();

    try {
      const result = await this.dataSource!.getRepository(Join).findOne({
        where: {
          students_id: studentId,
          activity_detail_id: activityId,
        },
      });
      return result;
    } catch (error) {
      this.logDbError("findJoinByStudentAndActivity", error);
      throw error;
    }
  }

  // ✅ สร้างการเข้าร่วมใหม่
  public async createJoin(
    studentId: number,
    activityId: number,
    foodChoices: string[]
  ): Promise<Join> {
    this.checkConnection();

    try {
      const joinRepo = this.dataSource!.getRepository(Join);

      const newJoin = joinRepo.create({
        students_id: studentId,
        teacher_id: 1, // 🔧 คุณอาจต้องรับ teacher_id ด้วยใน args
        activity_detail_id: activityId,
        join_date: new Date(),
        status: "Pending",
      });

      const saved = await joinRepo.save(newJoin);
      // ✅ ถ้าคุณต้องการบันทึก foodChoices ด้วย ต้องมี relation table สำหรับอาหาร

      return saved;
    } catch (error) {
      this.logDbError("createJoin", error);
      throw error;
    }
  }

  // ✅ ลบการเข้าร่วม
  public async deleteJoin(join_id: number): Promise<void> {
    this.checkConnection();

    try {
      const repo = this.dataSource!.getRepository(Join);
      await repo.delete({ join_id });
    } catch (error) {
      this.logDbError("deleteJoin", error);
      throw error;
    }
  }
}
