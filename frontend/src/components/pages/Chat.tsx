import { useEffect, useState } from "react"
import { AxiosApi } from "../../api/axios"
import { Link, useSearchParams } from "react-router-dom"
import { socket } from "../../api/socket"


interface IChatRoom{
    _id:string
    name:string
    size:number
}
interface IUser{
    _id:string
    profileImgDir:string
     username:string
}
export default function ChatPage(){

    const [rooms,setRooms] = useState<IChatRoom[]>([])
    const [searchParams, setSearchParams]  = useSearchParams()
    const [roomUsers,setRoomUsers] = useState<IUser[]>([])

    function storeMessage(serial:number,message:string){
        const roomId = searchParams.get("room")
        if(!roomId) return
        localStorage.setItem(`chat-${roomId}-${serial}`,message)
        let minSerial = localStorage.getItem(`chat-${roomId}-serial-min`)
        let maxSerial = localStorage.getItem(`chat-${roomId}-serial-max`)
        if(!minSerial || serial < Number(minSerial)){
            localStorage.setItem(`chat-${roomId}-serial-min`,String(serial))
        }
        if(!maxSerial || serial > Number(maxSerial)){
            localStorage.setItem(`chat-${roomId}-serial-max`,String(serial))
        }

    }

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
    useEffect(()=>{
        if(!searchParams.has("room")){
            return
        }
        const roomId = searchParams.get("room")
        AxiosApi.get("/chat/users/"+roomId)
        .then(res=>{
            console.log(res.data)
            setRoomUsers(res.data)
        })
        .catch(e=>{
            console.error(e)
        })

    },[searchParams])

    return (<>
        {rooms.map(r=> r&&<div key={r._id}><Link to={"/chat?room="+r._id}>{r.name}</Link></div>)}
        <br></br>
        <hr></hr>
        <br></br>
        {searchParams.has("room") && 
            roomUsers.map(u=><div key={u._id}>{u.username}</div>)
        }
        <br></br>
        <hr></hr>
        <br></br>
    </>)
}