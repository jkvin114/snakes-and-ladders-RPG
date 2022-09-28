import type { Socket } from "socket.io";
import { io } from "./app";
import { R } from "./RoomStorage";
import { SocketSession } from "./sockets/SocketSession";

module.exports=function(socket:Socket){
    socket.on("user:update_playerlist", function (playerlist: any) {
		try {
			let rname = SocketSession.getRoomName(socket)
			console.log(rname)
			if (!R.hasRoom(rname)) return
			let room = R.getRoom(rname)
			let turnchange = room.user_updatePlayerList(playerlist)
			io.to(rname).emit("server:update_playerlist", room.playerlist, turnchange)
		} catch (e) {
			console.error(e)
		}	
	})
}