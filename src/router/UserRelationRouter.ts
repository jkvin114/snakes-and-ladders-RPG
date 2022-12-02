import express = require('express');
import session from 'express-session';
import { ajaxauth, auth } from './board/helpers';
const {User} = require("../mongodb/DBHandler")

const router = express.Router()

router.post("/friend_request",ajaxauth,async function (req:express.Request,res:express.Response) {
    let username=req.body.username
    const user=await User.findIdByUsername(username)
    await User.addFriend(req.session.userId,user._id)
    await User.addFriend(user._id,req.session.userId)
    
    res.status(200).end()
})
router.post("/follow",ajaxauth,async function (req:express.Request,res:express.Response) {
    let username=req.body.username
    const user=await User.findIdByUsername(username)
    await User.addFollow(req.session.userId,user._id)
    res.status(200).end()
})
router.post("/unfollow",ajaxauth,async function (req:express.Request,res:express.Response) {
    let username=req.body.username
    const user=await User.findIdByUsername(username)
    await User.deleteFollow(req.session.userId,user._id)
    res.status(200).end()
})
module.exports=router