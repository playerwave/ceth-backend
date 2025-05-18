import { RolesDao } from "../daos/Admin/roles.dao";
import { Roles } from "../interfaces/Roles";

export class RolesService {
  private rolesDao = new RolesDao();

  async getAllRoles(): Promise<Roles[]> {
    return this.rolesDao.getAllRoles();
  }

  async getRoleById(id: number): Promise<Roles | null> {
    return this.rolesDao.getRoleById(id);
  }
}
