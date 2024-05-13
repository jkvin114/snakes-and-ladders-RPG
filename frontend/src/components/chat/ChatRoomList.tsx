import { useState, useEffect, useContext } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { AxiosApi } from "../../api/axios"
import { IChatRoom, IChatUser } from "../../types/chat"
import ChatProfileImage from "./ChatProfileImage"
import { RiChatNewLine, RiRefreshLine, RiTeamLine } from "react-icons/ri"
import { ChatStorage } from "../../storage/chatStorage"
import { limitString } from "../../util"
import { IFriend } from "../../types/profile"
import { RootContext } from "../../context/context"
import InviteUserList from "./InviteUserList"
import Text from "../Text"
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
            const res = await  AxiosApi.get("/api/user/" + context.username+"/friend")
            setFriends((res.data as IChatUser[]).filter(u=>u.username!==context.username))
        }
        setIsNewRoomOpen(true)

    }
    function hideFriend(){
        setIsNewRoomOpen(false)
    }
    function resetUnread(roomId:string){
        setRooms(rooms=>rooms.map(r=>(r._id===roomId)?{...r,unread:0}:r))
    }
    const [searchParams, setSearchParams]  = useSearchParams()
    const room = searchParams.get("room")
    useEffect(()=>{
        if(room)
            resetUnread(room)
        load()
    },[searchParams])
    
    function load(){
        AxiosApi.get("/api/chat/rooms")
        .then(res=>{
            for(const room of res.data as IChatRoom[]){
                if(!room.lastMessage){
                    room.lastMessage=ChatStorage.getLastMsg(room._id)
                }
            }
            const list = res.data
            list.sort((a:IChatRoom,b:IChatRoom)=>b.unread - a.unread)
            setRooms(list)
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
            <Text lkey="chat.rooms"/>
        </div>
        <div className="rooms">
        {rooms.map(r=> r&&<div key={r._id} className="divlink room" onClick={()=>resetUnread(r._id)}>
            <Link className="divlink" to={"/chat?room="+r._id}></Link>
            <ChatProfileImage customImage={<RiTeamLine className="roomicon"/>}></ChatProfileImage>
            <div className="room-content">
                <div className="room-text">
                <b>{r.name}</b><a>{"  "}{r.size>2?r.size:""}</a><br></br>
                    <i>{limitString(r.lastMessage)}</i>
                </div>
                <div>
                {(r.unread>0 && room!==r._id) && 
                <span className="unread">{r.unread}</span>}
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