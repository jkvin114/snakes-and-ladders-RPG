import { useEffect, useState } from "react"
import { RiCheckboxCircleLine, RiMailCheckLine, RiUserAddFill, RiUserFollowFill } from "react-icons/ri"
import { AxiosApi } from "../../api/axios"
import { Link } from "react-router-dom"
import Image from "../ProfileImg"
import ProfileImg from "../ProfileImg"

type Props={
    profileImgDir:string
    username:string
    buttonType:"follow"|"unfollow"|"friend"|"friend_requested"|"nofriend"|"checked"|null
	link?:boolean
}
export default function UserSummaryItem({profileImgDir,username,buttonType,link}:Props){
	console.log(buttonType)
    const [btnState,setBtnState]=useState(buttonType)
	useEffect(()=>{
		setBtnState(buttonType)
    },[buttonType])

    const loggedin = localStorage.getItem("username")!=null
    function friendRequest() {
		AxiosApi.post("/user/relation/friend_request/send", { username: username })
			.then((res) => {
				if (res.status === 200) setBtnState("friend_requested")
			})
			.catch((e) => {
				if (e.response.status === 401) alert("login required")
				else throw Error(e)
			})
	}
	function follow() {
		AxiosApi.post("/user/relation/follow", { username: username })
			.then((res) => {
				if (res.status === 200) setBtnState("unfollow")
			})
			.catch((e) => {
				if (e.response.status === 401) alert("login required")
				else throw Error(e)
			})
	}
	function unfollow() {
		AxiosApi.post("/user/relation/unfollow", { username: username })
			.then((res) => {
				if (res.status === 200) setBtnState("follow")
			})
			.catch((e) => {
				if (e.response.status === 401) alert("login required")
				else throw Error(e)
			})
	}
    
    return (<div className="user-item">
		<div className="item-section">
			<div className={"profileimg-container divlink" + (!profileImgDir || profileImgDir === "" ? " " : " has-img")}>
				{!profileImgDir || profileImgDir === "" ? (
					<b>{username.charAt(0).toUpperCase()}</b>
				) : (
					<ProfileImg className="profileimg" src={profileImgDir}/>
				)}
				{link && <Link to={`/user/`+username} className="divlink" ></Link>}
			</div>
		</div>
        
        <div className="item-section name">
			{link ? ( <Link to={`/user/`+username}>{username}</Link>): (<a>{username}</a>)}
        </div>
        <div className="item-section">
            {(loggedin && localStorage.getItem("username")!==username) &&(<>
                {btnState==="follow" && (<button onClick={follow}>follow</button>)}
                {btnState==="unfollow" && (<button className="dark" onClick={unfollow}>unfollow</button>)}
                {btnState==="nofriend" && (<RiUserAddFill onClick={friendRequest} className="icon-btn btn"></RiUserAddFill>)}
                {btnState==="friend" && (<RiUserFollowFill className="icon-btn green"></RiUserFollowFill>)}
				{btnState==="friend_requested" && (<RiMailCheckLine className="icon-btn green"></RiMailCheckLine>)}
                </>
            )}
			{btnState==="checked" && (<RiCheckboxCircleLine  className="icon-btn green"></RiCheckboxCircleLine>)}
        </div>
    </div>)
}