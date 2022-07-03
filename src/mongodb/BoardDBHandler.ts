import mongoose from "mongoose"

const articleSchema = new mongoose.Schema(
	{
		title: {
			required: true,
			type: String
		},
		content: {
			required: true,
			type: String
		},
		author: {
			required: true,
			type: mongoose.Types.ObjectId,
			ref: "User"
		},
		comments: [
			{
				type: mongoose.Types.ObjectId,
				ref: "Comment"
			}
		],
		upvoters: [
			{
				type: mongoose.Types.ObjectId,
				ref: "User"
			}
		],
		downvoters: [
			{
				type: mongoose.Types.ObjectId,
				ref: "User"
			}
		],
        views:Number,
		imagedir: String,
		upvote: Number,
		downvote: Number,
		deleted: Boolean,
		uploaded: Boolean,
		category: Number,
		articleId: Number
	},
	{ timestamps: true }
)

const commentSchema = new mongoose.Schema(
	{
		content: {
			required: true,
			type: String
		},
		article: {
			required: true,
			type: mongoose.Types.ObjectId
		},
		author: {
			required: true,
			type: mongoose.Types.ObjectId
		},
		reply: [
			{
				type: mongoose.Types.ObjectId,
				ref: "Reply"
			}
		],
		upvoters: [
			{
				type: mongoose.Types.ObjectId,
				ref: "User"
			}
		],
		downvoters: [
			{
				type: mongoose.Types.ObjectId,
				ref: "User"
			}
		],
		imagedir: String,
		upvote: Number,
		downvote: Number,
		deleted: Boolean
	},
	{ timestamps: true }
)

const commentReplySchema = new mongoose.Schema(
	{
		content: {
			required: true,
			type: String
		},
		article: {
			required: true,
			type: mongoose.Types.ObjectId
		},
		comment: {
			required: true,
			type: mongoose.Types.ObjectId
		},
		author: {
			required: true,
			type: mongoose.Types.ObjectId
		},
		upvote: Number,
		downvote: Number,
		deleted: Boolean,
		upvoters: [
			{
				type: mongoose.Types.ObjectId,
				ref: "User"
			}
		],
		downvoters: [
			{
				type: mongoose.Types.ObjectId,
				ref: "User"
			}
		],
		imagedir: String
	},
	{ timestamps: true }
)

const userBoardDataSchema = new mongoose.Schema({
	articles: [mongoose.Types.ObjectId],
	comments: [mongoose.Types.ObjectId],
	bookmarks: [mongoose.Types.ObjectId]
})

const UserBoardData = mongoose.model("UserBoardData", userBoardDataSchema)
const Comment = mongoose.model("Comment", commentSchema)
const CommentReply = mongoose.model("CommentReply", commentReplySchema)
const Article = mongoose.model("Article", articleSchema)
