import { useContext, useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { RootContext } from "../../context/context"
import ChatRoom from "../chat/ChatRoom"
import FriendStatusList from "../chat/FriendStatusList"
import "../../styles/friends.scss"
import "../../styles/chat.scss"
import { AxiosApi } from "../../api/axios"
import { limitString } from "../../util"

export default function FriendPage(){
    const {context} = useContext(RootContext)
    const navigate = useNavigate()
    const loggedin = context.loggedin
    
    const [searchParams, setSearchParams]  = useSearchParams()
    
    const room = searchParams.get("room")
    const [roomId,setRoomId]=useState(room)
    useEffect(()=>{
        if(!loggedin){
            navigate("/login?redirect=/friends")
            return
        }
        setRoomId(room)
    },[searchParams])

    function createChat(userId:string,username:string){
        let name = limitString(context.username+","+username)
        AxiosApi.post("/chat/room",{
            name:name,
            users:[userId]
        })
        .then(res=>{
            setSearchParams({room:res.data.id})
            // navigate("/friends?room="+res.data.id)
        })
        .catch(e=>{
            alert("failed to create room")
            console.error(e)
        })
    }
    

    
    return (<div id="friends-root">
        <FriendStatusList createChat={createChat}/>
        {roomId && <ChatRoom roomId={roomId} onBack="/friends"/>}
     </div>)
}