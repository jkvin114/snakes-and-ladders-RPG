import { UserBoardData } from "../../../mongodb/BoardDBSchemas"
import type mongoose from "mongoose"

export namespace UserBoardDataSchema{

    export const create = function (data:any){
        return new UserBoardData(data).save()
    }

    export const findOneById = function (id: mongoose.Types.ObjectId) {
        return UserBoardData.findById(id)
    }
    export const findOneByUsername = function (name:string) {
        return UserBoardData.findOne({ username: name })
    }
    export const getComments = function (id: mongoose.Types.ObjectId) {
        return UserBoardData.findById(id).select("comments").populate("comments")
    }
    export const getPosts = function (id: mongoose.Types.ObjectId) {
        return UserBoardData.findById(id).select("articles").populate("articles")
    }
    export const getReplys = function (id: mongoose.Types.ObjectId) {
        return UserBoardData.findById(id).select("replys").populate("replys")
    }
    
    export const addPost = function (id: mongoose.Types.ObjectId, articleId: mongoose.Types.ObjectId) {
        return UserBoardData.findByIdAndUpdate(id, { $addToSet: { articles: articleId } })
    }
    export const removePost = function (id: mongoose.Types.ObjectId, articleId: mongoose.Types.ObjectId) {
        return UserBoardData.findByIdAndUpdate(id, { $pull: { articles: articleId } })
    }

    export const addComment = function (id: mongoose.Types.ObjectId, comm: mongoose.Types.ObjectId) {
        return UserBoardData.findByIdAndUpdate(id, { $addToSet: { comments: comm } })
    }
    export const removeComment = function (id: mongoose.Types.ObjectId, comm: mongoose.Types.ObjectId) {
        return UserBoardData.findByIdAndUpdate(id, { $pull: { comments: comm } })
    }

    export const addReply = function (id: mongoose.Types.ObjectId, reply: mongoose.Types.ObjectId) {
        return UserBoardData.findByIdAndUpdate(id, { $addToSet: { replys: reply } })
    }
    export const removeReply = function (id: mongoose.Types.ObjectId, reply: mongoose.Types.ObjectId) {
        return UserBoardData.findByIdAndUpdate(id, { $pull: { replys: reply } })
    }

    export const addBookmark = function (id: mongoose.Types.ObjectId, bm: mongoose.Types.ObjectId) {
        return UserBoardData.findByIdAndUpdate(id, { $addToSet: { bookmarks: bm } })
    }
    export const removeBookmark = function (id: mongoose.Types.ObjectId, bm: mongoose.Types.ObjectId) {
        return UserBoardData.findByIdAndUpdate(id, { $pull: { bookmarks: bm } })
    }

    
    export const addUpvoteRecord = function (id: mongoose.Types.ObjectId, contentId: mongoose.Types.ObjectId) {
        return UserBoardData.findByIdAndUpdate(id, { $addToSet: { upvotedContents: contentId } })
    }
    export const deleteUpvoteRecord = function (id: mongoose.Types.ObjectId, contentId: mongoose.Types.ObjectId) {
        return UserBoardData.findByIdAndUpdate(id, { $pull: { upvotedContents: contentId } })
    }
    export const addDownvoteRecord = function (id: mongoose.Types.ObjectId, contentId: mongoose.Types.ObjectId) {
        return UserBoardData.findByIdAndUpdate(id, { $addToSet: { downvotedContents: contentId } })
    }
    export const deleteDownvoteRecord = function (id: mongoose.Types.ObjectId, contentId: mongoose.Types.ObjectId) {
        return UserBoardData.findByIdAndUpdate(id, { $pull: { downvotedContents: contentId } })
    }
    export const getVoteRecords=function(id: mongoose.Types.ObjectId){
        return UserBoardData.findById(id).select("upvotedContents downvotedContents")
    }

    export const postUpvote = function (id: mongoose.Types.ObjectId, articleId: mongoose.Types.ObjectId) {
        return UserBoardData.findByIdAndUpdate(id, { $addToSet: { upvotedArticles: articleId } })
    }
    export const cancelPostUpvote = function (id: mongoose.Types.ObjectId, articleId: mongoose.Types.ObjectId) {
        return UserBoardData.findByIdAndUpdate(id, { $pull: { upvotedArticles: articleId } })
    }
}