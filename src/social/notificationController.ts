import { Types } from "mongoose";
import { INotification } from "../mongodb/NotificationSchema";
import { NotificationSchema } from "../mongodb/schemaController/Notification";
import { sleep } from "../RPGGame/core/Util";
import { NotificationCache } from "../cache/cache";

export namespace NotificationController{
    const POLL_PERIOD = 5 * 1000
    const MAX_TIMEOUT = 5 * 60 * 1000
    export async function notifyChat(user:string, room:string, message:string, serial:number,sendername: string, senderProfile: string){
        await NotificationSchema.newChat(user, room, message, serial,sendername,senderProfile)
    }

    export const poll = async function(receiver:Types.ObjectId|string){
        let notis:INotification[]=[]
        let i=0

        while(notis.length===0){
            await sleep(POLL_PERIOD)
            if(NotificationCache.consume(receiver)){
                notis = await NotificationSchema.findUnaccessed(receiver)
            }
            i++
            if(i*POLL_PERIOD > MAX_TIMEOUT){
                break
            }
        }
        if(notis.length>0)
            NotificationSchema.setAccessed(receiver)
        return notis
    }

}