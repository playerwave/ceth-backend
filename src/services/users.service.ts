import { rejects } from "assert";
import { UsersDao } from "../daos/users.dao";
import { Users } from "../entity/Users";
import bcrypt from 'bcrypt'
import { Strategy } from "passport-local";
import passport from "passport";
import redis from "../config/redis";

export class UsersService {
  private usersDao = new UsersDao();

  async getUsers(): Promise<Users[]> {
    const cacheKey = "users:all";

    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log("Returning cached users data");
      return JSON.parse(cachedData);
    }

    const usersData = await this.usersDao.getUsers();
    await redis.set(cacheKey, JSON.stringify(usersData), "EX", 60);

    return usersData;
  }

  async rolesAdmin(): Promise<Users[]> {
    const cacheKey = "roles:admin";

    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log("Returning cached rolesAdmin data");
      return JSON.parse(cachedData);
    }

    const rolesAdminData = await this.usersDao.rolesAdmin();
    await redis.set(cacheKey, JSON.stringify(rolesAdminData), "EX", 60);

    return rolesAdminData;
  }


  async register(username: string, password: string): Promise<boolean> {
    try {
      const findUsername = await this.usersDao.getUsersname(username);
      if (findUsername.length > 0) {
        console.log('มีชื่อผู้ใช้นี้แล้ว');
        return false;
      } else {
        const saltRounds = 10;
        const hash = await new Promise<string>((resolve, rejects) => {
          bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
              rejects(new Error(`Error from Register hash password: ${err}`))
            } else {
              resolve(hash)
            }
          })
        })
        await this.usersDao.addUsers(username, hash)
        await redis.del("users:all");
        return true;
      }

    } catch (error) {
      throw new Error(`Error form Users Service Function -> register : ${error}`);
    }
  }

  initializePassport() {
    passport.use('local', new Strategy(async (username, password, cb) => {
      try {
        const findUsername = await this.usersDao.getUsersname(username);
        if (findUsername.length > 0) {
          const user = findUsername[0];
          const storePassword = user.password;
          if (!storePassword) {
            return cb("Not found Password");
          }
          bcrypt.compare(password, storePassword, (err, result) => {
            if (err) {
              return cb(err);
            } else {
              if (result) {
                return cb(null, user);
              } else {
                return cb(null, false);
              }
            }
          })
        } else {
          return cb("ไม่มีใช้ชื่อผู้ใช้นี้")
        }
      } catch (error) {
        return cb(`Error from passport local login : ${error}`)
      }
    }))

    passport.serializeUser((user: Users | any, cb) => {
      cb(null, user.users_id);
    });

    passport.deserializeUser(async (users_id: number, cb) => {
      try {
        const userData = await this.usersDao.getUserByID(users_id);
        if (userData && userData.length > 0) {
          cb(null, userData[0]);
        } else {
          cb("User not found");
        }
      } catch (err) {
        cb(err);
      }
    });


  }
}
