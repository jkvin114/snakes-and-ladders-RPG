import { ChatRoom, IChatRoom } from "../ChattingSchema"
import type { Types } from "mongoose"

export namespace ChatRoomSchema{
    
    export const create = function (admin:Types.ObjectId|string,name?:string) {
        return new ChatRoom({
            name:name?name:"untitled",
            size:0,
            admin:admin,
            serial:0
        }).save()
    }
    export const setAdmin  = function (id: Types.ObjectId|string,user:Types.ObjectId|string)
    {   
        return ChatRoom.findByIdAndUpdate(id,{admin:user})
    }

    export const isDuplicateWithSize2 = function(user1:Types.ObjectId|string,user2:Types.ObjectId|string){
        return ChatRoom.find({ $or: [
            { $and: [{ admin: user1, opponent: user2}] },
            { $and: [{ admin: user2, opponent: user1}] }
          ],size:2}
        )
    }
    export const setOpponent  = function (id: Types.ObjectId|string,user:Types.ObjectId|string)
    {   
        return ChatRoom.findByIdAndUpdate(id,{opponent:user})
    }
    export const findById = function (id: Types.ObjectId|string) {
        return ChatRoom.findById(id)
    }
    
    export const changeName  = function (id: Types.ObjectId|string,name:string)
    {   
        return ChatRoom.findByIdAndUpdate(id,{name:name})
    }
    export const getSerial = async function (id: Types.ObjectId|string):Promise<number>{
        return (await ChatRoom.findById(id)).serial
    }

    export const onPostMessage = function (id: Types.ObjectId|string)
    {   
        return ChatRoom.findByIdAndUpdate(id, { $inc: { serial: 1 } })
    }
    export const onUserJoin  = function (id: Types.ObjectId|string)
    {   
        return ChatRoom.findByIdAndUpdate(id, { $inc: { size: 1 } })
    }
    export const onUserLeft = function (id: Types.ObjectId|string)
    {   
        return ChatRoom.findByIdAndUpdate(id, { $inc: { size: -1 } })
    }

}