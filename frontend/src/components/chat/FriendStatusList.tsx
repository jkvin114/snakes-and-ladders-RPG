import { useContext, useEffect, useRef, useState } from "react";
import { RootContext } from "../../context/context";
import { IFriendStatus } from "../../types/chat";
import { AxiosApi } from "../../api/axios";
import ProfileImage from "./ProfileImage";
import { RiMessage2Fill, RiMoreFill, RiRefreshLine } from "react-icons/ri";
import { getDateStringDifference } from "../../util";
import { Tooltip } from 'react-tooltip';
import { Link } from "react-router-dom";

type Props={
    createChat:(userId:string,username:string)=>void
}

interface MenuState{
    open:boolean
    spectate:boolean

    username?:string
    userId?:string
}

export default function FriendStatusList({createChat}:Props){
    const [friends,setFriends] = useState<IFriendStatus[]>([])
    const [menuState,setMenuState] = useState<MenuState>({
        open:false,
        spectate:false
    })
    const dropdown = useRef(null)
    function load(){
        AxiosApi.get("/user/relation/friend_status")
            .then(res=>{
              //  console.table(res.data)
                setFriends((res.data as IFriendStatus[]).sort((a,b)=>(!b.status)?-1:1))
            })
            .catch((e) => {
                console.error(e)
            })
    }

    function toStatusString(status:string){
        if(status === "rpggame"){
            return "Playing RPG game"
        }
        if(status === "marblegame"){
            return "Playing Marble game"
        }
        if(status === "rpgspectate"){
            return "Spectating RPG game"
        }
        return status
    }
    function closeDropdown(){
        setMenuState({...menuState,open:false})
    }

    function openDropdown(e:React.MouseEvent<HTMLButtonElement, MouseEvent>,staus:IFriendStatus){
        e.stopPropagation()
        const parent = (document.getElementById("friendlist") as HTMLElement).getBoundingClientRect()
        const rect = e.currentTarget.getBoundingClientRect();
        console.log(rect);
        (document.getElementById("dropdown") as HTMLElement).style.top=String(rect.bottom-parent.top)+"px";

        (document.getElementById("dropdown") as HTMLElement).style.right=String(rect.right-parent.right)+"px";
        
        
        setMenuState({userId:staus._id,username:staus.username,open:true,spectate:staus.status==="rpggame"})

    }

    function spectate(userId?:string)
    {
        if(!userId) return
        AxiosApi.post("/room/spectate_rpg", { userId: userId })
        .then((res) => {
            window.location.href = "/rpggame?is_spectator=true"
        })
        .catch((e) => {
            if (e.response.status === 404) alert("the game does not exist")
        })
    }
    useEffect(load,[])


    return (<div id="friendlist" onClick={closeDropdown}>
        <div id="dropdown" className={menuState.open? "":"hidden"} ref={dropdown}>
            <div className="divlink"><Link to={"/user/"+menuState.username} className="divlink"></Link>View Profile</div>
            {menuState.spectate && <div onClick={()=>spectate(menuState.userId)}>Spectate Game</div>}
        </div>
        <div className="friend-toolbar">

        <button className="button dark" id="refresh" onClick={load}><RiRefreshLine/></button>
        </div>

        <div className="friendlist">
                {friends.map((f,i)=><div key={i} className={"friend-item "+(f.status?"":"inactive")}>
                <ProfileImage username={f.username} profileImgDir={f.profileImgDir}/>
                <div>
                    <div className="name">{f.username}</div>
                    {f.status && <div><span className={"badge"}></span>{toStatusString(f.status)}</div>}
                    {(!f.status && f.lastActive && f.lastActive>=0) && <div>{getDateStringDifference(f.lastActive,Date.now())} ago</div>}
                </div>
                <div>
                    <button className="button dark" onClick={()=>createChat(f._id,f.username)}><RiMessage2Fill/></button>
                    <button className="button dark" onClick={(e)=>openDropdown(e,f)}><RiMoreFill /></button>
                </div>
            </div>)}
        </div>
    </div>)
}