import { ActivityDao } from "../../../../src/daos/Teacher/activity.dao";

describe("ActivityDao - advanceStatesOnce", () => {
  let dao: ActivityDao;
  let mockDataSource: any;
  let mockQueryRunner: any;

  beforeEach(() => {
    // Mock QueryRunner
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      query: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };

    // Mock DataSource
    mockDataSource = {
      isConnected: true,
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      query: jest.fn(),
    };

    // Create DAO instance
    dao = new ActivityDao() as any;
    dao["dataSource"] = mockDataSource;
    
    // Mock initialize method to prevent real database connection
    dao["initialize"] = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup any remaining connections
    if (dao["dataSource"]) {
      await dao["dataSource"].destroy?.();
    }
    // Force Jest to exit
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe("advanceStatesOnce", () => {
    it("should handle empty results", async () => {
      // Mock empty query results
      mockQueryRunner.query.mockResolvedValue([]);

      const freezeNow = new Date("2025-08-17T10:00:00.000Z");
      const result = await (dao as any).advanceStatesOnce(freezeNow);

      expect(result).toEqual({
        notStartToSpecial: 0,
        notStartToOpen: 0,
        notStartToStartActivity: 0,
        specialToOpen: 0,
        openToClose: 0,
        closeToStart: 0,
        startToEnd: 0,
        endToStartAssess: 0,
        startAssessToEnd: 0,
        updatedIds: {
          notStartToSpecial: [],
          notStartToOpen: [],
          notStartToStartActivity: [],
          specialToOpen: [],
          openToClose: [],
          closeToStart: [],
          startToEnd: [],
          endToStartAssess: [],
          startAssessToEnd: [],
        },
      });

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      mockQueryRunner.query.mockRejectedValue(new Error("Database error"));

      const freezeNow = new Date("2025-08-17T10:00:00.000Z");

      await expect((dao as any).advanceStatesOnce(freezeNow)).rejects.toThrow("Database error");

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
      });
  });

