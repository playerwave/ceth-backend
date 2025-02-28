// import { UserDao } from "../../daos/Test/user.dao";
// import { User } from "../../entity/User";

// export class UserService {
//   private userDao = new UserDao();

//   async createUser(
//     firstName: string,
//     lastName: string,
//     age: number
//   ): Promise<User> {
//     return await this.userDao.createUser(firstName, lastName, age);
//   }

//   async getAllUsers(): Promise<User[]> {
//     return await this.userDao.getAllUsers();
//   }

//   async getUserById(id: number): Promise<User | null | undefined> {
//     return await this.userDao.getUserById(id);
//   }

//   async updateUser(
//     id: number,
//     firstName: string,
//     lastName: string,
//     age: number
//   ): Promise<User | null | undefined> {
//     return await this.userDao.updateUser(id, firstName, lastName, age);
//   }

//   patchUser = async (
//     id: number,
//     userData: Partial<User>
//   ): Promise<User | null> => {
//     return await this.userDao.patchUser(id, userData);
//   };

//   async deleteUser(id: number): Promise<void> {
//     await this.userDao.deleteUser(id);
//   }
// }
