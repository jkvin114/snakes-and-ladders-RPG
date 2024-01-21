import express = require("express")
import { ControllerWrapper } from "./ControllerWrapper"
const router = express.Router()
import type { Request, Response } from "express"
import { ISession } from "../session/inMemorySession"
import { loginauth, sessionParser } from "./jwt/auth"
import { ChatRoomSchema } from "../mongodb/schemaController/ChatRoom"
import { ChatRoomJoinStatusSchema } from "../mongodb/schemaController/ChatJoinStatus"

import { UserSchema } from "../mongodb/schemaController/User"
import { ChatMessageSchema } from "../mongodb/schemaController/ChatMessage"
import { IChatRoom } from "../mongodb/ChattingSchema"
import { UserCache } from "../cache/cache"

const MAX_MESSAGE_FETCH = 20

/**
 * return list of rooms (id,name) that the user is in
 */
router.get(
	"/rooms",
	loginauth,
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		const roomstatuses = await ChatRoomJoinStatusSchema.findByUserPopulated(session.userId)
		let result: any[] = []
		for (const status of roomstatuses) {
			let lastmsg = ""
			if (status.lastSerial !== status.room.serial) {
				const lastMessage = await ChatMessageSchema.findOneFromSerial( (status.room as any)._id, status.room.serial)
				if (lastMessage.length > 0) lastmsg = lastMessage[0].content
			}
			result.push({
				_id: (status.room as any)._id,
				name: status.room.name,
				size: status.room.size,
                serial: status.room.serial - status.lastSerial,
				admin: status.room.admin,
				opponent: status.room.opponent,
				lastMessage: lastmsg,
			})
		}
		res.json(result)
	})
)

/**
 * return list of users (id,name,profileimage,email) that the user is in
 */
router.get(
	"/users/:roomid",
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		const roomid = req.params.roomid
		const users = await ChatRoomJoinStatusSchema.findByRoomPopulated(roomid)
		res.json(users)
	})
)

/**
 * fetch messages until serial from (serial - MAX_FETCH_SIZE)
 */
router.get(
	"/message/:roomid",
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		const roomid = req.params.roomid
		const room = await ChatRoomSchema.findById(roomid)
		if (!room) {
			res.status(404).send("invalid room")
			return
		}
		if (!req.query.serial) {
			const messages = await ChatMessageSchema.findAllFromSerial(roomid, room.serial - MAX_MESSAGE_FETCH)
			res.json(messages)
			return
		}

		let serial = Number(req.query.serial)
		if (isNaN(serial)) {
			res.status(400).send("invalid serial number")
			return
		}
		const messages = await ChatMessageSchema.findAllBetweenSerial(roomid, serial - MAX_MESSAGE_FETCH, serial)
		res.json(messages)
	})
)

/**
 * create a room using a list of user ids. those users will be joined to this room, including current user as admin
 *
 * {users,name}
 */
router.post(
	"/room",
	loginauth,
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		let body = req.body
		let users = body.users

		//if the room size is 2(only one user invited), prevent creating duplicate room
		if (users.length === 1) {
			const duproom = await ChatRoomSchema.isDuplicateWithSize2(session.userId, users[0])
			if (duproom.length > 0) {
				res
					.status(200)
					.json({
						id: duproom[0]._id,
						name: duproom[0].name,
					})
					.end()

				return
			}
		}

		const room = await ChatRoomSchema.create(session.userId, body.name)

		//if the room size is 2(only one user invited),
		//save id of both users in the room to make future search easier
		if (users.length === 1) {
			await ChatRoomSchema.setOpponent(room._id, users[0])
		}

		await ChatRoomJoinStatusSchema.join(room._id, session.userId)
		await ChatRoomSchema.onUserJoin(room._id)

		if (users) {
			let joined = new Set<string>([session.userId])
			for (const id of users) {
				//prevent one user joining same room twice
				if (joined.has(id)) continue
				joined.add(id)
				await ChatRoomJoinStatusSchema.join(room._id, id)
				await ChatRoomSchema.onUserJoin(room._id)
			}
		}

		res
			.status(201)
			.json({
				id: room._id,
				name: room.name,
			})
			.end()
	})
)

/**
 * join to a room using room id
 *
 * {room}
 */
router.post(
	"/room/join",
	loginauth,
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		const roomid = req.body.room
		if (!(await ChatRoomSchema.findById(roomid))) {
			res.status(404).send("invalid room")
			return
		}
		if (await ChatRoomJoinStatusSchema.isUserInRoom(session.userId, roomid)) {
			res.status(204).send("already in room")
			return
		}
		await ChatRoomJoinStatusSchema.join(roomid, session.userId)
		await ChatRoomSchema.onUserJoin(roomid)
	})
)

/**
 * quit room using room id
 *
 * {room}
 */
router.post(
	"/room/quit",
	loginauth,
	sessionParser,
	ControllerWrapper(async function (req: Request, res: Response, session: ISession) {
		const roomid = req.body.room
		delete session.currentChatRoom

		let change = await ChatRoomJoinStatusSchema.left(roomid, session.userId)
		if (change) {
			await ChatRoomSchema.onUserLeft(roomid)
		} else {
			res.status(404).send("invalid room")
		}
	})
)

module.exports = router
