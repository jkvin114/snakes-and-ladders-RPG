import { useState, useEffect } from "react"
import { AxiosApi } from "../../api/axios"
import { IFollow } from "../../types/profile"
import UserSummaryItem from "./UserSummaryItem"
import "../../styles/userlist.scss"

type Props={
    username?:string,
    type:"follower"|"following"
}
export default function FollowList({username,type}:Props){
    const [follow,setFollow] = useState<IFollow[]>([])
    useEffect(()=>{
        if(!username) return
        AxiosApi.get("/user/" + username+"/"+type)
			.then((res) => {
				setFollow(res.data as IFollow[])
			})
    },[])
    
    return (<div className="userlist">
            {follow.map(f=><UserSummaryItem link={true} key={f.username} username={f.username} profileImgDir={f.profileImgDir} buttonType={f.isMyFollowing?"unfollow":"follow"}/>)}

    </div>)
}