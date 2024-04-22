import type {ISession} from "../../session/ISession"
import type { Request, Response } from "express"
import { UserBoardDataSchema } from "../../mongodb/schemaController/UserData"
import { UserRelationSchema } from "../../mongodb/schemaController/UserRelation"
import { UserSchema } from "../../mongodb/schemaController/User"
import mongoose from "mongoose"
import { IFollow, IFriend } from "../ResponseModel"
import { UserGamePlaySchema } from "../../mongodb/schemaController/UserGamePlay"
import { Logger } from "../../logger"
import { FriendRequestCache } from "../../cache"

export namespace UserController {
	export async function getProfile(req: Request, res: Response, session: ISession) {
		const user = await UserSchema.findOneByUsername(req.params.username)
		if (!user) {
			Logger.warn("user not found: ",req.params.username)
			res.status(404).end()
			return
		}
		let isFriend = false
		let requestedFrield=false
		let isFollowing = false
		// console.log(user.boardData)
		const boardData = await UserBoardDataSchema.findOneById(user.boardData as mongoose.Types.ObjectId)
		
		const friendcount = await UserRelationSchema.friendCount(user._id)
		const followcount = await UserRelationSchema.followCount(user._id)
		const followercount = await UserRelationSchema.followerCount(user._id)
		const marblecount = await UserGamePlaySchema.count(user._id,"MARBLE")
		const rpgcount = await UserGamePlaySchema.count(user._id,"RPG")

		const counts = [
			friendcount,
			followcount,
			boardData? boardData.bookmarks.length:0,
			boardData? boardData.articles.length:0,
			boardData? boardData.comments.length + boardData.replys.length:0,
			boardData? boardData.upvotedArticles.length:0,
			followercount,
			marblecount,
			rpgcount
		]

		if (session.isLogined) {
			isFriend = await UserRelationSchema.isFriendWith(session.userId, user._id)
			isFollowing = await UserRelationSchema.isFollowTo(session.userId, user._id)
			if(!isFriend)
				requestedFrield = await FriendRequestCache.has(session.userId,user._id)
		}
		res.json({
			isFriend: isFriend,
			isFollowing: isFollowing,
			requestedFrield:requestedFrield,
			username: user.username,
			email: user.email,
			profile: user.profileImgDir,
			isme: session.isLogined && session.userId === String(user._id),
			isadmin: user.role === "admin" && session.isLogined && session.userId === String(user._id),
			isLogined: session.isLogined,
			counts: counts,
			id:String(user._id)
		})
	}

	
	export async function follow(req: Request, res: Response, session: ISession) {
		const id = await UserSchema.findIdByUsername(req.body.username)
		if (!id) throw Error("invaild username")
		let result = await UserRelationSchema.addFollow(session.userId, id)
		if (!result) console.error("follow failed")
	}
	export async function unfollow(req: Request, res: Response, session: ISession) {
		const id = await UserSchema.findIdByUsername(req.body.username)
		if (!id) throw Error("invaild username")
		let result = await UserRelationSchema.deleteFollow(session.userId, id)
		if (!result) console.error("unfollow failed")
	}

	export async function getFriend(req: Request, res: Response, session: ISession) {
		const user = await UserSchema.findOneByUsername(req.params.username)
		if (!user) {
			res.status(404).end()
			return
		}

		const friendIds = await UserRelationSchema.findFriends(user._id)

		const friends = await UserSchema.findAllSummaryByIdList(friendIds as mongoose.Types.ObjectId[])
		
		let data: IFriend[] = []
		const login = session.isLogined && session.userId
		const requested = login ?  await FriendRequestCache.getRequested(session.userId):null

		for (const fr of friends) {
			let status = ""
			if (login && (await UserRelationSchema.isFriendWith(session.userId, fr._id))) status = "friend"
			else if(requested && requested.has(String(fr._id))) status = "friend_requested"

			data.push({
				username: fr.username,
				email: fr.email,
				profileImgDir: fr.profileImgDir,
				status: status,
				_id: fr.id,
			})
		}

		res.json(data)
	}

	export async function getFollowing(req: Request, res: Response, session: ISession) {
		const user = await UserSchema.findOneByUsername(req.params.username)
		if (!user) {
			res.status(404).end()
			return
		}

		const followIds = await UserRelationSchema.findFollows(user._id)
		const follows = await UserSchema.findAllSummaryByIdList(followIds as mongoose.Types.ObjectId[])
		let data: IFollow[] = []
		const login = session.isLogined && session.userId
		for (const fr of follows) {
			let fol = false
			if (login && (await UserRelationSchema.isFollowTo(session.userId, fr._id))) fol = true
			data.push({
				username: fr.username,
				email: fr.email,
				profileImgDir: fr.profileImgDir,
				isMyFollowing: fol,
				_id: fr.id,
			})
		}

		res.json(data)
	}

	export async function getFollower(req: Request, res: Response, session: ISession) {
		const user = await UserSchema.findOneByUsername(req.params.username)
		if (!user) {
			res.status(404).end()
			return
		}

		const followIds = await UserRelationSchema.findFollowers(user._id)
		const follows = await UserSchema.findAllSummaryByIdList(followIds as mongoose.Types.ObjectId[])
		let data: IFollow[] = []
		const login = session.isLogined && session.userId
		for (const fr of follows) {
			let fol = false
			if (login && (await UserRelationSchema.isFollowTo(session.userId, fr._id))) fol = true
			data.push({
				username: fr.username,
				email: fr.email,
				profileImgDir: fr.profileImgDir,
				isMyFollowing: fol,
				_id: fr.id,
			})
		}
		res.json(data)
	}
}
