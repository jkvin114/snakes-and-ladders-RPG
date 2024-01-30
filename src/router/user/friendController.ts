import mongoose from "mongoose"
import { UserCache } from "../../cache/cache"
import { UserRelationSchema } from "../../mongodb/schemaController/UserRelation"
import { ISession, SessionManager } from "../../session/inMemorySession"
import { IFriendStatus } from "../ResponseModel"
import type { Request, Response } from "express"

export namespace FriendController {
	export async function getFriendStatus(req: Request, res: Response, session: ISession) {
		const friendIds = await UserRelationSchema.findFriends(session.userId)
		let friends: IFriendStatus[] = []
		for (const id of friendIds) {
			if (String(id) === session.userId) continue
			let user = await UserCache.getUser(id as mongoose.Types.ObjectId)
			let status = SessionManager.getStatus(id as mongoose.Types.ObjectId)

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
}
