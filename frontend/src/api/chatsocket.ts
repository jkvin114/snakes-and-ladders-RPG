import { Socket, io } from "socket.io-client"

import { backend_url } from "../variables"

export namespace ChatSocket{
	export const Socket = io(backend_url, {
		autoConnect: true,
		withCredentials: true,
		query: { type: "chat" },
	})
	console.log("init")
	export function joinRoom(roomid: string, lastSerial: number) {
		Socket.emit("user:chat:enter", roomid, lastSerial)
	}
	export function leaveRoom(roomid: string) {
		Socket.emit("user:chat:leave", roomid)
		
	}
	export function sendChat(roomid: string, message: string) {
		Socket.emit("user:chat:message", roomid, message)
	}
	export function on(name:string,func:(...args:any[])=>void){
		Socket.removeAllListeners(name);
		Socket.on(name,func)
	}
}
