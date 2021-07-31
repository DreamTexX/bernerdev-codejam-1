import { Cache } from "./cache.ts";
import { hash } from "./crypto.ts";

export interface IUser {
  email: string;
  password: string;
}

export class User implements IUser {
  public email: string;
  public password: string;

  private constructor(email: string, hashedPassword: string) {
    this.email = email;
    this.password = hashedPassword;
  }

  public static async create(email: string, password: string): Promise<User> {
    let user = this.findByEmail(email);
    if (user)
      return user;
    user = new User(email, await hash(password));
    Cache.users.push(user);
    Cache.save();
    return user;
  }

  public static findByEmail(email: string): User | undefined {
    return Cache.users.find(user => user.email === email) as User | undefined;
  }
}