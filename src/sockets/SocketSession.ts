import type { Socket } from "socket.io"
import express = require("express")

export namespace SocketSession {
	export function getUsername(socket: Socket): string {
		const req = socket.request as express.Request
		return req.session.username
	}
	export function getUserClass(socket: Socket): number {
		const req = socket.request as express.Request
		return req.session.isLogined?1:0
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
	export function getId(socket: Socket): string {
		const req = socket.request as express.Request
		return req.session.id
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
	export function removeGameSession(socket: Socket) {
		const req = socket.request as express.Request
		delete req.session.turn 
		delete req.session.roomname
	
		// if(!req.session.isLogined)
		// 	delete req.session.username
		// console.log(req.session)
	}
	export function print(socket: Socket){
		const req = socket.request as express.Request
		console.log(req.session)
	}
}
