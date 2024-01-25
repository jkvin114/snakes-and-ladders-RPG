import mongoose, { InferSchemaType, Schema } from "mongoose";

const userGamePlaySchema=new mongoose.Schema({
    user:{
        required: true,
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    username:String,
    type:{
        required:true,
        type: String,
        enum : ['RPG',"MARBLE"],
        default: 'RPG',
    },
    game:{
        required: true,
        type: Schema.Types.ObjectId,
    },
    turn:{
        required: true,
        type:Number
    },
    isWon:{
        required: true,
        type:Boolean
    }
},{timestamps:true})

const UserGamePlay = mongoose.model("UserGamePlay", userGamePlaySchema)

type IUserGamePlay = InferSchemaType<typeof userGamePlaySchema>;

export {UserGamePlay,IUserGamePlay}