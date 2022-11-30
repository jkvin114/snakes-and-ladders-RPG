import {CommentReply } from "../../../mongodb/BoardDBSchemas"
import type mongoose from "mongoose"

 
export namespace ReplySchema{
    export const create = function (data:any) {
        return new CommentReply(data).save()
    }
    export const remove = function (id: mongoose.Types.ObjectId) {
        return CommentReply.findByIdAndDelete(id)
    }
    export const findOneById = function (id: mongoose.Types.ObjectId) {
        return CommentReply.findById(id)
    }
    export const getVotersById = function (id: mongoose.Types.ObjectId) {
        return CommentReply.findById(id).select("upvoters downvoters")
    }
    
    export const findOfUserByRange = function (
        start: number,
        count: number,
        author: mongoose.Types.ObjectId,
        sortby: string
    ) {
        //   console.log(count)    //asc, desc  or 1, -1
        if (sortby === "old") {
            return CommentReply.find({ deleted: false, uploaded: true, author: author }).skip(start).limit(count)
        } else if (sortby === "upvote") {
            return CommentReply.find({ deleted: false, uploaded: true, author: author })
                .sort({ upvote: "desc",createdAt: "desc" })
                .skip(start)
                .limit(count)
        } else {
            return CommentReply.find({ deleted: false, uploaded: true, author: author })
                .sort({ createdAt: "desc" })
                .skip(start)
                .limit(count)
        }
    }
    
    export const changeUpvote = function (id: mongoose.Types.ObjectId, change:number, voter: mongoose.Types.ObjectId) {
        if (change < 0) {
            return CommentReply.findByIdAndUpdate(id, { $inc: { upvote: change }, $pull: { upvoters: voter } })
        } else {
            return CommentReply.findByIdAndUpdate(id, { $inc: { upvote: change }, $addToSet: { upvoters: voter } })
        }
    }
    
    export const changeDownvote = function (id: mongoose.Types.ObjectId, change:number, voter: mongoose.Types.ObjectId) {
        if (change < 0) {
            return CommentReply.findByIdAndUpdate(id, { $inc: { downvote: change }, $pull: { downvoters: voter } })
        } else {
            return CommentReply.findByIdAndUpdate(id, { $inc: { downvote: change }, $addToSet: { downvoters: voter } })
        }
    }
    export const onPostRemoved = function (id: mongoose.Types.ObjectId) {
        return CommentReply.findByIdAndUpdate(id, { article: null })
    }
    
}
        