import ISessionManager from "./ISessionManager"
import { RedisSession } from "./RedisSession"
import { InMemorySession } from "./inMemorySession"

const useredis: boolean = !!process.env.REDIS_HOST
console.log("use redis for session:" + useredis)

export const SessionManager: ISessionManager = useredis ? RedisSession.getInstance() :
 InMemorySession.getInstance()
