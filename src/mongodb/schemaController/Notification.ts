import type { Types } from "mongoose"
import { INotification ,Notification} from "../NotificationSchema"
import { NotificationCache } from "../../cache/cache"
import { sleep } from "../../RPGGame/core/Util"
import { MongoId } from "../types"

export namespace NotificationSchema{
    

    export const create = function (data:INotification) {
        return new Notification(data).save()
    }
    export const findById = function (id: Types.ObjectId|string) {
        return Notification.findById(id)
    }
    export const findAll  = function(receiver:Types.ObjectId|string){
        return Notification.find({receiver:receiver}).sort({ createdAt: "desc" })
    }
    export const findUnaccessed = function(receiver:Types.ObjectId|string){
        return Notification.find({receiver:receiver,accessed:false}).sort({ createdAt: "desc" })
    }
    export const setAccessed = function(receiver:Types.ObjectId|string){
        Notification.updateMany({receiver:receiver,accessed:false},{accessed:true}).then()
    }
    export const deleteById = function(id: Types.ObjectId|string){
        return Notification.findByIdAndDelete(id)
    }
    export const createTest = function(message:string,receiver:Types.ObjectId|string){
        return new Notification({
            receiver:receiver,
            type:"EMPTY",
            message:message
        }).save()
    }
    export async function stockGameSurpass(receiver:MongoId,playerName:string,score:number) {
        return new Notification({
            receiver:receiver,
            type:"STOCKGAME_SURPASS",
            message:"Someone topped your score!",
            payload1:playerName,
            payload2:score
        }).save()
    }
    export async function gameInvite(receiver:MongoId,senderName:string,roomId:string,type:string) {
        await Notification.deleteMany({
            receiver:receiver,
            type:"GAME_INVITE",
            payload2:String(roomId)
        })

        return new Notification({
            receiver:receiver,
            type:"GAME_INVITE",
            message:"You are invited to game",
            payload1:senderName,
            payload2:roomId,
            payload3:type,
        }).save()
    }
    export async function revokeGameInvite(receiver:MongoId,roomId:string) {
        //delete previous notifications
        return Notification.deleteMany({
            receiver:receiver,
            type:"GAME_INVITE",
            payload2:String(roomId)
        })
    }
    export const newChat = async function (receiver:Types.ObjectId|string,roomId:Types.ObjectId|string,message:string,serial:number,
        sendername:string,senderProfile:string) {
        
        //delete previous notifications
        await Notification.deleteMany({
            receiver:receiver,
            type:"CHAT",
            payload1:String(roomId)
        })
        
        const noti =  await new Notification({
            receiver:receiver,
            type:"CHAT",
            message:message,
            payload1:String(roomId),
            payload2:serial,
            payload3:sendername,
            payload4:senderProfile
        }).save()

        return noti
    }
    export const consumeChat = function (receiver:Types.ObjectId|string,roomId:Types.ObjectId|string) {
        
        //delete previous notifications
        return Notification.deleteMany({
            receiver:receiver,
            type:"CHAT",
            payload1:String(roomId)
        })
        
    }
}