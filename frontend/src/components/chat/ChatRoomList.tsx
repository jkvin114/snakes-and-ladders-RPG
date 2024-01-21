import { useState, useEffect, useContext } from "react"
import { Link } from "react-router-dom"
import { AxiosApi } from "../../api/axios"
import { IChatRoom, IChatUser } from "../../types/chat"
import ProfileImage from "./ProfileImage"
import { RiChatNewLine, RiRefreshLine, RiTeamLine } from "react-icons/ri"
import { ChatStorage } from "../../storage/chatStorage"
import { limitString } from "../../util"
import { IFriend } from "../../types/profile"
import { RootContext } from "../../context/context"
import InviteUserList from "./InviteUserList"
export default function ChatRoomList(){
    const [rooms,setRooms] = useState<IChatRoom[]>([])

    //cache for friend list
    const [friends,setFriends] = useState<IChatUser[]|null>(null)
    const [isNewRoomOpen,setIsNewRoomOpen] = useState(false)
    const {context} = useContext(RootContext)


    async function showFriend(){
        if(!context.username ||! context.loggedin) return

        //only fetch once
        if(!friends){
            const res = await  AxiosApi.get("/user/" + context.username+"/friend")
            setFriends((res.data as IChatUser[]).filter(u=>u.username!==context.username))
        }
        setIsNewRoomOpen(true)

    }
    function hideFriend(){
        setIsNewRoomOpen(false)
    }
    
    function load(){
        AxiosApi.get("/chat/rooms")
        .then(res=>{
            for(const room of res.data as IChatRoom[]){
                if(!room.lastMessage){
                    room.lastMessage=ChatStorage.getLastMsg(room._id)
                }
            }
            setRooms(res.data)
        })
        .catch(e=>{
            console.error(e)
        })
    }

    useEffect(()=>{
     
       load()

    },[])
    
    return (<div id="chatroomlist">
        {(isNewRoomOpen && friends) && (
            <>
                <InviteUserList roomUsers={friends} onClose={hideFriend}/>
                <div id="shadow" className="shadow-inner"></div>
            </>
        )}
        <div className="topbar">
            Chat Rooms
        </div>
        <div className="rooms">
        {rooms.map(r=> r&&<div key={r._id} className="divlink room">
            <Link className="divlink" to={"/chat?room="+r._id}></Link>
            <ProfileImage customImage={<RiTeamLine className="roomicon"/>}></ProfileImage>
            <div className="room-content">
                <div className="room-text">
                <b>{r.name}</b><br></br>
                    <i>{limitString(r.lastMessage)}</i>
                </div>
                <div>
                {(r.serial>0) && 
                <span className="unread">{r.serial}</span>}
                </div>
            </div>
            </div>)}
        </div>
        <div className="bottombar">
        <RiChatNewLine onClick={showFriend} />
        <RiRefreshLine onClick={load}/>

        </div>
</div>)
}