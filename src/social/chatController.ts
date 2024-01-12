import type { Socket } from "socket.io"
import { UserCache } from "../cache/cache"
import { ChatMessageSchema } from "../mongodb/schemaController/ChatMessage"
import { ChatRoomSchema } from "../mongodb/schemaController/ChatRoom"
import { ChatRoomJoinStatusSchema } from "../mongodb/schemaController/ChatJoinStatus"
import { ISession, SessionManager } from "../session/inMemorySession"
import { NotificationSchema } from "../mongodb/schemaController/Notification"
import { NotificationController } from "./notificationController"


export function ChatControllerWrapper(socket:Socket,eventname:string,controller:(socket:Socket,session:ISession,...args:any[])=>Promise<void>){
	
	
	return (...args:any[])=>{
		console.log(eventname)
		console.log(args)
		const session = socket.data.session as ISession
		console.log(session.username)
		if(!session || !session.isLogined || !session.userId){
			socket.emit("chat:error",{
				eventname:eventname,
				message:"invalid session or unauthorized"
			})
			return
		}

		controller(socket,session,...args)
		.then(()=>{
			console.log(eventname+" success!")
		})
		.catch((e:Error)=>{
            console.error(e)
			socket.emit("chat:error",{
				eventname:eventname,
				message:e
			})
        })
	}
}


export namespace ChatController {
	const ROOM_NAME_PREFIX = "chatroom:"
	const MAX_MESSAGE_FETCH = 20
	export async function sendMessage(socket: Socket,session:ISession, roomId: string, message: string) {
		const sender = await UserCache.getUser(session.userId)
		const room = await ChatRoomSchema.findById(roomId)

		if (!sender || !room || !(await ChatRoomJoinStatusSchema.isUserInRoom(session.userId, roomId))) {
			console.error("invalid sender or room")
			return
		}

		let serial = await ChatRoomSchema.getSerial(roomId) + 1
		ChatMessageSchema.create(roomId, session.userId, message, serial)
		ChatRoomSchema.onPostMessage(roomId)

		let status = await ChatRoomJoinStatusSchema.findByRoom(roomId)
		let unreadCount = 0
		for (const member of status) {
			let memberId = String(member.user)
			if (memberId === session.userId || (SessionManager.hasSession(memberId) && SessionManager.getSessionByUserId(memberId).currentChatRoom === roomId))
			{
				ChatRoomJoinStatusSchema.updateLastReadSerial(roomId,memberId,serial)
			}
			unreadCount++
			//post notifications for unread users
			NotificationController.notifyChat(memberId,roomId,message,serial)
		}

		socket.broadcast.to(ROOM_NAME_PREFIX + roomId).emit("chat:message_received", {
			sender: sender,
			message: message,
			serial: serial,
			unreadCount:unreadCount
		})

		socket.emit("chat:message_sent", {
			sender: sender,
			message: message,
			serial: serial,
			unreadCount:unreadCount
		})

	}

	export async function enterRoom(socket: Socket,session:ISession, roomId: string, lastSerial?: number) {
		const receiver = await UserCache.getUser(session.userId)
		const room = await ChatRoomSchema.findById(roomId)
		const currentSerial = room.serial
		if (!receiver || !room || !(await ChatRoomJoinStatusSchema.isUserInRoom(session.userId, roomId))) {
			console.error("invalid receiver or room")
			return
		}
		socket.join(ROOM_NAME_PREFIX + roomId)
		const status = await ChatRoomJoinStatusSchema.findOne(roomId,session.userId)
		const serverLastSerial = status.lastSerial?status.lastSerial:0

		const targetSerial = Math.min(serverLastSerial,lastSerial)
		console.log(targetSerial)
		let messageFromSerial = await ChatMessageSchema.findAllFromSerial(
			roomId,
			Math.max(targetSerial, currentSerial - MAX_MESSAGE_FETCH)
		)
		
		NotificationSchema.consumeChat(session.userId, roomId)
		ChatRoomJoinStatusSchema.updateLastReadSerial(roomId,session.userId,currentSerial)

		let userLastSerials = (await ChatRoomJoinStatusSchema.findByRoom(roomId)).map(d=>d.lastSerial)
		session.currentChatRoom = roomId
		
		socket.emit("chat:joined_room", {
			room: room,
			messages:messageFromSerial,
			userLastSerials:userLastSerials
		})
		socket.broadcast.emit("chat:user_join",{
			user:session.userId,
			userLastSerial:serverLastSerial
		})
	}
	export async function leaveRoom(socket: Socket,session:ISession, roomId: string) {
		socket.leave(ROOM_NAME_PREFIX + roomId)
		delete session.currentChatRoom
	}
	export async function quitRoom(socket: Socket,session:ISession, roomId: string) {
		socket.leave(ROOM_NAME_PREFIX + roomId)
		delete session.currentChatRoom

		let change = await ChatRoomJoinStatusSchema.left(roomId,session.userId)
		if(change)
		{
			ChatRoomSchema.onUserLeft(roomId)
			socket.broadcast.emit("chat:user_quit",{
				user:session.userId,
				username:session.username
			})
		}
			
	}
}
