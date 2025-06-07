import { ActivityService } from "../activity.service.newstructure";
import { Activity } from "../../../entity/activity.entity";

const mockDao = { createActivityDao: jest.fn() };
const mockNotifier = { notify: jest.fn() };

describe("ActivityService - event_format กับ floor", () => {
  let service: ActivityService;

  beforeEach(() => {
    service = new ActivityService(
      mockDao as any,
      undefined,
      mockNotifier as any
    );
    jest.clearAllMocks();
  });

  it("ควร throw error ถ้า event_format เป็น Onsite แต่ไม่ได้ระบุ floor", async () => {
    const data: Partial<Activity> = {
      activity_name: "Test",
      event_format: "Onsite",
      room_id: undefined,
      activity_status: "Private",
    };

    await expect(service.createActivityService(data)).rejects.toThrow(
      /Onsite ต้องเลือกชั้น/i
    );
  });

  it("ควร throw error ถ้า event_format ไม่ใช่ Onsite แต่ระบุ floor มา", async () => {
    const data: Partial<Activity> = {
      activity_name: "Test",
      event_format: "Online",
      room_id: 3,
      activity_status: "Private",
    };

    await expect(service.createActivityService(data)).rejects.toThrow(
      /ไม่ใช่ Onsite ห้ามเลือกชั้น/i
    );
  });

  it("ควรผ่านได้ถ้าเป็น Onsite และมี floor", async () => {
    const data: Partial<Activity> = {
      activity_name: "Test",
      event_format: "Onsite",
      room_id: 2,
      activity_status: "Private",
    };

    mockDao.createActivityDao.mockResolvedValue({ activity_id: 1, ...data });

    const result = await service.createActivityService(data);
    expect(result.activity_id).toBe(1);
  });

  it("ควรผ่านได้ถ้าไม่ใช่ Onsite และไม่มี floor", async () => {
    const data: Partial<Activity> = {
      activity_name: "Test",
      event_format: "Online",
      activity_status: "Private",
    };

    mockDao.createActivityDao.mockResolvedValue({ activity_id: 2, ...data });

    const result = await service.createActivityService(data);
    expect(result.activity_id).toBe(2);
  });
});
