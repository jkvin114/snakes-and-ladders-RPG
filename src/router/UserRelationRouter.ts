import express = require('express');
import session from 'express-session';
import { UserSchema } from '../mongodb/schemaController/User';
import { UserRelationSchema } from '../mongodb/schemaController/UserRelation';
import { ajaxauth, auth } from './board/helpers';
const {User} = require("../mongodb/UserDBSchema")

const router = express.Router()

router.post("/friend_request",ajaxauth,async function (req:express.Request,res:express.Response) {
    const id=await UserSchema.findIdByUsername(req.body.username)
    await UserRelationSchema.addFriend(req.session.userId,id)
    await UserRelationSchema.addFriend(id,req.session.userId)
    
    res.status(200).end()
})
router.post("/follow",ajaxauth,async function (req:express.Request,res:express.Response) {
    const id=await UserSchema.findIdByUsername(req.body.username)
    console.log(req.session.userId)
    console.log(id)
    let result= await UserRelationSchema.addFollow(req.session.userId,id)
    if(!result) console.error("follow failed")
    res.status(200).end()
})
router.post("/unfollow",ajaxauth,async function (req:express.Request,res:express.Response) {
    const id=await UserSchema.findIdByUsername(req.body.username)
    console.log(id)
    let result=await UserRelationSchema.deleteFollow(req.session.userId,id)
    if(!result) console.error("unfollow failed")
    res.status(200).end()
})
module.exports=router