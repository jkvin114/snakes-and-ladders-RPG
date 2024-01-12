import { Socket, io } from "socket.io-client"

import { backend_url } from "../variables"

export function createChatSocket(): [
	Socket,
	(roomid: string, lastSerial: number) => void,
	(roomid: string) => void,
	(roomid: string, message: string) => void
] {
	const socket = io(backend_url, {
		autoConnect: true,
		withCredentials: true,
		query: { type: "chat" },
	})
    socket.on("connect",()=>{
        console.log("hon")
    })
	function joinRoom(roomid: string, lastSerial: number) {
		socket.emit("user:chat:enter", roomid, lastSerial)
	}
	function leaveRoom(roomid: string) {
		socket.emit("user:chat:leave", roomid)
	}
	function sendChat(roomid: string, message: string) {
		socket.emit("user:chat:message", roomid, message)
	}
	return [socket, joinRoom, leaveRoom, sendChat]
}
