import { SchemaTypes } from "../SchemaTypes";
import { User } from "../UserDBSchema";
import { IUserGamePlay, UserGamePlay } from "../UserGamePlaySchema";
import { MongoId } from "../types";

export namespace UserGamePlaySchema{
    export const create = function(data:IUserGamePlay) {
        UserGamePlay.create(data)
    }
    export const findByUser = function(userId:MongoId) {
        return UserGamePlay.find({user:userId})
    }
    export const findMarbleByUser = function(userId:MongoId) {
        return UserGamePlay.find({user:userId,type:"MARBLE"}).sort({ createdAt: "desc" })
    }
    export const findMarbleByUsername = function(username:string) {
        return UserGamePlay.find({username:username,type:"MARBLE"}).sort({ createdAt: "desc" })
    }
    export const findRPGByUser = function(userId:MongoId) {
        return UserGamePlay.find({user:userId,type:"RPG"}).sort({ createdAt: "desc" })
    }
    export const findRPGByUsername = function(username:string) {
        return UserGamePlay.find({username:username,type:"RPG"}).sort({ createdAt: "desc" })
    }
    export const count = function(userId:MongoId,type:"RPG"|"MARBLE"){
        return UserGamePlay.countDocuments({user:userId,type:type})
    }

}