import { Cache } from "./cache.ts";
import { hash } from "./crypto.ts";
import { IUser } from "./user.ts";

export interface ISession {
  email: string;
  token: string;
  validUntil: Date;
}

export class Session implements ISession {
  public email: string;
  public token: string;
  public validUntil: Date;

  private constructor(email: string, token: string, validUntil: Date) {
    this.email = email;
    this.token = token;
    this.validUntil = validUntil;
  }
  
  public static async create(user: IUser): Promise<Session> {
    const session = new Session(user.email, await hash(crypto.randomUUID()), new Date(new Date().getTime() + 60 * 60 * 1000));
    Cache.sessions.push(session);
    Cache.save();
    return session;
  }

  public static findByToken(token: string): Session | undefined {
    return Cache.sessions.find(session => session.token === token);
  }

  public static cleanup() {
    Cache.sessions = Cache.sessions.filter(session => new Date(session.validUntil).getTime() > new Date().getTime());
    Cache.save();
  }

  public static destroy(session: ISession) {
    Cache.sessions.splice(Cache.sessions.indexOf(session));
    Cache.save()
  }
}