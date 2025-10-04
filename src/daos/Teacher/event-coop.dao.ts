import { DataSource } from "typeorm";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";
import { EventCoop } from "../../entity/eventcoop.entity";

export class EventCoopDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
  }

  private async initialize(): Promise<void> {
    try {
      console.log("🔄 Initializing EventCoopDao...");
      this.dataSource = await connectDatabase();
      console.log("✅ EventCoopDao initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize EventCoopDao:", error);
      this.logDbError("initialize", error);
      throw error;
    }
  }

  private async checkConnection(): Promise<void> {
    if (!this.dataSource?.isConnected) {
      console.log("🔄 Database connection not established, attempting to initialize...");
      try {
        await this.initialize();
      } catch (error) {
        throw new Error(`❌ Database connection is not established: ${error}`);
      }
    }
  }

  /**
   * ดึงข้อมูล Event Coop ตาม Department
   */
  public async getEventCoopByDepartment(departmentId: number): Promise<EventCoop[]> {
    try {
      await this.checkConnection();

      const query = `
        SELECT 
          ec.eventcoop_id,
          ec.department_id,
          ec.grade_id,
          ec.date,
          ec.remaining_days,
          ec.is_on_coop,
          d.department_name_tha,
          g.description as grade_name,
          g.th_year
        FROM event_coop ec
        LEFT JOIN department d ON ec.department_id = d.department_id
        LEFT JOIN grade g ON ec.grade_id = g.grade_id
        WHERE ec.department_id = $1
        ORDER BY ec.eventcoop_id
      `;

      const result = await this.dataSource!.query(query, [departmentId]);
      
      console.log(`📊 Found ${result.length} event coop records for department ${departmentId}`);
      return result;
    } catch (error) {
      console.error("❌ Error getting event coop by department:", error);
      this.logDbError("getEventCoopByDepartment", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูล Event Coop ตาม ID
   */
  public async getEventCoopById(eventCoopId: number): Promise<EventCoop | null> {
    try {
      await this.checkConnection();

      const query = `
        SELECT 
          ec.eventcoop_id,
          ec.department_id,
          ec.grade_id,
          ec.date,
          ec.remaining_days,
          ec.is_on_coop,
          d.department_name_tha,
          g.description as grade_name,
          g.th_year
        FROM event_coop ec
        LEFT JOIN department d ON ec.department_id = d.department_id
        LEFT JOIN grade g ON ec.grade_id = g.grade_id
        WHERE ec.eventcoop_id = $1
      `;

      const result = await this.dataSource!.query(query, [eventCoopId]);
      
      if (result.length === 0) {
        console.log(`⚠️ Event coop with ID ${eventCoopId} not found`);
        return null;
      }

      console.log(`📊 Found event coop with ID ${eventCoopId}`);
      return result[0];
    } catch (error) {
      console.error("❌ Error getting event coop by ID:", error);
      this.logDbError("getEventCoopById", error);
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูล Event Coop (Partial Update - PATCH)
   */
  public async updateEventCoop(eventCoopId: number, data: Partial<EventCoop>): Promise<EventCoop | null> {
    try {
      await this.checkConnection();

      // ตรวจสอบว่า Event Coop มีอยู่หรือไม่
      const existing = await this.getEventCoopById(eventCoopId);
      if (!existing) {
        console.log(`⚠️ Event coop with ID ${eventCoopId} not found for update`);
        return null;
      }

      // สร้าง SET clause สำหรับ UPDATE
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.department_id !== undefined) {
        updateFields.push(`department_id = $${paramIndex}`);
        values.push(data.department_id);
        paramIndex++;
      }

      if (data.grade_id !== undefined) {
        updateFields.push(`grade_id = $${paramIndex}`);
        values.push(data.grade_id);
        paramIndex++;
      }

      if (data.date !== undefined) {
        updateFields.push(`date = $${paramIndex}`);
        values.push(data.date);
        paramIndex++;
        
        // คำนวณ remaining_days ใหม่เมื่อมีการเปลี่ยน date
        const today = new Date();
        const eventDate = new Date(data.date);
        const diffTime = eventDate.getTime() - today.getTime();
        const calculatedRemainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log(`📅 Recalculating remaining days due to date change: ${calculatedRemainingDays}`, {
          today: today.toISOString(),
          eventDate: eventDate.toISOString()
        });
        
        // อัปเดต remaining_days ด้วยค่าที่คำนวณใหม่
        updateFields.push(`remaining_days = $${paramIndex}`);
        values.push(calculatedRemainingDays);
        paramIndex++;
      } else if (data.remaining_days !== undefined) {
        // อัปเดต remaining_days เฉพาะเมื่อไม่ได้เปลี่ยน date
        updateFields.push(`remaining_days = $${paramIndex}`);
        values.push(data.remaining_days);
        paramIndex++;
      }

      if (data.is_on_coop !== undefined) {
        console.log(`🔄 [DAO] Updating is_on_coop to: ${data.is_on_coop}`);
        updateFields.push(`is_on_coop = $${paramIndex}`);
        values.push(data.is_on_coop);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        console.log("⚠️ No fields to update");
        return existing;
      }

      // เพิ่ม eventcoop_id เป็น parameter สุดท้าย
      values.push(eventCoopId);

      const query = `
        UPDATE event_coop 
        SET ${updateFields.join(", ")}
        WHERE eventcoop_id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.dataSource!.query(query, values);
      
      if (result.length === 0) {
        console.log(`❌ Failed to update event coop with ID ${eventCoopId}`);
        return null;
      }

      console.log(`✅ Successfully updated event coop with ID ${eventCoopId}`);
      return result[0];
    } catch (error) {
      console.error("❌ Error updating event coop:", error);
      this.logDbError("updateEventCoop", error);
      throw error;
    }
  }

  /**
   * สร้าง Event Coop ใหม่
   */
  public async createEventCoop(data: Omit<EventCoop, 'eventcoop_id'>): Promise<EventCoop> {
    try {
      await this.checkConnection();

      // คำนวณ remaining_days จากวันที่ปัจจุบัน (ถ้ามี date)
      let calculatedRemainingDays = data.remaining_days;
      if (data.date) {
        const today = new Date();
        const eventDate = new Date(data.date);
        const diffTime = eventDate.getTime() - today.getTime();
        calculatedRemainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log(`📅 Calculated remaining days: ${calculatedRemainingDays} (from ${today.toISOString()} to ${eventDate.toISOString()})`);
      } else {
        console.log(`📅 No date provided, remaining_days will be null`);
        calculatedRemainingDays = null;
      }

      const query = `
        INSERT INTO event_coop (department_id, grade_id, date, remaining_days)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const values = [
        data.department_id,
        data.grade_id,
        data.date,
        calculatedRemainingDays
      ];

      const result = await this.dataSource!.query(query, values);
      
      console.log(`✅ Successfully created event coop with ID ${result[0].eventcoop_id}`);
      return result[0];
    } catch (error) {
      console.error("❌ Error creating event coop:", error);
      this.logDbError("createEventCoop", error);
      throw error;
    }
  }

  /**
   * ลบ Event Coop
   */
  public async deleteEventCoop(eventCoopId: number): Promise<boolean> {
    try {
      await this.checkConnection();

      const query = `
        DELETE FROM event_coop 
        WHERE eventcoop_id = $1
      `;

      const result = await this.dataSource!.query(query, [eventCoopId]);
      
      console.log(`✅ Successfully deleted event coop with ID ${eventCoopId}`);
      return true;
    } catch (error) {
      console.error("❌ Error deleting event coop:", error);
      this.logDbError("deleteEventCoop", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูล Event Coop ทั้งหมด
   */
  public async getAllEventCoops(): Promise<EventCoop[]> {
    try {
      await this.checkConnection();

      const query = `
        SELECT 
          ec.eventcoop_id,
          ec.department_id,
          ec.grade_id,
          ec.date,
          ec.remaining_days,
          ec.is_on_coop,
          d.department_name_tha,
          g.description as grade_name,
          g.th_year
        FROM event_coop ec
        LEFT JOIN department d ON ec.department_id = d.department_id
        LEFT JOIN grade g ON ec.grade_id = g.grade_id
        ORDER BY ec.eventcoop_id
      `;

      const result = await this.dataSource!.query(query);
      
      console.log(`📊 Found ${result.length} event coop records`);
      return result;
    } catch (error) {
      console.error("❌ Error getting all event coops:", error);
      this.logDbError("getAllEventCoops", error);
      throw error;
    }
  }
}
