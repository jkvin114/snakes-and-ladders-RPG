import express = require("express")
import {  ContentType,  voteController } from "./helpers"
import { loginauth, sessionParser } from "../jwt/auth"
const router = express.Router()

router.post("/vote", loginauth,sessionParser, async (req, res) => voteController(req,res,ContentType.REPLY))

module.exports = router
