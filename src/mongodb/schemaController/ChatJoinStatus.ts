
import { ChatRoomJoinStatus,IChatRoom,IChatRoomJoinStatus } from "../ChattingSchema"
import type { Types } from "mongoose"
import { SchemaTypes } from "../SchemaTypes"

export namespace ChatRoomJoinStatusSchema{
    
    export const create = function (data:IChatRoomJoinStatus) {
        return new ChatRoomJoinStatus(data).save()
    }
    export const findById = function (id: Types.ObjectId|string) {
        return ChatRoomJoinStatus.findById(id)
    }
    export const isUserInRoom = async function(user: Types.ObjectId|string,room: Types.ObjectId|string){
        return (await ChatRoomJoinStatus.countDocuments({user:user,room:room})) > 0
    }
    export const findByUser = function (id: Types.ObjectId|string) {
        return ChatRoomJoinStatus.find({user:id})
    }
    export const findByRoom = function (id: Types.ObjectId|string) {
        return ChatRoomJoinStatus.find({room:id})
    }
    export const findOne = function(room: Types.ObjectId|string,user:Types.ObjectId|string){
        return ChatRoomJoinStatus.findOne({user:user,room:room})
    }
    /**
     * update serial number only if current serial is less than the new one.(serial number never decrease)
     * @param room 
     * @param user 
     * @param serial 
     * @returns 
     */
    export const updateLastReadSerial = function (room: Types.ObjectId|string,user:Types.ObjectId|string,serial:number)
    {
        return ChatRoomJoinStatus.findOneAndUpdate({user:user,room:room,$or: [{ lastSerial: { $lt: serial } }, { lastSerial: { $exists: false } }]},{
            lastSerial:serial
        })
    }
    export const findByUserPopulated = async function (id: Types.ObjectId|string){
        return (await ChatRoomJoinStatus.find({user:id}).select("room lastSerial")
        .populate<{ room:IChatRoom}>("room","name size serial opponent admin"))
    }
    export const findByRoomPopulated = async function (id: Types.ObjectId|string) {
        return  (await ChatRoomJoinStatus.find({room:id}).select("user")
        .populate<{ user:SchemaTypes.User}>("user","profileImgDir username email")).map(u=>u.user)
    }
    export const join =async function (room: Types.ObjectId|string,user: Types.ObjectId|string) {
        if(await isUserInRoom(user,room)) return null

        return await new ChatRoomJoinStatus({
            user:user,room:room,lastSerial:0
        }).save()
    }
    export const left = function (room: Types.ObjectId|string,user: Types.ObjectId|string) {
        return ChatRoomJoinStatus.deleteMany({
            user:user,room:room
        })
    }
}