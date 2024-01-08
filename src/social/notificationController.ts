import { NotificationSchema } from "../mongodb/schemaController/Notification";

export namespace NotificationController{
    export async function notifyChat(user:string, room:string, message:string, serial:number){
        await NotificationSchema.newChat(user, room, message, serial)
    }
}