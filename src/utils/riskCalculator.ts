/**
 * ระบบคำนวณความเสี่ยงสำหรับนิสิต
 * ใช้ข้อมูล EventCoop, ชั่วโมงที่เก็บได้, และจำนวนวันที่เหลือ
 */

export interface RiskCalculationInput {
  hardCurrent: number;      // ชั่วโมง hard skill ที่เก็บแล้ว
  softCurrent: number;      // ชั่วโมง soft skill ที่เก็บแล้ว
  daysLeft: number;         // จำนวนวันก่อนถึงวันสหกิจ
  isOnCoop: boolean;        // ต้องไปสหกิจหรือไม่
}

export interface RiskCalculationResult {
  riskPercent: number;      // เปอร์เซ็นต์ความเสี่ยง (0-100)
  riskStatus: 'Normal' | 'Risk';
  hardMissing: number;      // ชั่วโมง hard skill ที่ยังขาด
  softMissing: number;      // ชั่วโมง soft skill ที่ยังขาด
  hardPerDay: number;       // ชั่วโมง hard skill ที่ต้องเก็บต่อวัน
  softPerDay: number;       // ชั่วโมง soft skill ที่ต้องเก็บต่อวัน
  canComplete: boolean;     // สามารถเก็บชั่วโมงครบได้หรือไม่
}

export class RiskCalculator {
  private static readonly HARD_TARGET = 12;    // เป้าหมาย hard skill
  private static readonly SOFT_TARGET = 30;    // เป้าหมาย soft skill
  private static readonly MAX_HOURS_PER_DAY = 2; // ชั่วโมงสูงสุดที่เก็บได้ต่อวัน
  private static readonly RISK_THRESHOLD = 50;  // เกณฑ์ความเสี่ยง

  /**
   * คำนวณความเสี่ยงของนิสิต
   */
  public static calculateRisk(input: RiskCalculationInput): RiskCalculationResult {
    // ✅ เงื่อนไขที่ 1: ถ้า is_on_coop เป็น false ให้เป็น Normal
    if (!input.isOnCoop) {
      return {
        riskPercent: 0,
        riskStatus: 'Normal',
        hardMissing: 0,
        softMissing: 0,
        hardPerDay: 0,
        softPerDay: 0,
        canComplete: true
      };
    }

    // ✅ เงื่อนไขที่ 2: เช็คว่าเก็บครบแล้วหรือไม่
    const hardMissing = Math.max(0, this.HARD_TARGET - input.hardCurrent);
    const softMissing = Math.max(0, this.SOFT_TARGET - input.softCurrent);

    // ถ้าเก็บครบแล้ว (hard_hours >= 12 และ soft_hours >= 30)
    if (hardMissing === 0 && softMissing === 0) {
      return {
        riskPercent: 0,
        riskStatus: 'Normal',
        hardMissing: 0,
        softMissing: 0,
        hardPerDay: 0,
        softPerDay: 0,
        canComplete: true
      };
    }

    // ✅ เงื่อนไขที่ 3: ถ้ายังไม่ครบและ is_on_coop เป็น true
    // เช็คว่าเก็บครบอย่างใดอย่างหนึ่งหรือไม่
    const hasSoftComplete = input.softCurrent >= this.SOFT_TARGET; // soft_hours >= 30
    const hasHardComplete = input.hardCurrent >= this.HARD_TARGET; // hard_hours >= 12
    
    let baseRisk = 45; // ค่าเริ่มต้น
    
    // ✅ เงื่อนไขใหม่: ถ้าเก็บครบอย่างใดอย่างหนึ่ง ให้ baseRisk เป็น 25
    if (hasSoftComplete || hasHardComplete) {
      baseRisk = 25;
    }

    // ✅ เงื่อนไขที่ 4: คำนวณ 55% ที่เหลือจากวันที่เหลือ
    let timeBasedRisk = 0;
    
    if (input.daysLeft <= 0) {
      // ถ้าไม่มีเวลาเหลือ = เสี่ยงสูงสุด
      timeBasedRisk = 55;
    } else if (input.daysLeft <= 120) {
      // ถ้าเหลือไม่เกิน 30 วัน = เสี่ยงมาก
      timeBasedRisk = 50;
    } else if (input.daysLeft <= 180) {
      // ถ้าเหลือไม่เกิน 60 วัน = เสี่ยงปานกลาง
      timeBasedRisk = 35;
    } else if (input.daysLeft <= 240) {
      // ถ้าเหลือไม่เกิน 90 วัน = เสี่ยงน้อย
      timeBasedRisk = 20;
    } else if (input.daysLeft <= 356) {
      // ถ้าเหลือไม่เกิน 180 วัน = เสี่ยงน้อยมาก
      timeBasedRisk = 10;
    } else {
      // ถ้าเหลือมากกว่า 180 วัน = เสี่ยงน้อยที่สุด
      timeBasedRisk = 5;
    }

    // คำนวณจำนวนชั่วโมงที่ต้องเก็บต่อวัน
    const hardPerDay = hardMissing / Math.max(1, input.daysLeft);
    const softPerDay = softMissing / Math.max(1, input.daysLeft);

    // ตรวจสอบว่าสามารถเก็บครบได้หรือไม่
    const canComplete = hardPerDay <= this.MAX_HOURS_PER_DAY && softPerDay <= this.MAX_HOURS_PER_DAY;

    // รวมความเสี่ยงทั้งหมด
    const totalRisk = baseRisk + timeBasedRisk;
    const riskPercent = Math.min(100, totalRisk);

    return {
      riskPercent: Math.round(riskPercent),
      riskStatus: riskPercent <= this.RISK_THRESHOLD ? 'Normal' : 'Risk',
      hardMissing,
      softMissing,
      hardPerDay: Math.round(hardPerDay * 100) / 100,
      softPerDay: Math.round(softPerDay * 100) / 100,
      canComplete
    };
  }


  /**
   * ตัวอย่างการใช้งาน
   */
  public static getExamples(): Array<{input: RiskCalculationInput, result: RiskCalculationResult}> {
    return [
      {
        input: {
          hardCurrent: 0,
          softCurrent: 0,
          daysLeft: 100,
          isOnCoop: true
        },
        result: this.calculateRisk({
          hardCurrent: 0,
          softCurrent: 0,
          daysLeft: 100,
          isOnCoop: true
        })
      },
      {
        input: {
          hardCurrent: 6,
          softCurrent: 15,
          daysLeft: 30,
          isOnCoop: true
        },
        result: this.calculateRisk({
          hardCurrent: 6,
          softCurrent: 15,
          daysLeft: 30,
          isOnCoop: true
        })
      },
      {
        input: {
          hardCurrent: 12,
          softCurrent: 20,
          daysLeft: 60,
          isOnCoop: true
        },
        result: this.calculateRisk({
          hardCurrent: 12,
          softCurrent: 20,
          daysLeft: 60,
          isOnCoop: true
        })
      },
      {
        input: {
          hardCurrent: 8,
          softCurrent: 30,
          daysLeft: 90,
          isOnCoop: true
        },
        result: this.calculateRisk({
          hardCurrent: 8,
          softCurrent: 30,
          daysLeft: 90,
          isOnCoop: true
        })
      },
      {
        input: {
          hardCurrent: 12,
          softCurrent: 30,
          daysLeft: 5,
          isOnCoop: true
        },
        result: this.calculateRisk({
          hardCurrent: 12,
          softCurrent: 30,
          daysLeft: 5,
          isOnCoop: true
        })
      },
      {
        input: {
          hardCurrent: 2,
          softCurrent: 5,
          daysLeft: 3,
          isOnCoop: false
        },
        result: this.calculateRisk({
          hardCurrent: 2,
          softCurrent: 5,
          daysLeft: 3,
          isOnCoop: false
        })
      }
    ];
  }
}

