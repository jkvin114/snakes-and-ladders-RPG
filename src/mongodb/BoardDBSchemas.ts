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
		authorName: String,
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
		views: Number,
		imagedir: String,
		upvote: Number,
		downvote: Number,
		deleted: Boolean,
		uploaded: Boolean,
		category: Number,
		articleId: Number,
		commentCount: Number
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
			type: mongoose.Types.ObjectId
		},
		author: {
			required: true,
			type: mongoose.Types.ObjectId,
			ref: "User"
		},
		authorName: String,
		reply: [
			{
				type: mongoose.Types.ObjectId,
				ref: "CommentReply"
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
		deleted: Boolean,
		replyCount: Number
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
			type: mongoose.Types.ObjectId
		},
		comment: {
			required: true,
			type: mongoose.Types.ObjectId
		},
		author: {
			required: true,
			type: mongoose.Types.ObjectId,
			ref: "User"
		},
		authorName: String,
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
	articles: [
		{
			type: mongoose.Types.ObjectId,
			ref: "Article"
		}
	],
	comments: [
		{
			type: mongoose.Types.ObjectId,
			ref: "Comment"
		}
	],
	replys: [
		{
			type: mongoose.Types.ObjectId,
			ref: "CommentReply"
		}
	],
	upvotedArticles: [
		{
			type: mongoose.Types.ObjectId,
			ref: "Article"
		}
	],
	upvotedContents: [
		{
			type: mongoose.Types.ObjectId,
		}
	],
	downvotedContents: [
		{
			type: mongoose.Types.ObjectId,
		}
	],
	bookmarks: [
		{
			type: mongoose.Types.ObjectId,
			ref: "Article"
		}
	],
	username: String
})

const UserBoardData = mongoose.model("UserBoardData", userBoardDataSchema)
const Comment = mongoose.model("Comment", commentSchema)
const CommentReply = mongoose.model("CommentReply", commentReplySchema)
const Article = mongoose.model("Article", articleSchema)

export { UserBoardData, Comment, Article, CommentReply }
