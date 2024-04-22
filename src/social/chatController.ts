import type { Socket } from "socket.io"
import { UserCache } from "../cache/cache"
import { ChatMessageSchema } from "../mongodb/schemaController/ChatMessage"
import { ChatRoomSchema } from "../mongodb/schemaController/ChatRoom"
import { ChatRoomJoinStatusSchema } from "../mongodb/schemaController/ChatJoinStatus"
import {  SessionManager } from "../session"
import { ISession } from "../session/ISession"



import { NotificationSchema } from "../mongodb/schemaController/Notification"
import { NotificationController } from "./notificationController"
import { ChatMessageModel } from "../router/ResponseModel"


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
			// console.log(eventname+" success!")
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
	const notify=true
	export async function sendMessage(socket: Socket,session:ISession, roomId: string, message: string) {
		const sender = await UserCache.getUser(session.userId)
		const room = await ChatRoomSchema.findById(roomId)

		if (!sender || !room || !(await ChatRoomJoinStatusSchema.isUserInRoom(session.userId, roomId))) {
			console.error("invalid sender or room")
			return
		}

		let serial = await ChatRoomSchema.getSerial(roomId) + 1
		let messageObj = await ChatMessageSchema.create(roomId, session.userId, message, serial)
		ChatRoomSchema.onPostMessage(roomId).then()

		let status = await ChatRoomJoinStatusSchema.findByRoom(roomId)
		let unreadCount = 0

		for (const member of status) {
			let memberId = String(member.user)
			//read
			if (memberId === session.userId || (await SessionManager.hasSession(memberId) && await SessionManager.isUserInChatRoom(memberId,roomId)))
			{
				await ChatRoomJoinStatusSchema.updateLastReadSerial(roomId,memberId,serial)
				//console.log(SessionManager.getSessionByUserId(memberId).username + " read chat")
			}
			else{
				//unread
				unreadCount++
				
				//post notifications for unread users
				if(notify)
					NotificationController.notifyChat(memberId,roomId,message,serial,sender.username,sender.profileImgDir).then()
			}
			
		}
		let userLastSerials = (await ChatRoomJoinStatusSchema.findByRoom(roomId)).map(d=>d.lastSerial)

		socket.broadcast.to(ROOM_NAME_PREFIX + roomId).emit("chat:message_received", {
			username: sender.username,
			content: message,
			serial: serial,
			unread:unreadCount,
			createdAt:messageObj.createdAt.toISOString(),
			userLastSerials:userLastSerials
		} as ChatMessageModel)

		socket.emit("chat:message_sent", {
			username: sender.username,
			content: message,
			serial: serial,
			unread:unreadCount,
			createdAt:messageObj.createdAt.toISOString(),
			userLastSerials:userLastSerials
		} as ChatMessageModel)

	}

	export async function enterRoom(socket: Socket,session:ISession, roomId: string, lastSerial: number) {
		const receiver = await UserCache.getUser(session.userId)
		const room = await ChatRoomSchema.findById(roomId)
		const currentSerial = room.serial
		if (!receiver || !room || !(await ChatRoomJoinStatusSchema.isUserInRoom(session.userId, roomId))) {
			console.error("invalid receiver or room")
			return
		}
		socket.join(ROOM_NAME_PREFIX + roomId)
		const status = await ChatRoomJoinStatusSchema.findOne(roomId,session.userId)
		const serverLastSerial = status.lastSerial?(status.lastSerial):0

		const targetSerial = Math.min(serverLastSerial,lastSerial)+1
		let messageFromSerial = await ChatMessageSchema.findAllFromSerial(
			roomId,
			Math.max(targetSerial, currentSerial - MAX_MESSAGE_FETCH)
		)
		
		
		if(notify)
			NotificationSchema.deleteChat(session.userId, roomId).then()

		await ChatRoomJoinStatusSchema.updateLastReadSerial(roomId,session.userId,currentSerial)

		let userLastSerials = (await ChatRoomJoinStatusSchema.findByRoom(roomId)).map(d=>d.lastSerial)
		await SessionManager.onEnterChatRoom(session,roomId)

		let messages:ChatMessageModel[] = []

		for(const msg of messageFromSerial){
			let username = (await UserCache.getUser(msg.sender)).username
			messages.push({
				username:username,
				content: msg.content,
				serial: msg.serial,
				createdAt:msg.createdAt.toISOString(),
				unread:0
			} )
		}

		
		socket.emit("chat:joined_room", {
			room: room,
			messages:messages,
			userLastSerials:userLastSerials
		})
		socket.broadcast.emit("chat:user_join",{
			user:session.userId,
			userLastSerials:userLastSerials
		})
	}
	export async function leaveRoom(socket: Socket,session:ISession, roomId: string) {
		socket.leave(ROOM_NAME_PREFIX + roomId)
		await SessionManager.onLeaveChatRoom(session,roomId)

	}
	export async function quitRoom(socket: Socket,session:ISession, roomId: string,callback:Function) {
		socket.leave(ROOM_NAME_PREFIX + roomId)
		await SessionManager.onLeaveChatRoom(session,roomId)

		let change = await ChatRoomJoinStatusSchema.left(roomId,session.userId)
		if(change)
		{
			ChatRoomSchema.onUserLeft(roomId)
			socket.broadcast.emit("chat:user_quit",{
				user:session.userId,
				username:session.username
			})
		}
		callback()
			
	}
}
