import { Socket, io } from "socket.io-client"

import { backend_url } from "../variables"

export namespace ChatSocket{
	export const Socket = io(backend_url, {
		autoConnect: true,
		withCredentials: true,
		query: { type: "chat" },
	})
	let connected = false
	export function joinRoom(roomid: string, lastSerial: number) {
		connected = true
		Socket.emit("user:chat:enter", roomid, lastSerial)
	}
	export function isConnected(){
		return connected
	}
	export function leaveRoom(roomid: string) {
		connected = false
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
