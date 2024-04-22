import { MongoId } from "../mongodb/types";
import { RedisClient } from "../redis/redis";
import BaseCacheManager from "./BaseCacheManager";
import INotificationCacheManager from "./interface/INotificationCacheManager";

export class InMemoryNotificationCacheManager extends BaseCacheManager implements INotificationCacheManager{
    private static instance: InMemoryNotificationCacheManager;
    protected prefix: string;
    private users : Set<string>
    private constructor() {
        super()
        this.users = new Set<string>()
        this.prefix="notification"
    }
   async post(userId: MongoId): Promise<void> {
        this.users.add(String(userId))
    }
    async consume(userId: MongoId): Promise<boolean> {
        return this.users.delete(String(userId))
    }
    
    static getInstance() {
        if (this.instance) {
          return this.instance;
        }
        this.instance = new InMemoryNotificationCacheManager();
        return this.instance;
      }
}

export class RedisNotificationCacheManager extends BaseCacheManager implements INotificationCacheManager{
    private static instance: RedisNotificationCacheManager;
    protected readonly prefix: string;
    private constructor() {
        super()
        this.prefix="cache-notification"
    }
    async post(userId: MongoId): Promise<void> {
        await RedisClient.addToSet(this.prefix,String(userId))
    }
    async consume(userId: MongoId): Promise<boolean> {
        return await RedisClient.removeFromSet(this.prefix,String(userId))
    }
    
    static getInstance() {
        if (this.instance) {
          return this.instance;
        }
        this.instance = new RedisNotificationCacheManager();
        return this.instance;
      }
}