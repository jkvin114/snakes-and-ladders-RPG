import { Types } from "mongoose";
import { INotification } from "../mongodb/NotificationSchema";
import { NotificationSchema } from "../mongodb/schemaController/Notification";
import { sleep } from "../RPGGame/core/Util";
import { NotificationCache } from "../cache/cache";

export namespace NotificationController{
    const POLL_PERIOD = 5 * 1000
    const MAX_TIMEOUT = 60 
    export async function notifyChat(user:string, room:string, message:string, serial:number,sendername: string, senderProfile: string){
        await NotificationSchema.newChat(user, room, message, serial,sendername,senderProfile)
        NotificationCache.post(user)
    }

    export const poll = async function(receiver:Types.ObjectId|string){
        let notis:INotification[]=[]

        for(let i=0;i<MAX_TIMEOUT;i++){
            
            if(NotificationCache.consume(receiver)){
                notis = await NotificationSchema.findUnaccessed(receiver)
                break
            }
            await sleep(POLL_PERIOD)
        }
        
        if(notis.length>0)
            NotificationSchema.setAccessed(receiver)
        return notis
    }

}