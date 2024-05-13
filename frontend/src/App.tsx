import { Route, Routes } from "react-router-dom"
import HtmlPage from "./components/HtmlPage"
import "./index.css"
import StockGame from "./stockgame/StockGame"
import { LoginPage } from "./components/pages/Login"
import { useEffect, useState } from "react"
import { RegisterPage } from "./components/pages/Register"
import StatusPage from "./components/pages/Status"
import EjsPage from "./components/EjsPage"
import ProfilePage from "./components/pages/Profile"
import { AxiosApi } from "./api/axios"
import ChatPage from "./components/pages/Chat"
import SideBar from "./components/menu/Sidebar"
import TopBar from "./components/menu/TopBar"
import HomePage from "./components/pages/Home"
import MarbleStatPage from "./components/pages/MarbleStat"
import { INotification, NOTI_TYPE } from "./types/notification"
import { ToastContainer, toast } from "react-toastify"
import { RiMessage2Fill } from "react-icons/ri"
import Notifications from "./components/notification/Notifications"
import { IRootContext, RootContext } from "./context/context"
import { lText, limitString } from "./util"
import { MakeGamePage } from "./components/pages/MakeGame"
import FriendPage from "./components/pages/Friends"
import RPGPlayerStatPage from "./components/pages/RPGPlayerStat"
import WritePostPage from "./components/pages/WritePost"
import { round, triDist } from "./stockgame/util"
import StockGameLeaderboard from "./stockgame/LeaderBoard"
import StockGameUserLobby from "./stockgame/UserLobby"
import StockGameUserInfo from "./stockgame/UserInfo"
import StockGameUserPage from "./components/pages/StockGameUser"
import SettingPage from "./components/pages/Setting"
import { LocaleContext } from "./context/localeContext"
import NotificationControl from "./components/NotificationControl"





// Main App We run for frontend
function App() {
	const mountedRef = { current: false };
	const [notiCount,setNotiCount] = useState(0)
	const [rootState,setRootState] = useState<IRootContext>({
		username:localStorage.getItem("username"),
		loggedin:localStorage.getItem("username") != null && localStorage.getItem("loggedIn") === "true",
		showToolbar:true,
		lang:sessionStorage.language?sessionStorage.language:"en"
	})

	const [locale,setLocale] = useState<any>(null)

	const [notiQueue,setNotiQueue] = useState<INotification[]>([])

	useEffect(() => {
		mountedRef.current=true
		console.log(rootState)
		// API.get("/statustest")
		// .then(res=>console.log(res))
		// .catch(e=>console.log(e))
		AxiosApi.post("/api/jwt/init")
		if(localStorage.getItem("username") != null)
			AxiosApi.post("/api/user/current")
			.then(res=>{
				if (res.data === "") {
					localStorage.removeItem("username")
					localStorage.removeItem("loggedin")
					window.location.reload()
				}
			})
		
		return () => {
			mountedRef.current = false;
			};
		  
	}, [])
	useEffect(()=>{
		console.log(rootState.lang)
		let la = "en"
		if (rootState.lang === "eng" || rootState.lang === "en") la = "en"
		else if (rootState.lang === "kor" || rootState.lang === "ko") la = "ko"
		sessionStorage.language=rootState.lang
		fetch("/res/locale/page/"+la+".json")
		.then((res) => res.json())
		.then((data) => {
			setLocale(data)
		});

	},[rootState.lang])

	const [navbarOpen,setNavbarOpen]=useState(false)
	function printsession(){
		AxiosApi.get("/api/session")
		.then(res=>console.log(res.data))
	}
	function closeNavbar(){
		setNavbarOpen(false)
	}
	function clearChatCache(){
		Object.keys(localStorage)
		.filter(x =>
			x.startsWith('chat-'))
		.forEach(x => 
			localStorage.removeItem(x))

	}
	return (
		<>
			<RootContext.Provider value={{context:rootState,setContext:setRootState}}>
			<LocaleContext.Provider value={{locale:locale,setLocale:setLocale}}>
			<div id="page-root" className={rootState.showToolbar ?"":"hide-toolbar"}>
			<NotificationControl setNotiCount={setNotiCount} setNotiQueue={setNotiQueue}/>
				{rootState.showToolbar ?<SideBar isOpen={navbarOpen} closeNavbar={()=>setNavbarOpen(false)} notiCount={notiCount}/>:<div></div>}
				<div>
					{rootState.showToolbar && <TopBar openNavbar={setNavbarOpen}/>}
					<div onClick={closeNavbar}>

					<Routes>
						<Route path="/" element={<HomePage/>}></Route>
						<Route path="/stockgame/leaderboard" element={<StockGameLeaderboard/>}></Route>
						<Route path="/stockgame/mypage" element={<StockGameUserLobby />}></Route>
						<Route path="/stockgame/user/:userId" element={<StockGameUserPage />}></Route>

						<Route path="/stockgame/play" element={<StockGame scale={round(50 + triDist(200, 200))} variance={round(triDist(0.6,0.3),-2)} ranked={false} startMoney={10000} />}></Route>
						<Route path="/login" element={<LoginPage />}></Route>
						<Route path="/register" element={<RegisterPage />}></Route>
						<Route path="/status" element={<StatusPage />}></Route>
						<Route  path="/writepost" element={<WritePostPage/>}></Route>
						<Route path="/chat" element={<ChatPage></ChatPage>}></Route>
						<Route path="/friends" element={<FriendPage></FriendPage>}></Route>
						<Route path="/rpg_stat" element={<RPGPlayerStatPage />}></Route>
						<Route path="/setting" element={<SettingPage />}></Route>

						<Route path="/marble_stat" element={<MarbleStatPage />}></Route>
						<Route path="/notification" element={<Notifications newNoti={notiQueue} setCount={setNotiCount}/>}></Route>
						<Route path="/create_game" element={<MakeGamePage />}></Route>

						<Route path="/user/:username" element={<ProfilePage />}></Route>
						<Route path="/user/" element={<ProfilePage />}></Route>
						<Route path="/user/:username/friend" element={<ProfilePage modal="friend" />}></Route>
						<Route path="/user/:username/follower" element={<ProfilePage modal="follower" />}></Route>
						<Route path="/user/:username/following" element={<ProfilePage modal="following" />}></Route>
						<Route path="/user/:username/setting" element={<ProfilePage modal="setting" />}></Route>

						{/* <Route path='/relation/:username' element={<RelationPage/>}></Route> */}

						<Route path="/board" element={<EjsPage />}>
							<Route path="/board/:arg1/:arg2" element={<EjsPage />}></Route>
							<Route path="/board/:arg1" element={<EjsPage />}></Route>
							<Route path="/board/:arg1/:arg2/:arg3" element={<EjsPage />}></Route>
							<Route path="/board/:arg1/:arg2/:arg3/:arg4" element={<EjsPage />}></Route>
						</Route>
						<Route path="/spectate" element={<HtmlPage htmlPath="spectate" />}></Route>
						<Route path="/stat" element={<HtmlPage htmlPath="stat" />}></Route>
						<Route path="/match" element={<HtmlPage htmlPath="matching" />}></Route>
						<Route path="/admin" element={<HtmlPage htmlPath="admin" />}></Route>
						<Route path="/find_room" element={<HtmlPage htmlPath="find_room" />}></Route>
						<Route path="/rpggame" element={<HtmlPage htmlPath="rpggame" />}></Route>
						<Route path="/marblegame" element={<HtmlPage htmlPath="marblegame" />}></Route>

					</Routes>
					</div>
					{/* <button onClick={printsession}>session</button>
				<button onClick={clearChatCache}>clear chat</button> */}
				</div>
				

				{/* <StockGame/> */}
			</div>
			<ToastContainer></ToastContainer>
			</LocaleContext.Provider>
			</RootContext.Provider>
		</>
	)
}

export default App
