import { RiCloseFill, RiCloseLine } from "react-icons/ri"
import { IChatUser } from "../../types/chat"
import UserSummaryItem from "../profile/UserSummaryItem"
import { MouseEventHandler, useContext, useEffect, useState } from "react"
import { toast } from "react-toastify"
import { AxiosApi } from "../../api/axios"
import { limitString } from "../../util"
import { RootContext } from "../../context/context"

type Props = {
	roomUsers: IChatUser[]
	onClose: MouseEventHandler
}
interface EChatUser extends IChatUser {selected?:boolean}

export default function InviteUserList({ roomUsers, onClose }: Props) {
    const [users,setUsers] = useState<EChatUser[]>([...roomUsers])
    const [count,setCount] = useState(0)
    const {context} = useContext(RootContext)

	function onSelect(id: string) {
		

        const updatedItems = users.map(item =>
            item._id === id ? { ...item, selected:true } : item
          );
          setCount(count+1)
      setUsers(updatedItems)
	}
	function onDeSelect(id: string) {

		const updatedItems = users.map(item =>
            item._id === id ? { ...item, selected:false } : item
          );
      setUsers(updatedItems)
      setCount(count-1)
	}
    function onConfirm(){
        if(count < 1) {
            toast.error(`You must select at least 1 user`, {
				position: "top-right",
				autoClose: 3000,
				hideProgressBar: true,
				closeOnClick: true,
				pauseOnHover: false,
				draggable: false,
				progress: 0,
				theme: "colored",
			})
            return
        }
        const invited = users.filter(u=>u.selected)
        let name = limitString(context.username+","+invited.map(u=>u.username).join(","),30)
        AxiosApi.post("/api/chat/room",{
            name:name,
            users:invited.map(u=>u._id)
        })
        .then(res=>{
            window.location.href="/chat?room="+res.data.id
        })
        .catch(e=>{
            alert("failed to create room")
            console.error(e)
        })
    }
	return (
		<div id="inviteusers">
			<div className="modal-toolbar">
				<b>New Room</b>
				<div className="divlink modal-close">
					<a className="divlink" onClick={onClose}>
						<RiCloseFill />
					</a>
				</div>
			</div>
			<div className="modal-content userlist">
				{users.map((u) => (
					<div key={u._id} 
						className={"user-item-wrapper " + (u.selected ? " selected" : "")}
						onClick={u.selected ? () => onDeSelect(u._id) : () => onSelect(u._id)}>
						<UserSummaryItem link={false} username={u.username} profileImgDir={u.profileImgDir} buttonType={u.selected?"checked":null} />
					</div>
				))}
			</div>
			<div className="confirm" onClick={onConfirm}> confirm ({count} users)</div>
		</div>
	)
}
