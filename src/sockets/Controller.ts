import type { Socket } from "socket.io";
import { R } from "../Room/RoomStorage";
import { SocketSession } from "./SocketSession";
import type { Room } from "../Room/room";
import type { RPGRoom } from "../RPGGame/RPGRoom";
import type { MarbleRoom } from "../Marble/MarbleRoom";

interface RoomController{
	(room:Room,rname:string):void|Promise<void>
}
interface RPGRoomController{
	(room:RPGRoom,rname:string,turn:number):void|Promise<void>
}

interface MarbleRoomController{
	(room:MarbleRoom,rname:string,turn:number):void|Promise<void>
}

export async function controlRoom(socket:Socket,roomController:RoomController){
	let rname =await SocketSession.getRoomName(socket)
	let room=R.getRoom(rname)
	if(!room) return false
	try{
		await roomController(room,rname)
        return true
	}
	catch(e){
		console.error(e)
        return false
	}
}
export async function controlRPGRoom(socket:Socket,roomController:RPGRoomController,playeronly?:boolean){
	let rname =await SocketSession.getRoomName(socket)
    let turn = await SocketSession.getTurn(socket)
	let room=R.getRPGRoom(rname)
	if(!room) return false
	if(playeronly && turn<0) return false
	try{
		await roomController(room,rname,turn)
        return true
	}
	catch(e){
		console.error(e)
        return false
	}
}
export async function controlMarbleRoom(socket:Socket,roomController:MarbleRoomController,playeronly?:boolean){
	let rname =await SocketSession.getRoomName(socket)
    let turn =await SocketSession.getTurn(socket)
	if (!R.hasMarbleRoom(rname)) return false
	let room=R.getMarbleRoom(rname)
	if(!room) return false
	if(playeronly && turn<0) return false
	try{
		await roomController(room,rname,turn)
        return true
	}
	catch(e){
		console.error(e)
        return false
	}
}