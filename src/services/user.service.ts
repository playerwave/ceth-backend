import { UsersDao } from "../daos/users.dao";
import { StudentsDao } from "../daos/Student/student.dao";
import { TeacherDao } from "../daos/Teacher/teacher.dao";

import { Users } from "../entity/users.entity";

import redis from "../config/redis";
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy } from "passport-local";

export class UsersService {
  private usersDao = new UsersDao();
  private studentsDao = new StudentsDao();
  private teacherDao = new TeacherDao();

  async countUsers(): Promise<number> {
    return this.usersDao.countUsers();
  }

  async getUsers(page: number, limit: number): Promise<Users[]> {
    const cacheKey = `users:page:${page}:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const users = await this.usersDao.getUsers(page, limit);
    await redis.set(cacheKey, JSON.stringify(users), "EX", 60);
    return users;
  }

  async rolesAdmin(): Promise<Users[]> {
    const cacheKey = "users:roles:admin";
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await this.usersDao.rolesAdmin();
    await redis.set(cacheKey, JSON.stringify(result), "EX", 60);
    return result;
  }

  async register(username: string, password: string, roles_id?: number): Promise<Users | null> {
    const exists = await this.usersDao.getUsersByUsername(username);
    if (exists.length > 0) return null;

    const hash = await bcrypt.hash(password, 10);
    
    // ใช้ roles_id ที่ส่งมา หรือ default เป็น Student (roles_id = 2)
    const roleId = roles_id || 2;
    const createdUser = await this.usersDao.addUsers(username, hash, roleId);

    // สร้าง profile ตาม role
    if (roleId === 2) { // Student
      await this.studentsDao.add(createdUser.users_id);
    } else if (roleId === 1) { // Teacher
      await this.teacherDao.addUserIDTeacher(createdUser.users_id);
    }

    await redis.del("users:all");
    return createdUser;
  }

  async addUsers(
    username: string,
    password: string,
    roles_id: number
  ): Promise<Users | null> {
    const exists = await this.usersDao.getUsersByUsername(username);
    if (exists.length > 0) return null;

    const hash = await bcrypt.hash(password, 10);
    const createdUser = await this.usersDao.addUsers(username, hash, roles_id);

    if (roles_id === 3) {
      await this.studentsDao.add(createdUser.users_id);
    } else if (roles_id === 2) {
      await this.teacherDao.addUserIDTeacher(createdUser.users_id);
    }

    await redis.del("users:all");
    return createdUser;
  }

  async getUsersById(users_id: number): Promise<Users[] | null> {
    const result = await this.usersDao.getUsersById(users_id);
    return result.length > 0 ? result : null;
  }

  async updatedUsers(
    users_id: number,
    username: string,
    roles_id: number
  ): Promise<Users | null> {
    const current = await this.usersDao.getUsersById(users_id);
    if (current.length === 0) return null;

    const currentUsername = current[0].username;
    if (currentUsername === username) {
      await this.usersDao.updatedRoles(users_id, roles_id);
    } else {
      await this.usersDao.updatedUsers(users_id, username, roles_id);
    }

    await redis.del("users:all");
    return await this.usersDao.getUsersById(users_id).then((u) => u[0] || null);
  }

  async updatedUsersWithPassword(
    users_id: number,
    username: string,
    password: string,
    roles_id: number
  ): Promise<Users | null> {
    const current = await this.usersDao.getUsersById(users_id);
    if (current.length === 0) return null;

    // Hash password ทุกครั้ง
    const hash = await bcrypt.hash(password, 10);
    
    const currentUsername = current[0].username;
    if (currentUsername === username) {
      // ถ้า username ไม่เปลี่ยน ให้ update เฉพาะ password และ roles_id
      await this.usersDao.updatedPasswordAndRoles(users_id, hash, roles_id);
    } else {
      // ถ้า username เปลี่ยน ให้ update ทั้งหมด
      await this.usersDao.updatedUsersWithPassword(users_id, username, hash, roles_id);
    }

    await redis.del("users:all");
    return await this.usersDao.getUsersById(users_id).then((u) => u[0] || null);
  }

  async updatedPasswordByUsers(
    users_id: number,
    password: string,
    confirmPassword: string
  ): Promise<boolean> {
    if (password !== confirmPassword) return false;

    const exists = await this.usersDao.getUsersById(users_id);
    if (exists.length === 0) return false;

    const hash = await bcrypt.hash(password, 10);
    await this.usersDao.updatedPasswordByUsers(users_id, hash);
    await redis.del("users:all");
    return true;
  }

  async deletedUsers(users_id: number): Promise<boolean> {
    const roles = await this.usersDao.getRolesIdByUsersId(users_id);
    if (!roles || roles.length === 0) return false;

    const roleId = Number(roles[0].roles_id);

    if (roleId === 3) {
      await this.studentsDao.deletedStudentsByUsersID(users_id);
    } else if (roleId === 2) {
      await this.teacherDao.deletedTeacherByUsersID(users_id);
    }

    await this.usersDao.deleteUsers(users_id);
    await redis.del("users:all");
    return true;
  }

  initializePassport() {
    passport.use(
      "local",
      new Strategy(async (username, password, done) => {
        try {
          const users = await this.usersDao.getUsersByUsername(username);
          if (users.length === 0) return done(null, false);

          const user = users[0];
          const match = await bcrypt.compare(password, user.password ?? "");
          return done(null, match ? user : false);
        } catch (error) {
          return done(error);
        }
      })
    );

    passport.serializeUser((user: Users, cb) => cb(null, user.users_id));

    passport.deserializeUser(async (id: number, cb) => {
      try {
        const users = await this.usersDao.getUsersById(id);
        cb(null, users[0] || null);
      } catch (err) {
        cb(err);
      }
    });
  }
}
