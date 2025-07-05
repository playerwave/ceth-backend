// src/daos/eventcoop.dao.ts

import { DataSource } from "typeorm";
import { EventCoop } from "../../entity/eventcoop.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class EventCoopDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ EventCoopDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource) {
      throw new Error("❌ Database connection is not established");
    }
  }

  public async countEventCoop(): Promise<number> {
    this.checkConnection();

    try {
      const result = await this.dataSource!.query(
        `SELECT COUNT(*) FROM event_coop`
      );
      return parseInt(result[0].count, 10);
    } catch (error) {
      this.logDbError("countEventCoop", error);
      throw new Error(`❌ Failed to count EventCoop`);
    }
  }

  public async getEventCoop(): Promise<EventCoop[]> {
    this.checkConnection();

    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM event_coop ORDER BY eventcoop_id DESC`
      );
      return result as EventCoop[];
    } catch (error) {
      this.logDbError("getEventCoop", error);
      throw new Error(`❌ Failed to get EventCoop list`);
    }
  }
}
