import { Dispatch, useContext, useEffect, useState } from "react";
import { LocaleContext } from "../context/localeContext";
import { RiMessage2Fill } from "react-icons/ri";
import { toast } from "react-toastify";
import { AxiosApi } from "../api/axios";
import { INotification, NOTI_TYPE } from "../types/notification";
import { lText, limitString } from "../util";
import { RootContext } from "../context/context";
import { SetStateAction } from "react";

type Props = {
    setNotiCount: Dispatch<SetStateAction<number>>,
    setNotiQueue: Dispatch<SetStateAction<INotification[]>>
}
export default function NotificationControl({setNotiCount,setNotiQueue}:Props){

    const mountedRef = { current: false };
    const {locale} = useContext(LocaleContext)
    const {context} = useContext(RootContext)


	function getNotiMessage(noti:INotification){
		if(noti.type===NOTI_TYPE.Chat) return lText(locale,"noti.toast.chat")+limitString(noti.message)
		return noti.message +"!"
	}

	function updateNotiCount(count:number){
		let username = localStorage.getItem("username")
		if(!username) return
		
		let unread = localStorage.getItem("noti-unread-"+username)
		if(!unread) {
			setNotiCount(count)
			localStorage.setItem("noti-unread-"+username,String(count))
		}
		else{
			setNotiCount(Number(unread)+count)
			localStorage.setItem("noti-unread-"+username,String(Number(unread)+count))
		} 
	}
	function onReceiveNoti(notis:INotification[]){
		if(notis.length===0) return
		
		if(window.location.pathname.split("/")[1] === "notification"){
			setNotiQueue(notis)
			setNotiCount(0)
			localStorage.removeItem("noti-unread-"+context.username)
			return
		}
		else{
            console.log(locale)
			let msg = notis[0].message
			let localemsg  = lText(locale,"noti.toast."+msg)
			console.log(localemsg)
			if(localemsg===""){
				localemsg = getNotiMessage(notis[0])
			}
			toast.info(localemsg, {
				position: "bottom-right",
				autoClose: 3000,
				hideProgressBar: true,
				closeOnClick: true,
				pauseOnHover: false,
				draggable: false,
				progress: 0,
				theme: "colored",
				icon:(<RiMessage2Fill/>)
			})
			// ToastHelper.ChatToast("New Message: "+notis[0].message,)
			updateNotiCount(notis.length)
		}
		
	}
	function pollNotification(){
		console.log("start polling")
		AxiosApi.get("/api/notification/poll")
		.then(res=>{
			if(!mountedRef.current) return
			
			onReceiveNoti(res.data as INotification[])
			pollNotification()
		})
		.catch(e=>{
			if(e.response.status !== 401)
				console.error(e)
			if(!mountedRef.current) return
			setTimeout(pollNotification,5*1000)
		})
	}
	useEffect(() => {
		if(!mountedRef.current && localStorage.getItem("username") != null && localStorage.getItem("loggedIn"))
		{
			pollNotification()
			updateNotiCount(0)
		}	
		mountedRef.current=true
		
		return () => {
			mountedRef.current = false;
			};
		  
	}, [])
    return (<></>)
}