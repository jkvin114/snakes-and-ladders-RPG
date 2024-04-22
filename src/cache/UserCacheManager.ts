import type { Types } from "mongoose";
import { UserSchema } from "../mongodb/schemaController/User"
import type{ MongoId } from "../mongodb/types";
import BaseCacheManager from "./BaseCacheManager"
import type{ IUserCache } from "./interface/IUserCache";
import IUserCacheManager from "./interface/IUserCacheManager"
import { RedisClient } from "../redis/redis";

export class InMemoryUserCacheManager extends BaseCacheManager implements IUserCacheManager{
    private static instance: InMemoryUserCacheManager;
    protected prefix: string;
    private userCache:Map<string,IUserCache>
    private constructor() {
        super()
        this.prefix="user"
        this.userCache = new Map<string,IUserCache>()
    }
  
    static getInstance() {
      if (this.instance) {
        return this.instance;
      }
      this.instance = new InMemoryUserCacheManager();
      return this.instance;
    }


    onCacheMiss(id:MongoId){
        this.cachemiss++
        return UserSchema.findById(id)
    }
     async  getUser(id:MongoId):Promise<IUserCache>{
        if(this.userCache.has(String(id))){
            this.cachehit++
            if(this.cachehit%100===99) {
                this.logCacheReport()
            }
            return this.userCache.get(String(id))
        }
        const user = await this.onCacheMiss(id)

        this.userCache.set(String(id),{
            username:user.username,
            profileImgDir:user.profileImgDir,
            boardData:user.boardData as Types.ObjectId,
            email:user.email,
            lastActive:user.lastActive
        })
        return this.userCache.get(String(id))
    }
     invalidate(id:MongoId){
       this.userCache.delete(String(id))
    }
}


export class RedisUserCacheManager extends BaseCacheManager implements IUserCacheManager{
    private static instance: RedisUserCacheManager;
    protected readonly prefix: string;
    private constructor() {
        super()
        this.prefix="cache-user:"
    }
  
    static getInstance() {
      if (this.instance) {
        return this.instance;
      }
      this.instance = new RedisUserCacheManager();
      return this.instance;
    }
    private convert(obj:Record<string, string>):IUserCache{
        return {
            username:obj.username,
            profileImgDir:obj.profileImgDir,
            boardData:obj.boardData,
            email:obj.email,
            lastActive:Number(obj.lastActive)
        }
    }

    private onCacheMiss(id:MongoId){
        this.cachemiss++
        return UserSchema.findById(id)
    }
     async getUser(id:MongoId):Promise<IUserCache>{
        if(await RedisClient.has(this.prefix+String(id))){
            this.cachehit++
            if(this.cachehit%100===99) {
                this.logCacheReport()
            }
            return this.convert(await RedisClient.getObj(this.prefix+String(id)))
          //  return userCache.get(String(id))
        }
        const user = await this.onCacheMiss(id)

        await RedisClient.setObj(this.prefix+String(id),{
            username:user.username,
            profileImgDir:user.profileImgDir,
            boardData:user.boardData as Types.ObjectId,
            email:user.email,
            lastActive:user.lastActive
        })
        return this.convert(await RedisClient.getObj(this.prefix+String(id)))
    }
    async invalidate(id:MongoId){
        await RedisClient.remove(this.prefix+String(id))
    }
}

