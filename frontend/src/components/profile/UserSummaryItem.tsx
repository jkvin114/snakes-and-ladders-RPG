import { useState } from "react"
import { RiUserAddFill, RiUserFollowFill } from "react-icons/ri"
import { AxiosApi } from "../../api/axios"
import { Link } from "react-router-dom"

type Props={
    profileImgDir:string
    username:string
    buttonType:"follow"|"unfollow"|"friend"|"nofriend"|null
}
export default function UserSummaryItem({profileImgDir,username,buttonType}:Props){

    const [btnState,setBtnState]=useState(buttonType)

    const loggedin = localStorage.getItem("username")!=null
    function friendRequest() {
		AxiosApi.post("/user/relation/friend_request", { username: username })
			.then((res) => {
				if (res.status === 200) setBtnState("friend")
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
					<img className="profileimg" src={"/uploads/profile/" + profileImgDir}></img>
				)}
				<a href={`/user/`+username} className="divlink" ></a>
			</div>
		</div>
        
        <div className="item-section name">
                <a href={`/user/`+username}>{username}</a>
        </div>
        <div className="item-section">
            {(loggedin && localStorage.getItem("username")!==username) &&(<>
                {btnState==="follow" && (<button onClick={follow}>follow</button>)}
                {btnState==="unfollow" && (<button className="dark" onClick={unfollow}>unfollow</button>)}
                {btnState==="nofriend" && (<RiUserAddFill onClick={friendRequest} className="icon-btn btn"></RiUserAddFill>)}
                {btnState==="friend" && (<RiUserFollowFill className="icon-btn green"></RiUserFollowFill>)}
                </>
            )}
            
        </div>
    </div>)
}