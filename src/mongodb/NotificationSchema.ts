import mongoose, { InferSchemaType, Schema } from "mongoose";

const notificationSchema=new mongoose.Schema({
    target:{
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
    payload:[String]
})

const Notification = mongoose.model("Notification", notificationSchema)

type INotification = InferSchemaType<typeof notificationSchema>;
notificationSchema.statics.create=function(data:INotification){
    return (new Notification(data)).save()
}
export {Notification,INotification}