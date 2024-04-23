import type { Socket } from "socket.io"

import { SessionManager } from "../session"
import { getSessionIdFromSocket } from "../session/jwt"

export namespace SocketSession {

	export async function getSession(socket:Socket){
        let id = getSessionIdFromSocket(socket)
        if(!id || !id.id){
            return null
        }
        const session = await SessionManager.getSessionById(id.id)
        return session
    }
	
	export async function getUsername(socket: Socket) {
		return (await getSession(socket))?.username
	}
	export async function getUserClass(socket: Socket) {
		return (await getSession(socket))?.loggedin?1:0
	}
	export async function setTurn(socket: Socket, turn: number) {
		const session=await getSession(socket)
		if(!session) return
		// session.turn=turn
		await SessionManager.setTurn(session.id,turn)
	}
	export async function getTurn(socket: Socket) {
		return (await getSession(socket))?.turn
	}
	/**
	 * return session id of socket 
	 * @param socket 
	 * @returns 
	 */
	export async function getId(socket: Socket) {
		return (await getSession(socket)).id
	}
	export async function setRoomName(socket: Socket, roomname: string) {
		const session=await getSession(socket)
		if(!session) return
		// session.roomname=roomname
		await SessionManager.setRoomname(session.id,roomname)
	}
	export async  function getRoomName(socket: Socket) {
		return (await getSession(socket)).roomname
	}
	export async function removeGameSession(socket: Socket) {
		const session=await getSession(socket)
		if(!session) return
		await SessionManager.removeGameSession(session.id)
		// delete session.turn 
		// delete session.roomname
	}
	export async function print(socket: Socket){
		console.log(await getSession(socket))
	}
}
