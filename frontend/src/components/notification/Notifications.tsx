import { useEffect, useState } from "react"
import { AxiosApi } from "../../api/axios"
import { INotification } from "../../types/notification"
import ChatNotification from "./ChatNotification"
import "../../styles/notification.scss"
type Props={
    newNoti:INotification[]
}

export default function Notifications({newNoti}:Props){
    const [noti,setNoti] = useState<INotification[]>([])
    useEffect(()=>{
        AxiosApi.get("/notification/all")
        .then(res=>{
            console.log(res.data)
            setNoti(res.data)
        })
        .catch(e=>console.error(e))
    },[])

    useEffect(()=>{
        setNoti(not => [...newNoti,...not])
    },[newNoti])

    return (<div id="notification-root">
    {noti.map((n,i)=><>
            {n.type==="CHAT" && <ChatNotification  noti={n} key={i}/>}
            {n.type==="EMPTY" && <ChatNotification  noti={n} key={i}/>}
        </>
    )}
    </div>)
}