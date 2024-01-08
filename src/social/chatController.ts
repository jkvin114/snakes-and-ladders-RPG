import type { Socket } from "socket.io"
import { UserCache } from "../cache/cache"
import { ChatMessageSchema } from "../mongodb/schemaController/ChatMessage"
import { ChatRoomSchema } from "../mongodb/schemaController/ChatRoom"
import { ChatRoomJoinStatusSchema } from "../mongodb/schemaController/ChatJoinStatus"
import { ISession, SessionManager } from "../session/inMemorySession"
import { ChatMessageQueueSchema } from "../mongodb/schemaController/ChatMessageQueue"
import { NotificationSchema } from "../mongodb/schemaController/Notification"

export namespace ChatController {
	const ROOM_NAME_PREFIX = "chatroom:"
	const MAX_MESSAGE_FETCH = 20
	export async function sendMessage(socket: Socket, roomId: string, message: string) {
		const session = socket.data.session as ISession
		const sender = await UserCache.getUser(session.userId)
		const room = await ChatRoomSchema.findById(roomId)

		if (!sender || !room || !(await ChatRoomJoinStatusSchema.isUserInRoom(session.userId, roomId))) {
			console.error("invalid sender or room")
			return
		}

		let serial = await ChatRoomSchema.getSerial(roomId)
		await ChatMessageSchema.create(roomId, session.userId, message, serial + 1)
		await ChatRoomSchema.onPostMessage(roomId)

		let status = await ChatRoomJoinStatusSchema.findByRoom(roomId)
		let unreadUserIds = []
		for (const member of status) {
			let memberId = String(member.user)
			if (memberId === session.userId || SessionManager.getSessionByUserId(memberId).currentChatRoom === roomId)
				continue

			await ChatMessageQueueSchema.create(memberId, roomId, message)
			unreadUserIds.push(memberId)

			await NotificationSchema.newChat(memberId, roomId, message, serial)
			//post notifications for users
		}
		socket.broadcast.to(ROOM_NAME_PREFIX + roomId).emit("chat:message", {
			sender: sender,
			message: message,
			serial: serial,
			unread: unreadUserIds,
		})
		socket.emit("chat:message_posted", {
			serial: serial,
			unread: unreadUserIds,
		})
	}

	export async function enterRoom(socket: Socket, roomId: string, lastSerial?: number) {
		const session = socket.data.session as ISession
		const receiver = await UserCache.getUser(session.userId)
		const room = await ChatRoomSchema.findById(roomId)
		const currentSerial = room.serial
		if (!receiver || !room || !(await ChatRoomJoinStatusSchema.isUserInRoom(session.userId, roomId))) {
			console.error("invalid receiver or room")
			return
		}
		await NotificationSchema.consumeChat(session.userId, roomId)
		socket.join(ROOM_NAME_PREFIX + roomId)
		let messageFromQueue = await ChatMessageQueueSchema.consume(session.userId, roomId)
		let messageFromSerial = await ChatMessageSchema.findAllFromSerial(
			roomId,
			Math.max(lastSerial, currentSerial - MAX_MESSAGE_FETCH)
		)

		session.currentChatRoom = roomId

		socket.emit("chat:joined_room", {
			room: room,
		})
	}
	export function quitRoom(socket: Socket, roomId: string) {
		socket.leave(ROOM_NAME_PREFIX + roomId)
		const session = socket.data.session
		delete session.currentChatRoom
	}
}
