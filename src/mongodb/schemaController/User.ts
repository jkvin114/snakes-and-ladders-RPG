import type { Types } from "mongoose"
import { User } from "../DBHandler"


export namespace UserSchema{
    export const findIdByUsername = async function (name:string):Promise<Types.ObjectId> {
        let user= await User.findOne({username:name})
        if(!user) return null
        return user._id
    }
    export const findProfileImageById = async function (id:string|Types.ObjectId):Promise<string> {
        let user= await User.findById(id)
        if(!user) return ""
        return user.profileImgDir?user.profileImgDir:""
    }
}