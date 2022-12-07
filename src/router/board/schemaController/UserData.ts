import { UserBoardData } from "../../../mongodb/BoardDBSchemas"
import type { Types } from "mongoose"
import { SchemaTypes } from "../../../mongodb/SchemaTypes"


export namespace UserBoardDataSchema{

    export const create = async function (data:any){
        
        return await new UserBoardData(data).save()
    }

    export const findOneById = async function (id: Types.ObjectId) {
        return await UserBoardData.findById(id)
    }
    export const findOneByUsername = async function (name:string) {
        return await UserBoardData.findOne({ username: name })
    }
    export const getComments = async function (id:  Types.ObjectId) {
        return await UserBoardData.findById(id).select("comments").populate<{ comments:SchemaTypes.Comment[]}>("comments")
    }
    export const getPosts = async function (id:  Types.ObjectId) {
        return await UserBoardData.findById(id).select("articles").populate<{ articles:SchemaTypes.Article[]}>("articles")
    }
    export const getReplys = async function (id:  Types.ObjectId) {
        return await UserBoardData.findById(id).select("replys").populate<{ replys:SchemaTypes.CommentReply[]}>("replys")
    }
    
    export const addPost = async function (id:  Types.ObjectId, articleId:  Types.ObjectId) {
        return await UserBoardData.findByIdAndUpdate(id, { $addToSet: { articles: articleId } })
    }
    export const removePost = async function (id:  Types.ObjectId, articleId:  Types.ObjectId) {
        return await UserBoardData.findByIdAndUpdate(id, { $pull: { articles: articleId } })
    }

    export const addComment = async function (id:  Types.ObjectId, comm:  Types.ObjectId) {
        return await UserBoardData.findByIdAndUpdate(id, { $addToSet: { comments: comm } })
    }
    export const removeComment = async function (id:  Types.ObjectId, comm:  Types.ObjectId) {
        return await UserBoardData.findByIdAndUpdate(id, { $pull: { comments: comm } })
    }

    export const addReply = async function (id:  Types.ObjectId, reply:  Types.ObjectId) {
        return await UserBoardData.findByIdAndUpdate(id, { $addToSet: { replys: reply } })
    }
    export const removeReply = async function (id:  Types.ObjectId, reply:  Types.ObjectId) {
        return await UserBoardData.findByIdAndUpdate(id, { $pull: { replys: reply } })
    }

    export const addBookmark = async function (id:  Types.ObjectId, bm: string) {
        return await UserBoardData.findByIdAndUpdate(id, { $addToSet: { bookmarks: bm } })
    }
    export const removeBookmark = async function (id:  Types.ObjectId, bm: string) {
        return await UserBoardData.findByIdAndUpdate(id, { $pull: { bookmarks: bm } })
    }
    export const getBookmarks = async function (id:  Types.ObjectId) {
        return await UserBoardData.findById(id).select("bookmarks")
    }
    export const getLikedPosts = async function (id:  Types.ObjectId) {
        return await UserBoardData.findById(id).select("upvotedArticles")
    }
    export const addUpvoteRecord = async function (id:  Types.ObjectId, contentId:  Types.ObjectId) {
        return await UserBoardData.findByIdAndUpdate(id, { $addToSet: { upvotedContents: contentId } })
    }
    export const deleteUpvoteRecord = async function (id:  Types.ObjectId, contentId:  Types.ObjectId) {
        return await UserBoardData.findByIdAndUpdate(id, { $pull: { upvotedContents: contentId } })
    }
    export const addDownvoteRecord = async function (id:  Types.ObjectId, contentId:  Types.ObjectId) {
        return await UserBoardData.findByIdAndUpdate(id, { $addToSet: { downvotedContents: contentId } })
    }
    export const deleteDownvoteRecord = async function (id:  Types.ObjectId, contentId:  Types.ObjectId) {
        return await UserBoardData.findByIdAndUpdate(id, { $pull: { downvotedContents: contentId } })
    }
    export const getVoteRecords=async function(id:  Types.ObjectId){
        return await UserBoardData.findById(id).select("upvotedContents downvotedContents")
    }

    export const postUpvote = async function (id:  Types.ObjectId, articleId:  Types.ObjectId) {
        return await UserBoardData.findByIdAndUpdate(id, { $addToSet: { upvotedArticles: articleId } })
    }
    export const cancelPostUpvote = async function (id:  Types.ObjectId, articleId:  Types.ObjectId) {
        return await UserBoardData.findByIdAndUpdate(id, { $pull: { upvotedArticles: articleId } })
    }
}