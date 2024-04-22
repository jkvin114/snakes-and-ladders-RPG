import type {Types} from "mongoose"


export interface IUserCache{
    username:string
    profileImgDir:string
    email:string
    boardData:string|Types.ObjectId
    lastActive?:number
}