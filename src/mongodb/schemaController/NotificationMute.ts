import type { Types } from "mongoose"
import { IUserMutedNotification,UserMutedNotification} from "../NotificationSchema"
import { MongoId } from "../types"
import { NotificationSchema } from "./Notification"

export namespace NotificationMuteSchema{
    export async function create(user:MongoId):Promise<void>{
        const status = await UserMutedNotification.findOne({user:user})
        if(status) return 
        await new UserMutedNotification({
            user:user,
            all:false
        }).save()
    }
    export async function isMuted(user:MongoId,type:NotificationSchema.TYPE):Promise<boolean>{
        const status = await UserMutedNotification.findOne({user:user})
        if(!status ||!status.all) return false
        if(status.all) return true
        switch(type){
            case NotificationSchema.TYPE.Chat:
                return status.chat
            case NotificationSchema.TYPE.Comment:
                return status.comment
            case NotificationSchema.TYPE.Post:
                return status.post
            case NotificationSchema.TYPE.Reply:
                return status.reply
            case NotificationSchema.TYPE.StockGameSurpass:
                return status.stockgameSurpass
            case NotificationSchema.TYPE.NewFollower:
                return status.follower
        }
        return false
    }
    export function setAll(user:MongoId,val:boolean){
        return UserMutedNotification.findOneAndUpdate({user:user},{all:val})
    }

    export function set(user:MongoId,type:NotificationSchema.TYPE,val:boolean){
        let update = {}
        switch(type){
            case NotificationSchema.TYPE.Chat:
                update = {chat:val}
                break
            case NotificationSchema.TYPE.Comment:
                update = {comment:val}
                break
            case NotificationSchema.TYPE.Post:
                update = {post:val}
                break
            case NotificationSchema.TYPE.Reply:
                update = {reply:val}
                break
            case NotificationSchema.TYPE.StockGameSurpass:
                update = {stockgameSurpass:val}
                break
            case NotificationSchema.TYPE.NewFollower:
                update = {follower:val}
                break
        }
        return UserMutedNotification.findOneAndUpdate({user:user},update)
    }
}
