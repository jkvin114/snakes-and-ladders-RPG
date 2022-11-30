import {Comment } from "../../../mongodb/BoardDBSchemas"
import type mongoose from "mongoose"

 
export namespace CommentSchema{
    export const create = function (data:any) {
        return new Comment(data).save()
    }
    export const remove = function (id: mongoose.Types.ObjectId) {
        return Comment.findByIdAndUpdate(id, { deleted: true, content: "", upvoters: [], downvoters: [] })
    }
    export const findOneById = function (id: mongoose.Types.ObjectId) {
        return Comment.findById(id)
    }
    export const getReplyById = function (id: mongoose.Types.ObjectId) {
        return Comment.findById(id).select("reply").populate("reply").populate("author")
    }
    export const addReply = function (id: mongoose.Types.ObjectId, commentId :mongoose.Types.ObjectId) {
        return Comment.findByIdAndUpdate(id, { $inc: { replyCount: 1 }, $addToSet: { reply: commentId } })
    }
    export const removeReply = function (id: mongoose.Types.ObjectId, commentId :mongoose.Types.ObjectId) {
        return Comment.findByIdAndUpdate(id, { $inc: { replyCount: -1 }, $pull: { reply: commentId } })
    }
    export const onPostRemoved = function (id: mongoose.Types.ObjectId) {
        return Comment.findByIdAndUpdate(id, { article: null })
    }
    export const getVotersById = function (id: mongoose.Types.ObjectId) {
        return Comment.findById(id).select("upvoters downvoters")
    }
    
    export const findOfUserByRange = function (
        start: number,
        count: number,
        author: mongoose.Types.ObjectId,
        sortby: string
    ) {
        // //   console.log(count)    //asc, desc  or 1, -1
        // return Comment.find({ deleted: false, uploaded: true,author:author})
        // 	.sort({ createdAt: "desc" })
        // 	.skip(start)
        // 	.limit(count)
    
        if (sortby === "old") {
            return Comment.find({ deleted: false, uploaded: true, author: author }).skip(start).limit(count)
        } else if (sortby === "upvote") {
            return Comment.find({ deleted: false, uploaded: true, author: author })
                .sort({ upvote: "desc",createdAt: "desc"  })
                .skip(start)
                .limit(count)
        } else {
            return Comment.find({ deleted: false, uploaded: true, author: author })
                .sort({ createdAt: "desc" })
                .skip(start)
                .limit(count)
        }
    }
    
    export const changeUpvote = function (id: mongoose.Types.ObjectId, change:number, voter: mongoose.Types.ObjectId) {
        if (change < 0) {
            return Comment.findByIdAndUpdate(id, { $inc: { upvote: change }, $pull: { upvoters: voter } })
        } else {
            return Comment.findByIdAndUpdate(id, { $inc: { upvote: change }, $addToSet: { upvoters: voter } })
        }
    }
    
    export const changeDownvote = function (id: mongoose.Types.ObjectId, change:number, voter: mongoose.Types.ObjectId) {
        if (change < 0) {
            return Comment.findByIdAndUpdate(id, { $inc: { downvote: change }, $pull: { downvoters: voter } })
        } else {
            return Comment.findByIdAndUpdate(id, { $inc: { downvote: change }, $addToSet: { downvoters: voter } })
        }
    }
    export const cleanUpDeletedAndNoReply = function(){
        return Comment.find({deleted:true,reply:{$size:0}})
    }
    export const cleanUp = function (id: mongoose.Types.ObjectId) {
        return Comment.findByIdAndDelete(id)
    }
}