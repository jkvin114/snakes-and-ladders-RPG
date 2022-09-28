import type { Socket } from "socket.io";
import { R } from "../RoomStorage";
import { SocketSession } from "./SocketSession";
import type { Room } from "../room";
import type { RPGRoom } from "../RPGRoom";
import type { MarbleRoom } from "../Marble/MarbleRoom";

interface RoomController{
	(room:Room,rname:string):void
}
interface RPGRoomController{
	(room:RPGRoom,rname:string,turn:number):void
}
interface MarbleRoomController{
	(room:MarbleRoom,rname:string,turn:number):void
}
export function controlRoom(socket:Socket,roomController:RoomController){
	let rname = SocketSession.getRoomName(socket)
	if (!R.hasRoom(rname)) return false
	try{
		roomController(R.getRoom(rname),rname)
        return true
	}
	catch(e){
		console.error(e)
        return false
	}
}
export function controlRPGRoom(socket:Socket,roomController:RPGRoomController){
	let rname = SocketSession.getRoomName(socket)
    let turn = SocketSession.getTurn(socket)
	if (!R.hasRPGRoom(rname)) return false
	try{
		roomController(R.getRPGRoom(rname),rname,turn)
        return true
	}
	catch(e){
		console.error(e)
        return false
	}
}
export function controlMarbleRoom(socket:Socket,roomController:MarbleRoomController){
	let rname = SocketSession.getRoomName(socket)
    let turn = SocketSession.getTurn(socket)
	if (!R.hasMarbleRoom(rname)) return false
	try{
		roomController(R.getMarbleRoom(rname),rname,turn)
        return true
	}
	catch(e){
		console.error(e)
        return false
	}
}