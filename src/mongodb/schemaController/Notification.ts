import type { Types } from "mongoose"
import { INotification ,Notification} from "../NotificationSchema"

export namespace NotificationSchema{
    
    export const create = function (data:INotification) {
        return new Notification(data).save()
    }
    export const findById = function (id: Types.ObjectId|string) {
        return Notification.findById(id)
    }
    export const newChat = async function (receiver:Types.ObjectId|string,roomId:Types.ObjectId|string,message:string,serial:number) {
        
        //delete previous notifications
        await Notification.deleteMany({
            receiver:receiver,
            type:"CHAT",
            payload1:String(roomId)
        })
        
        return await new Notification({
            receiver:receiver,
            type:"CHAT",
            message:message,
            payload1:String(roomId),
            payload2:serial
        }).save()
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