import mongoose, { InferSchemaType, Schema } from "mongoose";

const notificationSchema=new mongoose.Schema({
    receiver:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "User",
        index:true
    },
    type:{
        required:true,
        type: String,
        enum : ['EMPTY',"OTHER",'CHAT',"COMMENT","REPLY",'POST','FRIEND_REQUEST',
        "STOCKGAME_SURPASS","GAME_INVITE","NEW_FOLLOWER"],
        default: 'EMPTY',
    },
    message:{
        type: String,
    },
    url:{
        type: String,
    },
    payload1:mongoose.Schema.Types.Mixed,
    payload2:mongoose.Schema.Types.Mixed,
    payload3:mongoose.Schema.Types.Mixed,
    payload4:mongoose.Schema.Types.Mixed,
    payload5:mongoose.Schema.Types.Mixed,
    read:{//true if user saw and clicked the notification 
        type:Boolean,
        required:true,
        default:false
    },
    accessed:{
        type:Boolean,  //true if accessed by client`s poll request
        required:true,
        default:false
    },
},{timestamps:true})

const userMutedNotification=new mongoose.Schema({
    user:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "User",
        index:true
    },
    chat:Boolean,
    comment:Boolean,
    post:Boolean,
    reply:Boolean,
    stockgameSurpass:Boolean,
    follower:Boolean
})
const Notification = mongoose.model("Notification", notificationSchema)

type INotification = InferSchemaType<typeof notificationSchema>;


const UserMutedNotification = mongoose.model("UserMutedNotification", userMutedNotification)

type IUserMutedNotification = InferSchemaType<typeof userMutedNotification>;

export {Notification,INotification,UserMutedNotification,IUserMutedNotification}