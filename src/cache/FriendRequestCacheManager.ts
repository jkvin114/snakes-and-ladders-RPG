import { MongoId } from "../mongodb/types";
import { RedisClient } from "../redis/redis";
import BaseCacheManager from "./BaseCacheManager";
import IFriendRequestCacheManager from "./interface/IFriendRequestCacheManager";
import { IUserCache } from "./interface/IUserCache";
import IUserCacheManager from "./interface/IUserCacheManager";

export class InMemoryFriendRequestCacheManager extends BaseCacheManager implements IFriendRequestCacheManager{
    private static instance: InMemoryFriendRequestCacheManager;
    protected prefix: string;
    private requests: Map<string,Set<string>>
    private constructor() {
        super()
        this.requests = new Map<string,Set<string>>()
        this.prefix="friendrequest"
    }
    
    static getInstance() {
        if (this.instance) {
          return this.instance;
        }
        this.instance = new InMemoryFriendRequestCacheManager();
        return this.instance;
      }

   async add(from: MongoId, to: MongoId): Promise<void> {
        if(this.requests.has(String(from))){
            this.requests.get(String(from)).add(String(to))
        }
        else{
            this.requests.set(String(from),new Set<string>().add(String(to)))
        }
    }
    async getRequested(from: MongoId): Promise<Set<string>> {
        return this.requests.get(String(from))
    }
    async remove(from: MongoId, to: MongoId): Promise<boolean> {
        return this.requests.get(String(from))?.delete(String(to))
    }
    async  has(from: MongoId, to: MongoId): Promise<boolean> {
        if(this.requests.has(String(from))){
            return this.requests.get(String(from)).has(String(to))
        }
        else{
            return false
        }
    }
    async clear(): Promise<void> {
        this.requests.clear()
    }

  
}

export class RedisFriendRequestCacheManager extends BaseCacheManager implements IFriendRequestCacheManager{
    private static instance: RedisFriendRequestCacheManager;
    protected readonly prefix: string;
    private constructor() {
        super()
        this.prefix="cache-friend-request:"
    }
    clear(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    static getInstance() {
      if (this.instance) {
        return this.instance;
      }
      this.instance = new RedisFriendRequestCacheManager();
      return this.instance;
    }

    async add(from: MongoId, to: MongoId): Promise<void> {
        await RedisClient.addToSet(this.prefix+String(from),String(to))
    }
    async getRequested(from: MongoId): Promise<Set<string>> {
        return new Set(await RedisClient.getSet(this.prefix+String(from)))
    }
    async remove(from: MongoId, to: MongoId): Promise<boolean> {
        return await RedisClient.removeFromSet(this.prefix+String(from),String(to))
    }
    async has(from: MongoId, to: MongoId): Promise<boolean> {
        return await RedisClient.isInSet(this.prefix+String(from),String(to))
    }

  
}