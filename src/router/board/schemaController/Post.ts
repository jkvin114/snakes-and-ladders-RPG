import {Article } from "../../../mongodb/BoardDBSchemas"
import type mongoose from "mongoose"

 
export namespace PostSchema{
        
    export const countDocuments = function (data:any) {
        return Article.countDocuments(data)
    }
    export const create = function (data:any) {
        return new Article(data).save()
    }
    export const findOneById = function (id: mongoose.Types.ObjectId) {
        return Article.findById(id)
    }
    export const getUrlById = function (id: mongoose.Types.ObjectId) {
        return Article.findById(id).select("articleId")
    }
    export const findOneByArticleId = function (id: number) {
        return Article.findOne({ articleId: id })
    }
    export const findOneByArticleIdWithComment = function (id: number) {
        return Article.findOne({ articleId: id }).populate("comments")
    }
    export const findSummaryByRange = function (start: number, count: number) {
        //   console.log(count)    //asc, desc  or 1, -1
        return Article.find({ deleted: false, uploaded: true })
            .sort({ createdAt: "desc" })
            .skip(start)
            .limit(count)
            .select("createdAt articleId title views upvote downvote imagedir commentCount authorName")
    }
    export const findTitleOfUserByRange = function (
        start: number,
        count: number,
        author: mongoose.Types.ObjectId
    ) {
        //   console.log(count)    //asc, desc  or 1, -1
        return Article.find({ deleted: false, uploaded: true, author: author })
            .sort({ createdAt: "desc" })
            .skip(start)
            .limit(count)
            .select("createdAt articleId title views upvote downvote imagedir commentCount authorName")
    }
    export const update = function (url: number, title: string, content: string) {
        return Article.findOneAndUpdate({ articleId: url }, { title: title, content: content })
    }
    export const updateImage = function (url: number, image: string) {
        return Article.findOneAndUpdate({ articleId: url }, { imagedir: image })
    }
    export const incrementView = function (id: mongoose.Types.ObjectId) {
        return Article.findOneAndUpdate({ articleId: id }, { $inc: { views: 1 } })
    }

    export const changeUpvote = function (id: mongoose.Types.ObjectId, change:number, voter: mongoose.Types.ObjectId) {
        if (change < 0) {
            return Article.findByIdAndUpdate(id, { $inc: { upvote: change }, $pull: { upvoters: voter } })
        } else {
            return Article.findByIdAndUpdate(id, { $inc: { upvote: change }, $addToSet: { upvoters: voter } })
        }
    }

    export const changeDownvote = function (id: mongoose.Types.ObjectId, change:number, voter: mongoose.Types.ObjectId) {
        if (change < 0) {
            return Article.findByIdAndUpdate(id, { $inc: { downvote: change }, $pull: { downvoters: voter } })
        } else {
            return Article.findByIdAndUpdate(id, { $inc: { downvote: change }, $addToSet: { downvoters: voter } })
        }
    }
    export const getVotersById = function (id: mongoose.Types.ObjectId) {
        return Article.findById(id).select("upvoters downvoters")
    }
    export const remove = function (id: mongoose.Types.ObjectId) {
        return Article.findByIdAndUpdate(id, { deleted: true })
    }
    export const addComment = function (id: mongoose.Types.ObjectId, commentId: mongoose.Types.ObjectId) {
        return Article.findByIdAndUpdate(id, { $inc: { commentCount: 1 }, $addToSet: { comments: commentId } })
    }
    export const removeComment = function (id: mongoose.Types.ObjectId) {
        return Article.findByIdAndUpdate(id, { $inc: { commentCount: -1 } })
    }
    export const addReply = function (id: mongoose.Types.ObjectId) {
        return Article.findByIdAndUpdate(id, { $inc: { commentCount: 1 } })
    }
    export const removeReply = function (id: mongoose.Types.ObjectId) {
        return Article.findByIdAndUpdate(id, { $inc: { commentCount: -1 } })
    }
    export const getComments = function (id: mongoose.Types.ObjectId) {
        return Article.findById(id).select("comments").populate("comments")
    }
}