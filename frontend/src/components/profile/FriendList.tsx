import { useEffect, useState } from "react"
import { IFriend } from "../../types/profile"
import { AxiosApi } from "../../api/axios"
import UserSummaryItem from "./UserSummaryItem"
import "../../styles/userlist.scss"

type Props={
    username?:string
}

export default function FriendList({username}:Props){

    const [friends,setFriends] = useState<IFriend[]>([])
    useEffect(()=>{
        if(!username) return
        AxiosApi.get("/api/user/" + username+"/friend")
			.then((res) => {
				setFriends(res.data as IFriend[])
			})
    },[])
    function getBtn(status?:string){
        if(status==="friend" || status==="friend_requested") return status
        return "nofriend"
    }

    return (<div className="userlist">
        {friends.map(f=><UserSummaryItem link={true} key={f.username} username={f.username} profileImgDir={f.profileImgDir} buttonType={getBtn(f.status)}/>)}
    </div>)
}