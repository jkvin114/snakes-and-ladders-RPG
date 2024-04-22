import mongoose from "mongoose";
import { UserSchema } from "../mongodb/schemaController/User";
import { MongoId } from "../mongodb/types";
import { Logger } from "../logger";
import { RedisClient } from "../redis/redis";



export interface IUserCache{
    username:string
    profileImgDir:string
    email:string
    boardData:string|mongoose.Types.ObjectId
    lastActive?:number
}

export namespace UserCache{
    let cachehit=0
    let cachemiss=0
    const userCache = new Map<string,IUserCache>()

    export function getEval(){
        if(cachehit+cachemiss===0) return ''
        return `user cache report: cache hit:${cachehit}, miss: ${cachemiss}. Hit rate: ${cachehit/(cachehit+cachemiss)}`
    }

    function onCacheMiss(id:MongoId){
        cachemiss++
        return UserSchema.findById(id)
    }
    export async function getUser(id:MongoId):Promise<IUserCache>{
        if(userCache.has(String(id))){
            cachehit++
            if(cachehit%100===99) {
                Logger.log(UserCache.getEval())
            }
            return userCache.get(String(id))
        }
        const user = await onCacheMiss(id)
        userCache.set(String(id),{
            username:user.username,
            profileImgDir:user.profileImgDir,
            boardData:user.boardData as mongoose.Types.ObjectId,
            email:user.email,
            lastActive:user.lastActive
        })
        return userCache.get(String(id))
    }
    export function invalidate(id:MongoId){
        userCache.delete(String(id))
    }
}


export namespace NotificationCache{
    const users = new Set<string>()
    const prefix="cache-notification"
    export async function post(userId:MongoId){
        
        // users.add(String(userId))
        RedisClient.addToSet(prefix,String(userId))
    }
    export async function consume(userId:MongoId):Promise<boolean>{
        // return users.delete(String(userId))
        return await RedisClient.removeFromSet(prefix,String(userId))
    }
    export function clear(){
        //users.clear()
    }
    export async function printAll(){
        console.log(await RedisClient.getSet(prefix))
    }
}
export namespace FriendRequestCache{
    const requests = new Map<string,Set<string>>()

    export function add(from:MongoId,to:MongoId){
        if(requests.has(String(from))){
            requests.get(String(from)).add(String(to))
        }
        else{
            requests.set(String(from),new Set<string>().add(String(to)))
        }
        console.log(requests)
    }
    export function getRequested(from:MongoId):Set<string>|undefined{
        return requests.get(String(from))
    }

    export function remove(from:MongoId,to:MongoId){
        console.log(requests)
        return requests.get(String(from))?.delete(String(to))
    }

    export function has(from:MongoId,to:MongoId):boolean{
        if(requests.has(String(from))){
            return requests.get(String(from)).has(String(to))
        }
        else{
            return false
        }
    }
    export function clear(){
        requests.clear()
    }
}