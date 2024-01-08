
import { ChatMessageQueue,IChatMessage,IChatMessageQueue } from "../ChattingSchema"
import type { Types } from "mongoose"

export namespace ChatMessageQueueSchema{
    
    export const create = function (receiver: Types.ObjectId|string,room: Types.ObjectId|string,message:Types.ObjectId|string) {
        return new ChatMessageQueue({
            user:receiver,
            room:room,
            message:message
        }).save()
    }
    export const findById = function (id: Types.ObjectId|string) {
        return ChatMessageQueue.findById(id)
    }
    export const count = function(receiver: Types.ObjectId|string,room:Types.ObjectId|string){
        return ChatMessageQueue.countDocuments({room:room,user:receiver})
    }
    export const consume = async function (receiver: Types.ObjectId|string,room:Types.ObjectId|string):Promise<IChatMessage[]> {
        let messages = await ChatMessageQueue.find({room:room,user:receiver}).sort({ createdAt: "asc" })
        .populate<{ message:IChatMessage}>("message","createdAt content sender serial")

        await ChatMessageQueue.deleteMany({room:room,user:receiver})

        return messages.map(m => m.message)
    }
    export const clear = function(room:Types.ObjectId|string) {
        return ChatMessageQueue.deleteMany({room:room})
    }
    export const onUserLeft = function(room:Types.ObjectId|string,receiver: Types.ObjectId|string) {
        return ChatMessageQueue.deleteMany({room:room,user:receiver})
    }
}