import type { Types } from "mongoose"
import { SchemaTypes } from "../SchemaTypes"
import { Friend,Follow } from "../UserRelationDBSchema"
const { ObjectID } =require('mongodb') ;


export namespace UserRelationSchema{

    export const addFriend = async function (source: Types.ObjectId|string,target: Types.ObjectId|string){
        return await new Friend({source:new ObjectID(source) ,target:new ObjectID(target)}).save()
    }
    export const findFriends = async function (id: Types.ObjectId|string) {
        let friends= await Friend.find({source:id})
        return friends.map((f)=>f.target)
    }
    export const isFriendWith = async function (source: Types.ObjectId|string,target: Types.ObjectId|string):Promise<boolean> {
        let f= await Friend.find({source:source,target:target})
        return f.length>0
    }
    export const friendCount = async function (id: Types.ObjectId|string) {
        return await Friend.countDocuments({source:id})
    }
    export const deleteFriend = async function (source: Types.ObjectId|string,target: Types.ObjectId|string){
        return await Friend.findOneAndRemove({source:source,target:target})
    }
    export const addFollow = async function (source: Types.ObjectId|string,target: Types.ObjectId|string){
        return await new Follow({source:new ObjectID(source) ,target:new ObjectID(target) }).save()
    }
    export const deleteFollow = async function (source: Types.ObjectId|string,target: Types.ObjectId|string){
        return await Follow.findOneAndRemove({source:source,target:target})
    }
    export const findFollows = async function (id: Types.ObjectId|string) {
        let follows= await Follow.find({source:id})
        return follows.map((f)=>f.target)
    }
    export const isFollowTo = async function (source: Types.ObjectId|string,target: Types.ObjectId|string) :Promise<boolean> {
        return (await Follow.find({source:source,target:target})).length>0
    }
    export const followCount = async function (id: Types.ObjectId|string) {
        return await Follow.countDocuments({source:id})
    }
}