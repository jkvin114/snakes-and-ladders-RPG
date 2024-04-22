import mongoose from "mongoose"
import { FriendRequestCache, UserCache } from "../../cache/cache"
import { UserRelationSchema } from "../../mongodb/schemaController/UserRelation"
import {  SessionManager } from "../../session"
import { ISession } from "../../session/ISession"

import { IFriend, IFriendStatus } from "../ResponseModel"
import type { Request, Response } from "express"
import { UserSchema } from "../../mongodb/schemaController/User"
import { NotificationController } from "../../social/notificationController"

export namespace FriendController {
	export async function getFriendStatus(req: Request, res: Response, session: ISession) {
		const friendIds = await UserRelationSchema.findFriends(session.userId)
		let friends: IFriendStatus[] = []
		for (const id of friendIds) {
			if (String(id) === session.userId) continue
			let user = await UserCache.getUser(id as mongoose.Types.ObjectId)
			let status =await SessionManager.getStatus(id as mongoose.Types.ObjectId)

			let lastactive = status[0] ? status[0].valueOf() : null

			if (!lastactive) lastactive = user.lastActive

			friends.push({
				_id: String(id),
				username: user.username,
				profileImgDir: user.profileImgDir,
				status: status[1],
				lastActive: lastactive,
			})
		}
		res.json(friends).end()
	}
	export async function addFriend(req: Request, res: Response, session: ISession) {
		const id = await UserSchema.findIdByUsername(req.body.username)
		
		if(!id || String(id) === session.userId){
			res.status(400).end("invaild username")
			return
		}
		if(!FriendRequestCache.remove(id,session.userId)){
			res.status(401).end("no friend request was made")
			return
		}

		await UserRelationSchema.addFriend(session.userId, id)
		await UserRelationSchema.addFriend(id, session.userId)
	}

	/**
	 * accept senderid's friend request to me
	 * @param req 
	 * @param res 
	 * @param session 
	 * @returns 
	 */
	export async function acceptFriendRequest(req: Request, res: Response, session: ISession) {
		const id = req.body.senderId

		if(!id){
			res.status(400).end("Invaild senderId")
			return
		}
		if(!FriendRequestCache.remove(id,session.userId)){
			res.status(401).end("No friend request was made")
			return
		}

		await UserRelationSchema.addFriend(session.userId, id)
		await UserRelationSchema.addFriend(id, session.userId)
	}

	/**
	 * send friend request to username
	 * @param req 
	 * @param res 
	 * @param session 
	 * @returns 
	 */
	export async function sendFriendRequest(req: Request, res: Response, session: ISession) {
		const id = await UserSchema.findIdByUsername(req.body.username)
		
		if(!id || String(id) === session.userId){
			res.status(400).end("invaild username")
			return
		}
		FriendRequestCache.add(session.userId,id)
		await NotificationController.sendFriendRequest(id,session.userId,session.username)
	}

	/**
	 * reject senderid's friend request to me
	 * @param req 
	 * @param res 
	 * @param session 
	 * @returns 
	 */
	export async function rejectFriendRequest(req: Request, res: Response, session: ISession) {
		const id = req.body.senderId

		if(!id){
			res.status(400).end("invaild senderId")
			return
		}
		FriendRequestCache.remove(id,session.userId)
		await NotificationController.deleteFriendRequest(session.userId,id)
	}


	export async function friendSearch(req: Request, res: Response, session: ISession) {
		const searchStr = req.query.search
		const matchedUsers = await UserSchema.searchByName(String(searchStr))
		const friendIds = await UserRelationSchema.findFriends(session.userId)
		const friends = new Set<string>(friendIds.map(id=>String(id)))
		const requested = FriendRequestCache.getRequested(session.userId)
		let data: IFriend[] = []
		for (const fr of matchedUsers) {
			let status = ""
			if (friends.has(String(fr._id))) 
				status = "friend"
			if (requested && requested.has(String(fr._id))) 
				status = "friend_requested"

			data.push({
				username: fr.username,
				email: fr.email,
				profileImgDir: fr.profileImgDir,
				status: status,
				_id: fr.id,
			})
		}
		res.json(data).end()

	}
}
