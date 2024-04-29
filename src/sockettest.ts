
import { createServer } from "http"
import {  Server, Socket } from "socket.io"
import express from "express"
import { SessionManager } from "./session"
import { SocketSession } from "./sockets/SocketSession"
require('dotenv').config({path:__dirname+'/../config/.env'})

const PORT = 5050
const ORIGIN = process.env.ORIGIN

const httpserver = createServer()
httpserver.listen(PORT)

console.log(ORIGIN)
export const io = new Server(httpserver, {
	cors: {
		origin: [ORIGIN],
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
		credentials: true
	},
	allowEIO3: true
})

io.use(async (socket, next) => {

	try{
		const session = await SessionManager.getSessionById(await SocketSession.getId(socket))
		socket.data.session=session
        console.log(session)
		await SessionManager.onSocketAccess(session)
		if(!session) {
			console.log("invalid session for socket id:"+socket.id)
			return
			//throw new Error("invalid session for socket id:"+socket.id)
		}
		if(!socket.handshake.query || !socket.handshake.query.type){
			console.log("No connection type provided! socket id:"+socket.id)
			return
			//throw new Error("No connection type provided! socket id:"+socket.id)
		}
		
		socket.data.type = socket.handshake.query.type
	
		next()
	}
	catch(e){
		console.error(String(e))
	}
	
});

io.on("connection", async function (socket: Socket) {
    console.log(socket.data.session)
})