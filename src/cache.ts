import { IBan } from "./ban.ts";
import { ISession } from "./session.ts";
import { IUser } from "./user.ts";

const path = Deno.cwd() + "/data.json";
const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder();

interface ICache {
  users: IUser[];
  sessions: ISession[];
  bans: IBan[];
  save: () => void;
  load: () => void;
}

export const Cache: ICache = {
  save: function () {
    Deno.writeFileSync(
      path,
      encoder.encode(
        JSON.stringify({ users: Cache.users, sessions: Cache.sessions, bans: Cache.bans }, null, 4)
      )
    );
  },
  load: function () {
    try {
      const loadedData: ICache = JSON.parse(decoder.decode(Deno.readFileSync(path)));
      Cache.users = loadedData.users || [];
      Cache.sessions = loadedData.sessions || [];
      Cache.bans = loadedData.bans || [];
    } catch (_) {
      // ignore
    }
  },
  users: [],
  sessions: [],
  bans: [],
};
