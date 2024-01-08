
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

    export const findByUserPopulated = function (id: Types.ObjectId|string) {
        return ChatRoomJoinStatus.find({user:id}).select("room").populate<{ room:IChatRoom}>("room","name size")
    }
    export const findByRoomPopulated = function (id: Types.ObjectId|string) {
        return ChatRoomJoinStatus.find({room:id}).select("user").populate<{ user:SchemaTypes.User}>("user","profileImgDir username email")
    }
    export const join = function (room: Types.ObjectId|string,user: Types.ObjectId|string) {
        return new ChatRoomJoinStatus({
            user:user,room:room
        }).save()
    }
    export const left = function (room: Types.ObjectId|string,user: Types.ObjectId|string) {
        return ChatRoomJoinStatus.findOneAndRemove({
            user:user,room:room
        })
    }
}