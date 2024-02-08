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
        //person who created the room or first started a chat
        required: true,
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    opponent:{
        //in a room that is size 2, refers to the other person other than the admin.
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
    },
    lastSerial:Number
},{ timestamps: true })

const chatMessageSchema = new mongoose.Schema({
    room:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "ChatRoom",
        index:true
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

chatMessageSchema.index({ serial: 1 });

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


export type IChatRoom = InferSchemaType<typeof chatRoomSchema>;
export type IChatRoomJoinStatus = InferSchemaType<typeof chatRoomJoinStatusSchema>;
export type IChatMessage = InferSchemaType<typeof chatMessageSchema>;
export type IUserChatRoomSetting = InferSchemaType<typeof userChatRoomSetting>;

