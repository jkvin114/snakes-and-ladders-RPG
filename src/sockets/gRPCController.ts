import { Socket } from "socket.io"
import { R } from "../Room/RoomStorage"
import { SocketSession } from "./SocketSession"
import { Room } from "../Room/room"

export default async function grpcController<T extends Room>(socket:Socket,controller:(room:T,rname:string,turn:number)=>void|Promise<void>){
    let rname =await SocketSession.getRoomName(socket)
    let turn =await SocketSession.getTurn(socket)

	let room=R.getRoom(rname)
	if(!room) return false
	try{
		await controller(room as T,rname,turn)
        return true
	}
	catch(e){
		console.error(e)
        return false
	}
}