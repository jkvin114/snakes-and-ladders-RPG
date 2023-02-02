import {Comment } from "../BoardDBSchemas"
import type { Types } from "mongoose"
import { SchemaTypes } from "../SchemaTypes"

 
export namespace CommentSchema{
    export const create = async function (data:any) {
        return await new Comment(data).save()
    }
    export const remove = async function (id: Types.ObjectId) {
        return await Comment.findByIdAndUpdate(id, { deleted: true, content: "", upvoters: [], downvoters: [] })
    }
    export const findOneById = async function (id: Types.ObjectId) {
        return await Comment.findById(id)
    }
    export const getReplyById = async function (id: Types.ObjectId) {
        return await Comment.findById(id).select("reply").populate<{ reply:SchemaTypes.CommentReply[]}>("reply")
    }
    export const addReply = async function (id: Types.ObjectId, commentId :Types.ObjectId) {
        return await Comment.findByIdAndUpdate(id, { $inc: { replyCount: 1 }, $addToSet: { reply: commentId } })
    }
    export const removeReply = async function (id: Types.ObjectId, commentId :Types.ObjectId) {
        return await Comment.findByIdAndUpdate(id, { $inc: { replyCount: -1 }, $pull: { reply: commentId } })
    }
    export const onPostRemoved = async function (id: Types.ObjectId) {
        return await Comment.findByIdAndUpdate(id, { article: null })
    }
    export const getVotersById = async function (id: Types.ObjectId) {
        return await Comment.findById(id).select("upvoters downvoters")
    }
    
    export const findOfUserByRange = async function (
        start: number,
        count: number,
        author: Types.ObjectId,
        sortby: string
    ) {
        // //   console.log(count)    //asc, desc  or 1, -1
        // return await Comment.find({ deleted: false, uploaded: true,author:author})
        // 	.sort({ createdAt: "desc" })
        // 	.skip(start)
        // 	.limit(count)
    
        if (sortby === "old") {
            return await Comment.find({ deleted: false, uploaded: true, author: author }).skip(start).limit(count)
        } else if (sortby === "upvote") {
            return await Comment.find({ deleted: false, uploaded: true, author: author })
                .sort({ upvote: "desc",createdAt: "desc"  })
                .skip(start)
                .limit(count)
        } else {
            return await Comment.find({ deleted: false, uploaded: true, author: author })
                .sort({ createdAt: "desc" })
                .skip(start)
                .limit(count)
        }
    }
    
    export const changeUpvote = async function (id: Types.ObjectId, change:number, voter: Types.ObjectId) {
        if (change < 0) {
            return await Comment.findByIdAndUpdate(id, { $inc: { upvote: change }, $pull: { upvoters: voter } })
        } else {
            return await Comment.findByIdAndUpdate(id, { $inc: { upvote: change }, $addToSet: { upvoters: voter } })
        }
    }
    
    export const changeDownvote = async function (id: Types.ObjectId, change:number, voter: Types.ObjectId) {
        if (change < 0) {
            return await Comment.findByIdAndUpdate(id, { $inc: { downvote: change }, $pull: { downvoters: voter } })
        } else {
            return await Comment.findByIdAndUpdate(id, { $inc: { downvote: change }, $addToSet: { downvoters: voter } })
        }
    }
    export const cleanUpDeletedAndNoReply = async function(){
        return await Comment.find({deleted:true,reply:{$size:0}})
    }
    export const cleanUp = async function (id: Types.ObjectId) {
        return await Comment.findByIdAndDelete(id)
    }
}