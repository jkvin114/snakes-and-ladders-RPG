import mongoose from "mongoose";
import { UserSchema } from "../mongodb/schemaController/User";
import { MongoId } from "../mongodb/types";
import { Logger } from "../logger";



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
        return `cache hit:${cachehit}, miss: ${cachemiss}. Hit rate: ${cachehit/(cachehit+cachemiss)}`
    }

    function onCacheMiss(id:MongoId){
        cachemiss++
        return UserSchema.findById(id)
    }
    export async function getUser(id:MongoId):Promise<IUserCache>{
        if(userCache.has(String(id))){
            cachehit++
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
    export function post(userId:MongoId){
        
        users.add(String(userId))
    }
    export function consume(userId:MongoId){
        return users.delete(String(userId))
    }
    export function invalidateAll(){
        users.clear()
    }
    export function getAll(){
        return [...users]
    }
}