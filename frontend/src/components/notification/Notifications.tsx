import { useContext, useEffect, useState } from "react"
import { AxiosApi } from "../../api/axios"
import { INotification } from "../../types/notification"
import ChatNotification from "./ChatNotification"
import "../../styles/notification.scss"
import BaseNotification from "./BaseNotification"
import { RootContext } from "../../context/context"
import Text from "../Text"
type Props={
    newNoti:INotification[]
    setCount:React.Dispatch<React.SetStateAction<number>>
}

export default function Notifications({newNoti,setCount}:Props){
    const [noti,setNoti] = useState<INotification[]>([])
    const [newNotiCount,setNewNotiCount] = useState<number>(0)
    const {context} = useContext(RootContext)

    useEffect(()=>{
        setCount(0)
        AxiosApi.get("/api/notification/all")
        .then(res=>{
            console.log(res.data)
            setNoti(res.data)
        })
        .catch(e=>console.error(e))

		localStorage.removeItem("noti-unread-"+context.username)
    },[])

    useEffect(()=>{
        setNewNotiCount(newNoti.length)
        setNoti(not => [...newNoti,...not])
    },[newNoti])
    function deleteNoti(id:string){
        setNoti(no => no.filter(n=>n._id!==id))
        AxiosApi.post("/api/notification/delete",{id:id})
        .catch(e=>console.error(e))
    }
    return (<div id="notification-root">
    {noti.map((n,i)=><BaseNotification deleteNoti={deleteNoti} noti={n} key={n._id} isNew={i<newNotiCount}/>)}
    {noti.length===0 && <h3><Text lkey="noti.none"/></h3>}
    </div>)
}