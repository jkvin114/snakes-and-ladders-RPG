import {CommentReply } from "../../../mongodb/BoardDBSchemas"
import type mongoose from "mongoose"

 
export namespace ReplySchema{
    export const create = async function (data:any) {
        return await new CommentReply(data).save()
    }
    export const remove = async function (id: mongoose.Types.ObjectId) {
        return await CommentReply.findByIdAndDelete(id)
    }
    export const findOneById = async function (id: mongoose.Types.ObjectId) {
        return await CommentReply.findById(id)
    }
    export const getVotersById = async function (id: mongoose.Types.ObjectId) {
        return await CommentReply.findById(id).select("upvoters downvoters")
    }
    
    export const findOfUserByRange = async function (
        start: number,
        count: number,
        author: mongoose.Types.ObjectId,
        sortby: string
    ) {
        //   console.log(count)    //asc, desc  or 1, -1
        if (sortby === "old") {
            return await CommentReply.find({ deleted: false, uploaded: true, author: author }).skip(start).limit(count)
        } else if (sortby === "upvote") {
            return await CommentReply.find({ deleted: false, uploaded: true, author: author })
                .sort({ upvote: "desc",createdAt: "desc" })
                .skip(start)
                .limit(count)
        } else {
            return await CommentReply.find({ deleted: false, uploaded: true, author: author })
                .sort({ createdAt: "desc" })
                .skip(start)
                .limit(count)
        }
    }
    
    export const changeUpvote = async function (id: mongoose.Types.ObjectId, change:number, voter: mongoose.Types.ObjectId) {
        if (change < 0) {
            return await CommentReply.findByIdAndUpdate(id, { $inc: { upvote: change }, $pull: { upvoters: voter } })
        } else {
            return await CommentReply.findByIdAndUpdate(id, { $inc: { upvote: change }, $addToSet: { upvoters: voter } })
        }
    }
    
    export const changeDownvote = async function (id: mongoose.Types.ObjectId, change:number, voter: mongoose.Types.ObjectId) {
        if (change < 0) {
            return await CommentReply.findByIdAndUpdate(id, { $inc: { downvote: change }, $pull: { downvoters: voter } })
        } else {
            return await CommentReply.findByIdAndUpdate(id, { $inc: { downvote: change }, $addToSet: { downvoters: voter } })
        }
    }
    export const onPostRemoved = async function (id: mongoose.Types.ObjectId) {
        return await CommentReply.findByIdAndUpdate(id, { article: null })
    }
    
}
        