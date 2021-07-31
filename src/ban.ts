import { Cache } from "./cache.ts";

export interface IBan {
  ip: string;
  tries: number;
  lastTried: Date;
  bannedUntil: Date;
}

export class Ban implements IBan {
  public ip: string;
  public tries: number;
  public lastTried: Date;
  public bannedUntil: Date;

  private constructor(ip: string) {
    this.ip = ip;
    this.tries = 0;
    this.lastTried = new Date(0);
    this.bannedUntil = new Date(0);
  }

  public static create(ip: string): Ban {
    const ban = new Ban(ip);
    Cache.bans.push(ban);
    Cache.save();
    return ban;
  }

  public static findByIp(ip: string): Ban | undefined {
    return Cache.bans.find(ban => ban.ip === ip);
  }

  public static findOrCreate(ip: string): Ban {
    return this.findByIp(ip) || this.create(ip);
  }

  public static fail(ip: string): Ban {
    const ban = this.findOrCreate(ip);

    // if bannedUntil is active, return
    if (new Date(ban.bannedUntil).getTime() >= new Date().getTime())
      return ban;

    if (new Date().getTime() - new Date(ban.lastTried).getTime() >= 5 * 60 * 1000)
      ban.tries = 0;
    
    ban.tries++;
    ban.lastTried = new Date();
    
    if (ban.tries >= 3) {
      ban.bannedUntil = new Date(new Date().getTime() + 12 * 60 * 60 * 1000)
      ban.tries = 0;
    }
      
    Cache.save();
    return ban;
  }

  public static reset(ip: string) {
    const ban = this.findOrCreate(ip);
    ban.tries = 0;
    ban.lastTried = new Date(0);
    ban.bannedUntil = new Date(0);
    Cache.save();
  }

  public static cleanup() {
    Cache.bans = Cache.bans.filter(ban => new Date(ban.bannedUntil).getTime() >= new Date().getTime() || new Date().getTime() - new Date(ban.lastTried).getTime() < 5 * 60 * 1000)
    Cache.save();
  }

  public static isBanned(ip: string): boolean {
    const ban = this.findByIp(ip);
    if (!ban)
      return false;
    if (new Date(ban.bannedUntil).getTime() >= new Date().getTime())
      return true;
    return false;
  }
}
