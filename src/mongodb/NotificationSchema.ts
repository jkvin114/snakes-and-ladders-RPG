import mongoose, { InferSchemaType, Schema } from "mongoose";

const notificationSchema=new mongoose.Schema({
    receiver:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    type:{
        required:true,
        type: String,
        enum : ['EMPTY',"OTHER",'CHAT',"COMMENT","REPLY",'POST','FRIEND_REQUEST'],
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
})

const Notification = mongoose.model("Notification", notificationSchema)

type INotification = InferSchemaType<typeof notificationSchema>;

export {Notification,INotification}