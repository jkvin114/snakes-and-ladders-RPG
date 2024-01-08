import { useState } from "react"
import { ChatStorage } from "../../storage/chatStorage"
import { IChatUser, IChatMessage } from "../../types/chat"
import { AxiosApi } from "../../api/axios"
import { useEffect } from "react"

type Props={
    roomId:string
}
export default function ChatRoom({roomId}:Props){
    const [roomUsers,setRoomUsers] = useState<IChatUser[]>([])

    const [messages,setMessages] = useState<IChatMessage[]>(ChatStorage.loadStoredMessages(roomId))
    const [maxSerial,setMaxSerial] = useState<number>(ChatStorage.maxSerial(roomId))
    useEffect(()=>{
        
        AxiosApi.get("/chat/users/"+roomId)
        .then(res=>{
            console.log(res.data)
            setRoomUsers(res.data)
        })
        .catch(e=>{
            console.error(e)
        })
        

    },[])
    return (<></>)
}