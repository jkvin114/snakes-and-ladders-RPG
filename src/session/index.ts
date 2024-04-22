import ISessionManager from "./ISessionManager"
import { RedisSession } from "./RedisSession"
import { InMemorySession } from "./inMemorySession"

const useredis: boolean = !!process.env.REDIS_HOST
console.log("use redis on session:" + useredis)

export const SessionManager: ISessionManager =  InMemorySession.getInstance()
