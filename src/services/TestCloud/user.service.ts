import { UserDao } from "../../daos/TestCloud/user.dao";
import { Users } from "../../entity/Users";
export class UserService {
  private userDao = new UserDao();

  async getUsers(): Promise<Users[]> {
    return await this.userDao.getUsers();
  }

  // async registerUsers(email: string, password: string): Promise<Users> {
  //   return await this.userDao.registerUsers(email, password);
  // }
}
