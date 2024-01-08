import mongoose, { InferSchemaType, Schema } from "mongoose";

const chatRoomSchema=new mongoose.Schema({

    name:{
        type: String,
        required:true
    },
    size:{
        type:Number,
        required:true
    },
    admin:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    serial:{
        type:Number,
        required:true,
        default:0
    },
},{ timestamps: true })

const chatRoomJoinStatusSchema=new mongoose.Schema({
    user:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    room:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "ChatRoom"
    }
},{ timestamps: true })

const chatMessageSchema = new mongoose.Schema({
    room:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "ChatRoom"
    },
    sender:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    content:{
        required:true,
        type:String
    },
    serial:{
        type:Number,
        required:true,
    },
},{ timestamps: true })

const chatMessageQueue = new mongoose.Schema({
    user:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    message:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "ChatMessage"
    },
    room:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "ChatRoom"
    }
},{ timestamps: true })

const userChatRoomSetting = new mongoose.Schema({
    room:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "ChatRoom"
    },
    user:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{ timestamps: true })


export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema)
export const ChatRoomJoinStatus = mongoose.model("ChatRoomJoinStatus", chatRoomJoinStatusSchema)
export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema)
export const UserChatRoomSetting = mongoose.model("UserChatRoomSetting", userChatRoomSetting)
export const ChatMessageQueue = mongoose.model("ChatMessageQueue", chatMessageQueue)


export type IChatRoom = InferSchemaType<typeof chatRoomSchema>;
export type IChatRoomJoinStatus = InferSchemaType<typeof chatRoomJoinStatusSchema>;
export type IChatMessage = InferSchemaType<typeof chatMessageSchema>;
export type IUserChatRoomSetting = InferSchemaType<typeof userChatRoomSetting>;
export type IChatMessageQueue = InferSchemaType<typeof chatMessageQueue>;

