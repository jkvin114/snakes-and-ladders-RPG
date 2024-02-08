import { useEffect, useState } from "react"
import "../styles/gameinvite.scss"
import { IFriendStatus } from "../types/chat"
import { AxiosApi } from "../api/axios"
import { getDateStringDifference } from "../util"
import ChatProfileImage from "./chat/ChatProfileImage"
import { RiArrowDropRightLine, RiArrowDropLeftLine, RiRefreshLine, RiMailSendLine } from "react-icons/ri"
export default function GameInviteModal() {
	const [open, setOpen] = useState(false)
	const [friends, setFriends] = useState<IFriendStatus[]>([])
	const [invited, setInvited] = useState<Set<string>>(new Set<string>())

	useEffect(reload, [open])
	function reload() {
		AxiosApi.get("/user/relation/friend_status")
			.then((res) => {
                const friends = res.data as IFriendStatus[]
				setFriends(friends.sort((a, b) => (!b.status ? -1 : 1)))
                let inv = new Set(invited)
                for(const user of friends){
                    if(!canInvite(user.status)) inv.delete(user._id)
                }
                setInvited(inv)
			})
			.catch((e) => {
				console.error(e)
			})
	}

	function toStatusString(status: string) {
		if (status === "rpggame") {
			return "Playing game"
		}
		if (status === "marblegame") {
			return "Playing game"
		}
		if (status === "rpgspectate") {
			return "Spectating game"
		}
		return status
	}
	function canInvite(status: string) {
		return status === "online"
	}
	function inviteUser(id: string) {
        AxiosApi.post("/room/invite",{id:id})
        .then(res=>{
            setInvited(new Set(invited).add(id))

        })
        .catch(e=>{
            console.error(e)
            alert(e.response.data)
            if(e.response.status < 500)
                reload()
        })
	}
	function cancelInvite(id: string) {
		
        AxiosApi.post("/room/cancel_invite",{id:id})
        .then(res=>{
            let inv = new Set(invited)
            inv.delete(id)
            setInvited(inv)
            //reload()
        })
        .catch(e=>{
            console.error(e)
        })
	}
    

	return (
		<div id="matching-invite-modal">
			{open && <div className="shadow"></div>}
			{!open && (
				<div className="open-btn btn">
					<button className="button dark"  onClick={()=>setOpen(true)}>
                        <RiMailSendLine />
					</button>
				</div>
			)}
			{open && (
				<div className="content">
					<div className="friendlist">
						{friends.map((f, i) => (
							<div key={i} className={"friend-item " + (f.status ? "" : "inactive")}>
								<ChatProfileImage username={f.username} profileImgDir={f.profileImgDir} />
								<div>
									<div className="name">{f.username}</div>
									{f.status && (
										<div>{(invited.has(f._id) && canInvite(f.status)) ?<span className="waiting">Waiting response..</span> :
                                        <><span className={"badge "+(canInvite(f.status)?"":"unavailable")}></span>
                                        {toStatusString(f.status)}</>}
										</div>
									)}
								</div>
								<div>
									{!invited.has(f._id) && (
										<button className={"button "+(canInvite(f.status)?"":"disabled")} onClick={canInvite(f.status) ?() => inviteUser(f._id):()=>{}}>
											invite
										</button>
									)}
									{invited.has(f._id) && (
										<button className={"button dark "+(canInvite(f.status)?"":"disabled")} onClick={() => cancelInvite(f._id)}>
											cancel
										</button>
									)}
								</div>
							</div>
						))}
					</div>
					<div className="close-btn btn">
						<button className="button dark" onClick={()=>setOpen(false)}>
							<RiArrowDropLeftLine />
						</button><br></br>
                        <button className="button dark" onClick={reload}>
							<RiRefreshLine />
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
