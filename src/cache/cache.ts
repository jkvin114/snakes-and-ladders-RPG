import mongoose from "mongoose";
import { UserSchema } from "../mongodb/schemaController/User";



export interface IUserCache{
    username:string
    profileImgDir:string
    email:string
    boardData:string|mongoose.Types.ObjectId
}

export namespace UserCache{
    let cachehit=0
    let cachemiss=0
    const userCache = new Map<string,IUserCache>()

    export function getEval(){
        if(cachehit+cachemiss===0) return ''
        return `cache hit:${cachehit}, miss: ${cachemiss}. Hit rate: ${cachehit/(cachehit+cachemiss)}`
    }

    function onCacheMiss(id:string|mongoose.Types.ObjectId){
        cachemiss++
        return UserSchema.findById(id)
    }
    export async function getUser(id:string|mongoose.Types.ObjectId):Promise<IUserCache>{
        if(userCache.has(String(id))){
            cachehit++
            return userCache.get(String(id))
        }
        const user = await onCacheMiss(id)
        userCache.set(String(id),{
            username:user.username,
            profileImgDir:user.profileImgDir,
            boardData:user.boardData as mongoose.Types.ObjectId,
            email:user.email
        })
        return userCache.get(String(id))
    }
    export function invalidate(id:string|mongoose.Types.ObjectId){
        userCache.delete(String(id))
    }
}


export namespace NotificationCache{
    const users = new Set<string>()
    export function post(userId:string|mongoose.Types.ObjectId){
        users.add(String(userId))
    }
    export function consume(userId:string|mongoose.Types.ObjectId){
        return users.delete(String(userId))
    }
    export function invalidateAll(){
        users.clear()
    }
}