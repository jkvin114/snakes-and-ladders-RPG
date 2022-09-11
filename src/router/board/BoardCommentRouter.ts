import express = require("express")
import { ajaxauth, auth, availabilityCheck, CommentSummary, COUNT_PER_PAGE, PostTitle, timestampToNumber } from "./helpers"

const {  Article, Comment, CommentReply } = require("../../mongodb/BoardDBHandler")
const mongoose = require("mongoose")


const { User } = require("../../mongodb/DBHandler")
const router = express.Router()


router.post("/vote", ajaxauth, async (req, res) => {
	const id = mongoose.Types.ObjectId(req.body.id)
	const voters = await Comment.getVotersById(id)
	const voter = await User.findById(req.session.userId)
	let change = 0
	if (req.body.type === "up") {
		await Comment.changeUpvote(id, 1, voter._id)
		change = 1
	} else if (req.body.type === "down") {
		await Comment.changeDownvote(id, 1, voter._id)
		change = 1
	} else {
		res.status(500).end()
	}
	res.status(200).json({ change: change })
})

module.exports = router
