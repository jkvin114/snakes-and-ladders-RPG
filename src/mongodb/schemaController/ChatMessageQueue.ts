
import { ChatMessageQueue,IChatMessageQueue } from "../ChattingSchema"
import type { Types } from "mongoose"

export namespace ChatMessageQueueSchema{
    
    export const create = function (data:IChatMessageQueue) {
        return new ChatMessageQueue(data).save()
    }
    export const findById = function (id: Types.ObjectId|string) {
        return ChatMessageQueue.findById(id)
    }
    export const count = function(user: Types.ObjectId|string,room:Types.ObjectId|string){
        return ChatMessageQueue.countDocuments({room:room,user:user})
    }
    export const consume = async function (user: Types.ObjectId|string,room:Types.ObjectId|string):Promise<Types.ObjectId[]> {
        let messages = await ChatMessageQueue.find({room:room,user:user}).sort({ createdAt: "asc" })
        await ChatMessageQueue.deleteMany({room:room,user:user})
        return messages.map(m => m.message)
    }
    export const clear = function(room:Types.ObjectId|string) {
        return ChatMessageQueue.deleteMany({room:room})
    }
    export const onUserLeft = function(room:Types.ObjectId|string,user: Types.ObjectId|string) {
        return ChatMessageQueue.deleteMany({room:room,user:user})
    }
}