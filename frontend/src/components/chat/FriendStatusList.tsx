import { useContext, useEffect, useRef, useState } from "react"
import { RootContext } from "../../context/context"
import { IFriendStatus } from "../../types/chat"
import { AxiosApi } from "../../api/axios"
import ChatProfileImage from "./ChatProfileImage"
import { RiCloseFill, RiMailSendFill, RiMessage2Fill, RiMoreFill, RiRefreshLine, RiSearch2Line } from "react-icons/ri"
import { getDateStringDifference } from "../../util"
import { Tooltip } from "react-tooltip"
import { Link } from "react-router-dom"
import { IFriend } from "../../types/profile"
import UserSummaryItem from "../profile/UserSummaryItem"

type Props = {
	createChat: (userId: string, username: string) => void
}

interface MenuState {
	open: boolean
	spectate: boolean
	username?: string
	userId?: string
}

export default function FriendStatusList({ createChat }: Props) {
	const [friends, setFriends] = useState<IFriendStatus[]>([])
	const [menuState, setMenuState] = useState<MenuState>({
		open: false,
		spectate: false
	})
    const [searchOpen,setSearchOpen] =useState<boolean>(false)
    const [searchResult,setSearchResult] = useState<IFriend[]>([])
    const { context } = useContext(RootContext)

	const dropdown = useRef(null)
	function load() {
		AxiosApi.get("/api/user/relation/friend_status")
			.then((res) => {
				//  console.table(res.data)
				setFriends((res.data as IFriendStatus[]).sort((a, b) => (!b.status ? -1 : 1)))
			})
			.catch((e) => {
				console.error(e)
			})
	}

	function toStatusString(status: string) {
		if (status === "rpggame") {
			return "Playing RPG game"
		}
		if (status === "marblegame") {
			return "Playing Marble game"
		}
		if (status === "rpgspectate") {
			return "Spectating RPG game"
		}
		return status
	}
	function closeDropdown() {
		setMenuState({ ...menuState, open: false })
	}

	function openDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, staus: IFriendStatus) {
		e.stopPropagation()
		const parent = (document.getElementById("friendlist") as HTMLElement).getBoundingClientRect()
		const rect = e.currentTarget.getBoundingClientRect()
		;(document.getElementById("dropdown") as HTMLElement).style.top = String(rect.bottom - parent.top) + "px"

		;(document.getElementById("dropdown") as HTMLElement).style.right = "0px"

		setMenuState({
			...menuState,
			userId: staus._id,
			username: staus.username,
			open: true,
			spectate: staus.status === "rpggame",
		})
	}

	function spectate(userId?: string) {
		if (!userId) return
		AxiosApi.post("/api/room/spectate_rpg", { userId: userId })
			.then((res) => {
				window.location.href = "/rpggame?is_spectator=true"
			})
			.catch((e) => {
				if (e.response.status === 404) alert("the game does not exist")
			})
	}
	useEffect(load, [])

	function openSearch() {
		setSearchOpen(true)
	}
	function closeSearch() {
		setSearchOpen(false)
        setSearchResult([])
	}
    function submitSearch(){
        let str = (document.getElementById("search-input") as HTMLInputElement).value
        if(!str || str ==="") return
        AxiosApi.get("/api/user/relation/friend_search?search="+str)
        .then(res=>setSearchResult(res.data))
        .catch((e) => {
            console.error(e)
        })
    }

    const handleKeyPress = (event:any) => {
        if (event.key === 'Enter') {
            submitSearch()
        }
      };

	  function getBtn(status?:string){
        if(status==="friend" || status==="friend_requested") return status
        return "nofriend"
    }
	return (
		<div id="friendlist" onClick={closeDropdown} >
            
            {searchOpen && <>
                <div id="shadow"  className="shadow-inner"></div>
                <div id="search-modal" onKeyDown={handleKeyPress}>
                    <div className="modal-toolbar">
                        <b>Search user</b>
                        <div className="divlink modal-close">
                            <a className="divlink" onClick={closeSearch}>
                                <RiCloseFill />
                            </a>
                        </div>
                    </div>
                    <div className="modal-toolbar searchbar" >
                        <input type="text" id="search-input"></input>
                        <div className="divlink search-btn"> 
                            <a className="divlink" onClick={submitSearch}>
                                <RiSearch2Line />
                            </a>
                        </div>
                         
                    </div>
                    <div className="modal-content userlist">
                        {searchResult.length===0 && <span>No result</span>}
                        {searchResult.map((f,i)=><UserSummaryItem link={true} key={i} username={f.username} profileImgDir={f.profileImgDir} buttonType={getBtn(f.status)}/>)}
                    </div>
                </div>
            </>}

			<div id="dropdown" className={menuState.open ? "" : "hidden"} ref={dropdown}>
				<div className="divlink">
					<Link to={"/user/" + menuState.username} className="divlink"></Link>View Profile
				</div>
				{menuState.spectate && <div onClick={() => spectate(menuState.userId)}>Spectate Game</div>}
			</div>
			<div className="friend-toolbar">
				<button className="button dark" id="refresh" onClick={load}>
					<RiRefreshLine />
				</button>
				<button className="button dark" onClick={openSearch}>
					<RiSearch2Line />
				</button>
			</div>
            
			<div className="friendlist">
				{friends.map((f, i) => (
					<div key={i} className={"friend-item " + (f.status ? "" : "inactive")}>
						<ChatProfileImage username={f.username} profileImgDir={f.profileImgDir} />
						<div>
							<div className="name">{f.username}</div>
							{f.status && (
								<div>
									<span className={"badge"}></span>
									{toStatusString(f.status)}
								</div>
							)}
							{!f.status && f.lastActive && f.lastActive >= 0 && (
								<div>{getDateStringDifference(f.lastActive, Date.now(),context.lang)} ago</div>
							)}
						</div>
						<div>
							<button className="button dark" onClick={() => createChat(f._id, f.username)}>
								<RiMessage2Fill />
							</button>
							<button className="button dark" onClick={(e) => openDropdown(e, f)}>
								<RiMoreFill />
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
