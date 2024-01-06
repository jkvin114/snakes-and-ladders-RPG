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
        AxiosApi.get("/user/" + username+"/friend")
			.then((res) => {
                console.table(res.data)
				setFriends(res.data as IFriend[])
			})
    },[])

    return (<div className="userlist">
        {friends.map(f=><UserSummaryItem key={f.username} username={f.username} profileImgDir={f.profileImgDir} buttonType={f.status==="friend"?"friend":"nofriend"}/>)}
    </div>)
}