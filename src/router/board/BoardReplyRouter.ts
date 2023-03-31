import express = require("express")
import { ajaxauth, ContentType,  voteController } from "./helpers"
import { ReplySchema } from "../../mongodb/schemaController/Reply"
const mongoose = require("mongoose")


const { User } = require("../../mongodb/UserDBSchema")
const router = express.Router()

router.post("/vote", ajaxauth, async (req, res) => voteController(req,res,ContentType.REPLY))

module.exports = router
