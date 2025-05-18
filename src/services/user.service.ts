import { UserDao } from "../daos/Admin/user.dao";
import { User } from "../interfaces/User";

export class UserService {
  private userDao = new UserDao();

  async getAllUsers(): Promise<User[]> {
    return this.userDao.getAllUsers();
  }

  async getUserById(id: number): Promise<User | null> {
    return this.userDao.getUserById(id);
  }
}
