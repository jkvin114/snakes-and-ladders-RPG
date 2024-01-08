import type { Types } from "mongoose"
import { INotification ,Notification} from "../NotificationSchema"

export namespace NotificationSchema{
    
    export const create = function (data:INotification) {
        return new Notification(data).save()
    }
    export const findById = function (id: Types.ObjectId|string) {
        return Notification.findById(id)
    }
}