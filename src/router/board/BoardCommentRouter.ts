import express = require("express")
import { ajaxauth, ContentType, voteController } from "./helpers"

import {CommentSchema} from "./schemaController/Comment"
const mongoose = require("mongoose")


const { User } = require("../../mongodb/DBHandler")
const router = express.Router()


router.post("/vote", ajaxauth, async (req, res) => voteController(req,res,ContentType.COMMENT))

module.exports = router
