import { BuildingDao } from "../daos/Admin/building.dao";
import { Building } from "../interfaces/Building";

export class BuildingService {
  private buildingDao = new BuildingDao();

  async getAllBuildings(): Promise<Building[]> {
    return this.buildingDao.getAllBuildings();
  }

  async getBuildingById(id: number): Promise<Building | null> {
    return this.buildingDao.getBuildingById(id);
  }
}
