import type { Socket } from "socket.io"
import express = require("express")

export namespace SocketSession {
	export function getUsername(socket: Socket): string {
		const req = socket.request as express.Request
		return req.session.username
	}
	export function setTurn(socket: Socket, turn: number) {
		const req = socket.request as express.Request
		req.session.turn = turn
		req.session.save()
		console.log(req.session)
	}
	export function getTurn(socket: Socket): number {
		const req = socket.request as express.Request
		return req.session.turn
	}

	export function setRoomName(socket: Socket, roomname: string) {
		const req = socket.request as express.Request
		req.session.roomname = roomname
		req.session.save()
		console.log(req.session)
	}
	export function getRoomName(socket: Socket): string {
		const req = socket.request as express.Request
		return req.session.roomname
	}
}
