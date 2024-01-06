import type mongoose from "mongoose"

export interface IFriend{
    _id:mongoose.Types.ObjectId
    profileImgDir:string
    username:string
    email:string
    status?:string
}
export interface IFollow{
    _id:mongoose.Types.ObjectId
    profileImgDir:string
    username:string
    email:string
    isMyFollowing?:boolean
}