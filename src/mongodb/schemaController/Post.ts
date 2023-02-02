import {Article } from "../BoardDBSchemas"
import type mongoose from "mongoose"
import { SchemaTypes } from "../SchemaTypes"

 
export namespace PostSchema{
        
    export const countDocuments = async function (data:any) {
        return await Article.countDocuments(data)
    }
    export const create = async function (data:any) {
        return await new Article(data).save()
    }
    export const findOneById = async function (id: mongoose.Types.ObjectId) {
        return await Article.findById(id).populate<{ comments:SchemaTypes.Comment[]}>("comments")
    }
    export const getUrlById = async function (id: mongoose.Types.ObjectId) {
        return await Article.findById(id).select("articleId")
    }
    export const findOneByArticleId = async function (id: number) {
        return await Article.findOne({ articleId: id })
    }
    export const findMultipleByIdList = async function (id: mongoose.Types.ObjectId[]) {
        return await Article.find({ _id:{$in:id}}).select("createdAt articleId title views upvote downvote imagedir commentCount authorName author visibility")
    }
    export const findOneByArticleIdWithComment = async function (id: number) {
        return await Article.findOne({ articleId: id }).populate<{ comments:SchemaTypes.Comment[]}>("comments")
    }
    export const findSummaryByRange = async function (start: number, count: number) {
        //   console.log(count)    //asc, desc  or 1, -1
        return await Article.find({ deleted: false, uploaded: true })
            .sort({ createdAt: "desc" })
            .skip(start)
            .limit(count)
            .select("createdAt articleId title views upvote downvote imagedir commentCount authorName author visibility")
    }
    export const findPublicSummaryByRange = async function (start: number, count: number) {
        //   console.log(count)    //asc, desc  or 1, -1
        return await Article.find({ deleted: false, uploaded: true,$or:[{visibility:{ $exists: false}},{visibility:"PUBLIC"}]})
            .sort({ createdAt: "desc" })
            .skip(start)
            .limit(count)
            .select("createdAt articleId title views upvote downvote imagedir commentCount authorName author visibility")
    }
    export const findSummaryOfUserByRange = async function (
        start: number,
        count: number,
        author: mongoose.Types.ObjectId
    ) {
        //   console.log(count)    //asc, desc  or 1, -1
        return await Article.find({ deleted: false, uploaded: true, author: author })
            .sort({ createdAt: "desc" })
            .skip(start)
            .limit(count)
            .select("createdAt articleId title views upvote downvote imagedir commentCount authorName author visibility")
    }
    export const update = async function (url: number, title: string, content: string,visibility:string) {
        return await Article.findOneAndUpdate({ articleId: url }, { title: title, content: content,visibility:visibility })
    }
    export const updateImage = async function (url: number, image: string) {
        return await Article.findOneAndUpdate({ articleId: url }, { imagedir: image })
    }
    export const incrementView = async function (id: number) {
        return await Article.findOneAndUpdate({ articleId: id }, { $inc: { views: 1 } })
    }

    export const changeUpvote = async function (id: mongoose.Types.ObjectId, change:number, voter: mongoose.Types.ObjectId) {
        if (change < 0) {
            return await Article.findByIdAndUpdate(id, { $inc: { upvote: change }, $pull: { upvoters: voter } })
        } else {
            return await Article.findByIdAndUpdate(id, { $inc: { upvote: change }, $addToSet: { upvoters: voter } })
        }
    }

    export const changeDownvote = async function (id: mongoose.Types.ObjectId, change:number, voter: mongoose.Types.ObjectId) {
        if (change < 0) {
            return await Article.findByIdAndUpdate(id, { $inc: { downvote: change }, $pull: { downvoters: voter } })
        } else {
            return await Article.findByIdAndUpdate(id, { $inc: { downvote: change }, $addToSet: { downvoters: voter } })
        }
    }
    export const getVotersById = async function (id: mongoose.Types.ObjectId) {
        return await Article.findById(id).select("upvoters downvoters")
    }
    export const remove = async function (id: mongoose.Types.ObjectId) {
        return await Article.findByIdAndUpdate(id, { deleted: true })
    }
    export const addComment = async function (id: mongoose.Types.ObjectId, commentId: mongoose.Types.ObjectId) {
        return await Article.findByIdAndUpdate(id, { $inc: { commentCount: 1 }, $addToSet: { comments: commentId } })
    }
    export const removeComment = async function (id: mongoose.Types.ObjectId) {
        return await Article.findByIdAndUpdate(id, { $inc: { commentCount: -1 } })
    }
    export const addReply = async function (id: mongoose.Types.ObjectId) {
        return await Article.findByIdAndUpdate(id, { $inc: { commentCount: 1 } })
    }
    export const removeReply = async function (id: mongoose.Types.ObjectId) {
        return await Article.findByIdAndUpdate(id, { $inc: { commentCount: -1 } })
    }
    export const getComments = async function (id: mongoose.Types.ObjectId) {
        return await Article.findById(id).select("comments").populate<{ comments:SchemaTypes.Comment[]}>("comments")
    }
}