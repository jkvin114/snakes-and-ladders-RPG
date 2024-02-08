
import { ControllerWrapper } from './ControllerWrapper';
import { loginauth, sessionParser } from './jwt/auth';
import { UserController } from './user/controller';
import express = require("express")
import { Router } from 'express';
import { FriendController } from './user/friendController';

const router = Router()
router.get("/friend_status",loginauth,sessionParser,ControllerWrapper(FriendController.getFriendStatus))

router.get("/friend_search",loginauth,sessionParser,ControllerWrapper(FriendController.friendSearch))

router.post("/friend_request",loginauth,sessionParser,ControllerWrapper(UserController.addFriend))

router.post("/follow",loginauth,sessionParser,ControllerWrapper(UserController.follow))
router.post("/unfollow",loginauth,sessionParser,ControllerWrapper(UserController.unfollow))
module.exports=router