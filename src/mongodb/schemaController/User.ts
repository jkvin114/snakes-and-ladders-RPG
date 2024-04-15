import type { Types } from "mongoose"
import { User } from "../UserDBSchema"
import type { SchemaTypes } from "../SchemaTypes"
import { MongoId } from "../types"


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
    export const create = function(data:SchemaTypes.User){
        return (new User(data)).save()
    }
    export const findById = function(id:string|Types.ObjectId){
        return User.findById(id)
    }
    export const findAllSummary = function() {
        return User.find({}).select('profileImgDir username email')
    };
    export const findAllSummaryByIdList = function(id: Types.ObjectId[]) {
        return User.find({ _id:{$in:id}}).select('profileImgDir username email')
    };
    export const findUsernameById = function(id:string) {
        return User.findById(id).select('username')
    };
    export const getBoardData = async function(id:string): Promise<Types.ObjectId|null> {
        let user = await User.findById(id).select('boardData')
        if(!user) return null
        return user.boardData as Types.ObjectId
    };
    export const getBoardDataByUsername = async function(name:string): Promise<Types.ObjectId|null> {
        let user = await User.findOne({username:name}).select('boardData')
        if(!user) return null
        return user.boardData as Types.ObjectId
    };
    export const updateProfileImage = function(id:Types.ObjectId|string,imgdir:string) {
        return User.findByIdAndUpdate(id,{profileImgDir:imgdir})
    };
    export const getBoardDataPopulated = function(id:Types.ObjectId) {
        return User.findById(id).select('boardData').populate("boardData")
    };
    
    export const deleteOneById = function(id:Types.ObjectId|string) {
        return User.findByIdAndDelete(id)
    };
    export const updatePassword = function(id:Types.ObjectId|string,password:string,salt:string) {
        return User.findByIdAndUpdate(id,{password:password,salt:salt})
    };
    export const updateEmail = function(id:Types.ObjectId|string,email:string) {
        return User.findByIdAndUpdate(id,{email:email})
    };
    export const addSimulationId = function(id:Types.ObjectId|string,sim_id:Types.ObjectId|string) {
        return User.findByIdAndUpdate(id,{ $push: { simulations: sim_id}})
    };
    export const setBoardData = function(id:Types.ObjectId|string,boardData:Types.ObjectId|string) {
        return User.findByIdAndUpdate(id,{ boardData:boardData})
    };
    export const findOneByUsername = function(username:string) {
        return User.findOne({username:username})
    };
    export const updateLastActive=function(id:MongoId){
        return User.findByIdAndUpdate(id,{lastActive:Date.now()})
    }
    /**
     * 
     * @param str 
     * @returns find entries where the username field contains a given string
     */
    export const searchByName = function(str:string)
    {
        return User.find({ username: { $regex: str, $options: 'i' } });
    }
}
