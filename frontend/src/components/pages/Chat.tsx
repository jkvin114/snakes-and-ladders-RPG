import { useEffect, useState } from "react"
import { AxiosApi } from "../../api/axios"
import { Link, useSearchParams } from "react-router-dom"
import { socket } from "../../api/socket"
import { IChatMessage, IChatRoom, IChatUser } from "../../types/chat"
import ChatRoom from "../chat/ChatRoom"


export default function ChatPage(){

    const [rooms,setRooms] = useState<IChatRoom[]>([])
    const [searchParams, setSearchParams]  = useSearchParams()
    const [roomId,setRoomId] = useState<string|null>(searchParams.get("room"))
    useEffect(()=>{
        socket.connect()
        AxiosApi.get("/chat/rooms")
        .then(res=>{
            console.log(res.data)
            setRooms(res.data)
        })
        .catch(e=>{
            console.error(e)
        })

    },[])
    

    return (<>
        {rooms.map(r=> r&&<div key={r._id}><Link to={"/chat?room="+r._id}>{r.name}</Link></div>)}
        <br></br>
        <hr></hr>
        <br></br>
        {roomId && <ChatRoom roomId={roomId}/>}
    </>)
}