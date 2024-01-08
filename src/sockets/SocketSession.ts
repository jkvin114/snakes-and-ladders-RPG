import type { Socket } from "socket.io"

import { SessionManager } from "../session/inMemorySession"
import { getSessionIdFromSocket } from "../session/jwt"

export namespace SocketSession {

	export function getSession(socket:Socket){
        let id = getSessionIdFromSocket(socket)
        if(!id || !id.id){
            return null
        }
        const session =  SessionManager.getSessionById(id.id)
        return session
    }
	
	export function getUsername(socket: Socket): string {
		return getSession(socket)?.username
	}
	export function getUserClass(socket: Socket): number {
		return getSession(socket)?.isLogined?1:0
	}
	export function setTurn(socket: Socket, turn: number) {
		const session=getSession(socket)
		if(!session) return
		session.turn=turn
	}
	export function getTurn(socket: Socket): number {
		return getSession(socket)?.turn
	}
	export function getId(socket: Socket): string {
		return getSession(socket)?.id
	}
	export function setRoomName(socket: Socket, roomname: string) {
		const session=getSession(socket)
		if(!session) return
		session.roomname=roomname
	}
	export function getRoomName(socket: Socket): string {
		return getSession(socket)?.roomname
	}
	export function removeGameSession(socket: Socket) {
		const session=getSession(socket)
		if(!session) return
		delete session.turn 
		delete session.roomname
	}
	export function print(socket: Socket){
		console.log(getSession(socket))
	}
}
