import { InMemoryFriendRequestCacheManager, RedisFriendRequestCacheManager } from "./FriendRequestCacheManager"
import { InMemoryNotificationCacheManager, RedisNotificationCacheManager } from "./NotificationCacheManager"
import { InMemoryUserCacheManager, RedisUserCacheManager } from "./UserCacheManager"
import IFriendRequestCacheManager from "./interface/IFriendRequestCacheManager"
import INotificationCacheManager from "./interface/INotificationCacheManager"
import IUserCacheManager from "./interface/IUserCacheManager"

const useredis: boolean = !!process.env.REDIS_HOST
console.log("use redis on cache:"+useredis)
export const UserCache: IUserCacheManager = useredis
	? RedisUserCacheManager.getInstance()
	: InMemoryUserCacheManager.getInstance()
export const FriendRequestCache: IFriendRequestCacheManager = useredis
	? RedisFriendRequestCacheManager.getInstance()
	: InMemoryFriendRequestCacheManager.getInstance()
export const NotificationCache: INotificationCacheManager = useredis
	? RedisNotificationCacheManager.getInstance()
	: InMemoryNotificationCacheManager.getInstance()
