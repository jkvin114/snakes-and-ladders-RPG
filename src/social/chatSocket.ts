import type { Socket } from "socket.io";
import { SocketSession } from "../sockets/SocketSession";
import { ChatController, ChatControllerWrapper } from "./chatController";

enum Event{
    Message="user:chat:message",
    Enter="user:chat:enter",
    Leave="user:chat:leave",
    Quit="user:chat:quit",
}

module.exports=function(socket:Socket){
    socket.on("disconnect", function () {

        const session =  SocketSession.getSession(socket)
	    //console.log(session)
        //console.log('disconnected from '+socket.data.type)
        if(socket.data.type==="chat"){
          //  delete session.currentChatRoom
        }
    })

    socket.on(Event.Message, ChatControllerWrapper(socket,Event.Message,ChatController.sendMessage))
    socket.on(Event.Enter, ChatControllerWrapper(socket,Event.Enter,ChatController.enterRoom))
    socket.on(Event.Leave, ChatControllerWrapper(socket,Event.Leave,ChatController.leaveRoom))
    socket.on(Event.Quit, ChatControllerWrapper(socket,Event.Quit,ChatController.quitRoom))



}