import { useContext, useEffect, useState } from "react"
import { AxiosApi } from "../../api/axios"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { IChatMessage, IChatRoom, IChatUser } from "../../types/chat"
import ChatRoom from "../chat/ChatRoom"
import { RootContext } from "../../context/context"
import ChatRoomList from "../chat/ChatRoomList"


export default function ChatPage(){
    const {context} = useContext(RootContext)
    const navigate = useNavigate()
    const loggedin = context.loggedin
    
    const [searchParams, setSearchParams]  = useSearchParams()
    
    const room = searchParams.get("room")
    const [roomId,setRoomId]=useState(room)
    useEffect(()=>{
        if(!loggedin){
            navigate("/login?redirect=/chat")
            return
        }
        console.log("update")
        setRoomId(room)
//659c2791dbc11e5a15ec6e5a
    },[searchParams])
    

    return (<div id="chatpage">
        <ChatRoomList></ChatRoomList>
        {roomId && <ChatRoom roomId={roomId} onBack="/chat"/>}
    </div>)
}