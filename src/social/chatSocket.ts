import type { Socket } from "socket.io";
import { SocketSession } from "../sockets/SocketSession";

module.exports=function(socket:Socket){
    socket.on("disconnect", function () {

        const session =  SocketSession.getSession(socket)
	    console.log(session)
        console.log('disconnected from '+socket.data.type)
        if(socket.data.type==="chat"){
            delete session.currentChatRoom
        }
    })


}