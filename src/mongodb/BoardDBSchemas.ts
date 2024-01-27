import mongoose, { Types,Schema} from "mongoose"

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
			type: Schema.Types.ObjectId,
			ref: "User"
		},
		authorName: String,
		comments: [
			{
				type: Schema.Types.ObjectId,
				ref: "Comment"
			}
		],
		upvoters: [
			{
				type: Schema.Types.ObjectId,
				ref: "User"
			}
		],
		downvoters: [
			{
				type: Schema.Types.ObjectId,
				ref: "User"
			}
		],
		visibility: {
			type: String,
			enum : ['PUBLIC','FRIENDS','LINK_ONLY','PRIVATE'],
			default: 'PUBLIC'
		},
		views: Number,
		imagedir: String,
		upvote: Number,
		downvote: Number,
		deleted: Boolean,
		uploaded: Boolean,
		category: Number,
		articleId: Number,
		commentCount: Number,
		_id:Schema.Types.ObjectId,
		formattedContent:String //json formatted content using Quill.js
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
			type: Schema.Types.ObjectId
		},
		author: {
			required: true,
			type: Schema.Types.ObjectId,
			ref: "User"
		},
		authorName: String,
		reply: [
			{
				type: Schema.Types.ObjectId,
				ref: "CommentReply"
			}
		],
		upvoters: [
			{
				type: Schema.Types.ObjectId,
				ref: "User"
			}
		],
		downvoters: [
			{
				type: Schema.Types.ObjectId,
				ref: "User"
			}
		],
		visilibity: {
			type: String,
			enum : ['PUBLIC','SECRET'],
			default: 'PUBLIC'
		},
		imagedir: String,
		upvote: Number,
		downvote: Number,
		deleted: Boolean,
		replyCount: Number,
		_id:Schema.Types.ObjectId
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
			type: Schema.Types.ObjectId
		},
		comment: {
			required: true,
			type: Schema.Types.ObjectId
		},
		author: {
			required: true,
			type: Schema.Types.ObjectId,
			ref: "User"
		},
		authorName: String,
		upvote: Number,
		downvote: Number,
		deleted: Boolean,
		upvoters: [
			{
				type: Schema.Types.ObjectId,
				ref: "User"
			}
		],
		downvoters: [
			{
				type: Schema.Types.ObjectId,
				ref: "User"
			}
		],visilibity: {
			type: String,
			enum : ['PUBLIC','SECRET'],
			default: 'PUBLIC'
		},
		imagedir: String,
		_id:Schema.Types.ObjectId
	},
	{ timestamps: true }
)

const userBoardDataSchema = new mongoose.Schema({
	articles: [
		{
			type: Schema.Types.ObjectId,
			ref: "Article"
		}
	],
	comments: [
		{
			type: Schema.Types.ObjectId,
			ref: "Comment"
		}
	],
	replys: [
		{
			type: Schema.Types.ObjectId,
			ref: "CommentReply"
		}
	],
	upvotedArticles: [
		{
			type: Schema.Types.ObjectId,
			ref: "Article"
		}
	],
	upvotedContents: [
		{
			type: Schema.Types.ObjectId,
		}
	],
	downvotedContents: [
		{
			type: Schema.Types.ObjectId,
		}
	],
	bookmarks: [
		{
			type: Schema.Types.ObjectId,
			ref: "Article"
		}
	],
	username: String,
	_id:Types.ObjectId
})

const UserBoardData = mongoose.model("UserBoardData", userBoardDataSchema)
const Comment = mongoose.model("Comment", commentSchema)
const CommentReply = mongoose.model("CommentReply", commentReplySchema)
const Article = mongoose.model("Article", articleSchema)


export { userBoardDataSchema,articleSchema,commentSchema,commentReplySchema,UserBoardData, Comment, Article, CommentReply }
