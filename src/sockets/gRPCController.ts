import { Socket } from "socket.io"
import { R } from "../Room/RoomStorage"
import { SocketSession } from "./SocketSession"
import { Room } from "../Room/room"

export default function grpcController(socket:Socket,controller:(room:Room,rname:string,turn:number)=>void){
    let rname = SocketSession.getRoomName(socket)
    let turn = SocketSession.getTurn(socket)

	let room=R.getRoom(rname)
	if(!room) return false
	try{
		controller(room,rname,turn)
        return true
	}
	catch(e){
		console.error(e)
        return false
	}
}