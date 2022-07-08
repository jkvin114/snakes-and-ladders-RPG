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
	bookmarks: [
		{
			type: mongoose.Types.ObjectId,
			ref: "Article"
		}
	],
	username: String
})

userBoardDataSchema.statics.create = function (data) {
	return new UserBoardData(data).save()
}

userBoardDataSchema.statics.findOneById = function (id: mongoose.Types.ObjectId) {
	return this.findById(id)
}
userBoardDataSchema.statics.findOneByUsername = function (name) {
	return this.findOne({ username: name })
}
userBoardDataSchema.statics.getComments = function (id: mongoose.Types.ObjectId) {
	return this.findById(id).select("comments").populate("comments")
}
userBoardDataSchema.statics.getPosts = function (id: mongoose.Types.ObjectId) {
	return this.findById(id).select("articles").populate("articles")
}
userBoardDataSchema.statics.getReplys = function (id: mongoose.Types.ObjectId) {
	return this.findById(id).select("replys").populate("replys")
}
userBoardDataSchema.statics.addPost = function (id: mongoose.Types.ObjectId, articleId) {
	return this.findByIdAndUpdate(id, { $addToSet: { articles: articleId } })
}
userBoardDataSchema.statics.removePost = function (id: mongoose.Types.ObjectId, articleId) {
	return this.findByIdAndUpdate(id, { $pull: { articles: articleId } })
}

userBoardDataSchema.statics.addComment = function (id: mongoose.Types.ObjectId, comm) {
	return this.findByIdAndUpdate(id, { $addToSet: { comments: comm } })
}
userBoardDataSchema.statics.removeComment = function (id: mongoose.Types.ObjectId, comm) {
	return this.findByIdAndUpdate(id, { $pull: { comments: comm } })
}

userBoardDataSchema.statics.addReply = function (id: mongoose.Types.ObjectId, reply) {
	return this.findByIdAndUpdate(id, { $addToSet: { replys: reply } })
}
userBoardDataSchema.statics.removeReply = function (id: mongoose.Types.ObjectId, reply) {
	return this.findByIdAndUpdate(id, { $pull: { replys: reply } })
}

userBoardDataSchema.statics.addBookmark = function (id: mongoose.Types.ObjectId, bm) {
	return this.findByIdAndUpdate(id, { $addToSet: { bookmarks: bm } })
}
userBoardDataSchema.statics.removeBookmark = function (id: mongoose.Types.ObjectId, bm) {
	return this.findByIdAndUpdate(id, { $pull: { bookmarks: bm } })
}

//==========================================================================================

articleSchema.statics.create = function (data) {
	return new Article(data).save()
}
articleSchema.statics.findOneById = function (id: mongoose.Types.ObjectId) {
	return this.findById(id)
}
articleSchema.statics.getUrlById = function (id: mongoose.Types.ObjectId) {
	return this.findById(id).select("articleId")
}
articleSchema.statics.findOneByArticleId = function (id) {
	return this.findOne({ articleId: id })
}
articleSchema.statics.findOneByArticleIdWithComment = function (id) {
	return this.findOne({ articleId: id }).populate("comments")
}
articleSchema.statics.findTitleByRange = function (start: number, count: number) {
	//   console.log(count)    //asc, desc  or 1, -1
	return this.find({ deleted: false, uploaded: true })
		.sort({ createdAt: "desc" })
		.skip(start)
		.limit(count)
		.select("createdAt articleId title views upvote downvote imagedir commentCount authorName")
}
articleSchema.statics.findTitleOfUserByRange = function (
	start: number,
	count: number,
	author: mongoose.Types.ObjectId
) {
	//   console.log(count)    //asc, desc  or 1, -1
	return this.find({ deleted: false, uploaded: true, author: author })
		.sort({ createdAt: "desc" })
		.skip(start)
		.limit(count)
		.select("createdAt articleId title views upvote downvote imagedir commentCount authorName")
}
articleSchema.statics.update = function (url: number, title: string, content: string) {
	return this.findOneAndUpdate({ articleId: url }, { title: title, content: content })
}
articleSchema.statics.updateImage = function (url: number, image: string) {
	return this.findOneAndUpdate({ articleId: url }, { imagedir: image })
}
articleSchema.statics.incrementView = function (id) {
	return this.findOneAndUpdate({ articleId: id }, { $inc: { views: 1 } })
}

articleSchema.statics.changeUpvote = function (id, change, voter) {
	if (change < 0) {
		return this.findByIdAndUpdate(id, { $inc: { upvote: change }, $pullAll: { upvoters: voter } })
	} else {
		return this.findByIdAndUpdate(id, { $inc: { upvote: change }, $addToSet: { upvoters: voter } })
	}
}

articleSchema.statics.changeDownvote = function (id, change, voter) {
	if (change < 0) {
		return this.findByIdAndUpdate(id, { $inc: { downvote: change }, $pullAll: { downvoters: voter } })
	} else {
		return this.findByIdAndUpdate(id, { $inc: { downvote: change }, $addToSet: { downvoters: voter } })
	}
}
articleSchema.statics.getVotersById = function (id) {
	return this.findById(id).select("upvoters downvoters").populate("upvoters").populate("downvoters")
}
articleSchema.statics.delete = function (id: mongoose.Types.ObjectId) {
	return this.findByIdAndUpdate(id, { deleted: true })
}
articleSchema.statics.addComment = function (id: mongoose.Types.ObjectId, commentId) {
	return this.findByIdAndUpdate(id, { $inc: { commentCount: 1 }, $addToSet: { comments: commentId } })
}
articleSchema.statics.removeComment = function (id: mongoose.Types.ObjectId) {
	return this.findByIdAndUpdate(id, { $inc: { commentCount: -1 } })
}
articleSchema.statics.addReply = function (id: mongoose.Types.ObjectId) {
	return this.findByIdAndUpdate(id, { $inc: { commentCount: 1 } })
}
articleSchema.statics.removeReply = function (id: mongoose.Types.ObjectId) {
	return this.findByIdAndUpdate(id, { $inc: { commentCount: -1 } })
}
articleSchema.statics.getComments = function (id) {
	return this.findById(id).select("comments").populate("comments")
}
articleSchema.statics.delete = function (id: mongoose.Types.ObjectId) {
	return this.findByIdAndDelete(id)
}
//==========================================================================================
commentSchema.statics.create = function (data) {
	return new Comment(data).save()
}
commentSchema.statics.delete = function (id: mongoose.Types.ObjectId) {
	return this.findByIdAndUpdate(id, { deleted: true, content: "", upvoters: [], downvoters: [] })
}
commentSchema.statics.findOneById = function (id: mongoose.Types.ObjectId) {
	return this.findById(id)
}
commentSchema.statics.getReplyById = function (id: mongoose.Types.ObjectId) {
	return this.findById(id).select("reply").populate("reply").populate("author")
}
commentSchema.statics.addReply = function (id: mongoose.Types.ObjectId, commentId) {
	return this.findByIdAndUpdate(id, { $inc: { replyCount: 1 }, $addToSet: { reply: commentId } })
}
commentSchema.statics.removeReply = function (id: mongoose.Types.ObjectId, commentId) {
	return this.findByIdAndUpdate(id, { $inc: { replyCount: -1 }, $pull: { reply: commentId } })
}
commentSchema.statics.onPostRemoved = function (id: mongoose.Types.ObjectId) {
	return this.findByIdAndUpdate(id, { article: null })
}
commentSchema.statics.getVotersById = function (id) {
	return this.findById(id).select("upvoters downvoters").populate("upvoters").populate("downvoters")
}

commentSchema.statics.findOfUserByRange = function (
	start: number,
	count: number,
	author: mongoose.Types.ObjectId,
	sortby: string
) {
	// //   console.log(count)    //asc, desc  or 1, -1
	// return this.find({ deleted: false, uploaded: true,author:author})
	// 	.sort({ createdAt: "desc" })
	// 	.skip(start)
	// 	.limit(count)

	if (sortby === "old") {
		return this.find({ deleted: false, uploaded: true, author: author }).skip(start).limit(count)
	} else if (sortby === "upvote") {
		return this.find({ deleted: false, uploaded: true, author: author })
			.sort({ upvote: "desc",createdAt: "desc"  })
			.skip(start)
			.limit(count)
	} else {
		return this.find({ deleted: false, uploaded: true, author: author })
			.sort({ createdAt: "desc" })
			.skip(start)
			.limit(count)
	}
}

commentSchema.statics.changeUpvote = function (id, change, voter) {
	if (change < 0) {
		return this.findByIdAndUpdate(id, { $inc: { upvote: change }, $pullAll: { upvoters: voter } })
	} else {
		return this.findByIdAndUpdate(id, { $inc: { upvote: change }, $addToSet: { upvoters: voter } })
	}
}

commentSchema.statics.changeDownvote = function (id, change, voter) {
	if (change < 0) {
		return this.findByIdAndUpdate(id, { $inc: { downvote: change }, $pullAll: { downvoters: voter } })
	} else {
		return this.findByIdAndUpdate(id, { $inc: { downvote: change }, $addToSet: { downvoters: voter } })
	}
}
commentSchema.statics.cleanUpDeletedAndNoReply = function(){
	return this.find({deleted:true,reply:{$size:0}})
}
commentSchema.statics.cleanUp = function (id: mongoose.Types.ObjectId) {
	return this.findByIdAndDelete(id)
}

//==============================================================================================
commentReplySchema.statics.create = function (data) {
	return new CommentReply(data).save()
}
commentReplySchema.statics.delete = function (id: mongoose.Types.ObjectId) {
	return this.findByIdAndDelete(id)
}
commentReplySchema.statics.findOneById = function (id: mongoose.Types.ObjectId) {
	return this.findById(id)
}
commentReplySchema.statics.getVotersById = function (id) {
	return this.findById(id).select("upvoters downvoters").populate("upvoters").populate("downvoters")
}

commentReplySchema.statics.findOfUserByRange = function (
	start: number,
	count: number,
	author: mongoose.Types.ObjectId,
	sortby: string
) {
	//   console.log(count)    //asc, desc  or 1, -1
	if (sortby === "old") {
		return this.find({ deleted: false, uploaded: true, author: author }).skip(start).limit(count)
	} else if (sortby === "upvote") {
		return this.find({ deleted: false, uploaded: true, author: author })
			.sort({ upvote: "desc",createdAt: "desc" })
			.skip(start)
			.limit(count)
	} else {
		return this.find({ deleted: false, uploaded: true, author: author })
			.sort({ createdAt: "desc" })
			.skip(start)
			.limit(count)
	}
}

commentReplySchema.statics.changeUpvote = function (id, change, voter) {
	if (change < 0) {
		return this.findByIdAndUpdate(id, { $inc: { upvote: change }, $pullAll: { upvoters: voter } })
	} else {
		return this.findByIdAndUpdate(id, { $inc: { upvote: change }, $addToSet: { upvoters: voter } })
	}
}

commentReplySchema.statics.changeDownvote = function (id, change, voter) {
	if (change < 0) {
		return this.findByIdAndUpdate(id, { $inc: { downvote: change }, $pullAll: { downvoters: voter } })
	} else {
		return this.findByIdAndUpdate(id, { $inc: { downvote: change }, $addToSet: { downvoters: voter } })
	}
}
commentReplySchema.statics.onPostRemoved = function (id: mongoose.Types.ObjectId) {
	return this.findByIdAndUpdate(id, { article: null })
}

const UserBoardData = mongoose.model("UserBoardData", userBoardDataSchema)
const Comment = mongoose.model("Comment", commentSchema)
const CommentReply = mongoose.model("CommentReply", commentReplySchema)
const Article = mongoose.model("Article", articleSchema)

export { UserBoardData, Comment, Article, CommentReply }
