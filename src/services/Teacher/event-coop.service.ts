import { EventCoopDao } from "../../daos/Teacher/event-coop.dao";
import { EventCoop } from "../../entity/eventcoop.entity";
import { ErrorHandledService } from "../error.handdled.service";

export class EventCoopService extends ErrorHandledService {
  private readonly eventCoopDao = new EventCoopDao();

  /**
   * ดึงข้อมูล Event Coop ตาม Department
   */
  public async getEventCoopByDepartment(departmentId: number): Promise<EventCoop[]> {
    try {
      this.logInfo("🔍 Getting event coop by department", { departmentId });
      
      if (!departmentId || departmentId <= 0) {
        throw new Error("Invalid department ID");
      }

      const eventCoops = await this.eventCoopDao.getEventCoopByDepartment(departmentId);
      
      this.logInfo("📊 Retrieved event coops by department", {
        departmentId,
        count: eventCoops.length
      });

      return eventCoops;
    } catch (error) {
      this.logError("❌ Error in getEventCoopByDepartment", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูล Event Coop ตาม ID
   */
  public async getEventCoopById(eventCoopId: number): Promise<EventCoop | null> {
    try {
      this.logInfo("🔍 Getting event coop by ID", { eventCoopId });
      
      if (!eventCoopId || eventCoopId <= 0) {
        throw new Error("Invalid event coop ID");
      }

      const eventCoop = await this.eventCoopDao.getEventCoopById(eventCoopId);
      
      if (eventCoop) {
        this.logInfo("📊 Retrieved event coop by ID", { eventCoopId });
      } else {
        this.logInfo("⚠️ Event coop not found", { eventCoopId });
      }

      return eventCoop;
    } catch (error) {
      this.logError("❌ Error in getEventCoopById", error);
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูล Event Coop (Partial Update - PATCH)
   */
  public async updateEventCoop(eventCoopId: number, data: Partial<EventCoop>): Promise<EventCoop | null> {
    try {
      this.logInfo("🔧 Updating event coop", { eventCoopId, data });
      
      if (!eventCoopId || eventCoopId <= 0) {
        throw new Error("Invalid event coop ID");
      }

      // ตรวจสอบข้อมูลที่ต้องการอัปเดต
      if (Object.keys(data).length === 0) {
        throw new Error("No data provided for update");
      }

      // ตรวจสอบ department_id ถ้ามี
      if (data.department_id !== undefined && data.department_id <= 0) {
        throw new Error("Invalid department ID");
      }

      // ตรวจสอบ grade_id ถ้ามี
      if (data.grade_id !== undefined && data.grade_id <= 0) {
        throw new Error("Invalid grade ID");
      }

      // ตรวจสอบ date ถ้ามี
      if (data.date !== undefined) {
        if (data.date instanceof Date) {
          // ตรวจสอบว่าเป็นวันที่ที่ถูกต้อง
          if (isNaN(data.date.getTime())) {
            throw new Error("Invalid date format");
          }
        } else if (typeof data.date === 'string') {
          const parsedDate = new Date(data.date);
          if (isNaN(parsedDate.getTime())) {
            throw new Error("Invalid date format");
          }
        }
      }

      // คำนวณ remaining_days ใหม่ถ้ามีการเปลี่ยน date
      let finalData = { ...data };
      if (data.date !== undefined) {
        const today = new Date();
        const eventDate = new Date(data.date);
        const diffTime = eventDate.getTime() - today.getTime();
        const calculatedRemainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        this.logInfo("📅 Recalculating remaining days due to date change", {
          today: today.toISOString(),
          eventDate: eventDate.toISOString(),
          calculatedRemainingDays: calculatedRemainingDays
        });
        
        finalData.remaining_days = calculatedRemainingDays;
      }

      // ตรวจสอบ remaining_days ถ้ามีการส่งมาโดยตรง
      if (data.remaining_days !== undefined && data.remaining_days < 0) {
        throw new Error("Remaining days cannot be negative");
      }

      const updatedEventCoop = await this.eventCoopDao.updateEventCoop(eventCoopId, finalData);
      
      if (updatedEventCoop) {
        this.logInfo("✅ Event coop updated successfully", { eventCoopId });
      } else {
        this.logInfo("⚠️ Event coop not found for update", { eventCoopId });
      }

      return updatedEventCoop;
    } catch (error) {
      this.logError("❌ Error in updateEventCoop", error);
      throw error;
    }
  }

  /**
   * สร้าง Event Coop ใหม่
   */
  public async createEventCoop(data: Omit<EventCoop, 'eventcoop_id'>): Promise<EventCoop> {
    try {
      this.logInfo("🆕 Creating new event coop", { data });
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!data.department_id || data.department_id <= 0) {
        throw new Error("Department ID is required and must be positive");
      }

      if (!data.grade_id || data.grade_id <= 0) {
        throw new Error("Grade ID is required and must be positive");
      }

      // Date เป็น optional field
      // if (!data.date) {
      //   throw new Error("Date is required");
      // }

      // ตรวจสอบรูปแบบวันที่ (ถ้ามี)
      let validDate: Date | null = null;
      if (data.date) {
        if (data.date instanceof Date) {
          validDate = data.date;
        } else if (typeof data.date === 'string') {
          validDate = new Date(data.date);
          if (isNaN(validDate.getTime())) {
            throw new Error("Invalid date format");
          }
        } else {
          throw new Error("Date must be a Date object or valid date string");
        }
      }

      // คำนวณ remaining_days จากวันที่ปัจจุบัน (ถ้ามี date)
      let calculatedRemainingDays = null;
      if (validDate) {
        const today = new Date();
        const diffTime = validDate.getTime() - today.getTime();
        calculatedRemainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        this.logInfo("📅 Calculated remaining days", {
          today: today.toISOString(),
          eventDate: validDate.toISOString(),
          remainingDays: calculatedRemainingDays
        });
      } else {
        this.logInfo("📅 No date provided, remaining_days will be null");
      }

      // ตรวจสอบ remaining_days ถ้ามีการส่งมา
      if (data.remaining_days !== undefined && data.remaining_days < 0) {
        throw new Error("Remaining days cannot be negative");
      }

      const eventCoopData = {
        ...data,
        date: validDate,
        remaining_days: calculatedRemainingDays // ใช้ค่าที่คำนวณได้
      };

      const newEventCoop = await this.eventCoopDao.createEventCoop(eventCoopData);
      
      this.logInfo("✅ Event coop created successfully", { 
        eventCoopId: newEventCoop.eventcoop_id 
      });

      return newEventCoop;
    } catch (error) {
      this.logError("❌ Error in createEventCoop", error);
      throw error;
    }
  }

  /**
   * ลบ Event Coop
   */
  public async deleteEventCoop(eventCoopId: number): Promise<boolean> {
    try {
      this.logInfo("🗑️ Deleting event coop", { eventCoopId });
      
      if (!eventCoopId || eventCoopId <= 0) {
        throw new Error("Invalid event coop ID");
      }

      // ตรวจสอบว่า Event Coop มีอยู่หรือไม่
      const existing = await this.eventCoopDao.getEventCoopById(eventCoopId);
      if (!existing) {
        throw new Error("Event coop not found");
      }

      const deleted = await this.eventCoopDao.deleteEventCoop(eventCoopId);
      
      if (deleted) {
        this.logInfo("✅ Event coop deleted successfully", { eventCoopId });
      }

      return deleted;
    } catch (error) {
      this.logError("❌ Error in deleteEventCoop", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูล Event Coop ทั้งหมด
   */
  public async getAllEventCoops(): Promise<EventCoop[]> {
    try {
      this.logInfo("🔍 Getting all event coops");
      
      const eventCoops = await this.eventCoopDao.getAllEventCoops();
      
      this.logInfo("📊 Retrieved all event coops", { count: eventCoops.length });

      return eventCoops;
    } catch (error) {
      this.logError("❌ Error in getAllEventCoops", error);
      throw error;
    }
  }
}
