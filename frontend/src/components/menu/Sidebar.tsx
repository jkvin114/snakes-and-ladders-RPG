import { Link, useNavigate } from "react-router-dom";
import "../../styles/sidebar.scss"
import { RiAccountCircleFill, RiArchiveFill, RiBallPenFill, RiBarChartFill, RiBillFill, RiBroadcastFill, RiCloseLine, RiCompass3Line, RiEyeFill, RiFolderVideoFill, RiHome4Fill, RiMessage2Fill, RiNewspaperFill, RiNotification2Fill, RiPieChartFill, RiPlayFill, RiSettings5Fill, RiStockLine, RiTeamFill, RiTrophyFill, RiUserReceived2Fill } from "react-icons/ri";
import { TbWorldQuestion } from "react-icons/tb";
import { GrGamepad } from "react-icons/gr";
import { useContext, useState } from "react";
import { RootContext } from "../../context/context";

type Props={
    isOpen:boolean
    closeNavbar:()=>void
    notiCount:number
}

export default function SideBar({isOpen: isOpenInMobile,closeNavbar,notiCount}:Props){
    const {context} = useContext(RootContext)

    const loggedin = context.loggedin

    return (<div id="sidebar" className={isOpenInMobile? "mobile-open":""}>
        <nav className="sidebar-content">
        <ul>
            <li className="close-bar-mobile">
                <a className="menu-item menu-item-small" ><RiCloseLine  onClick={closeNavbar}/></a>
            </li>
        <li  onClick={closeNavbar}>
        <Link className="menu-item"  to="/"><RiHome4Fill/><b className="menu-name">Home</b></Link>
        </li>
          <li className="menu-item-container">
            <a className="menu-item"><img src="/favicon.png"></img><b className="menu-name">RPG Game</b></a>
            <ul className="sub-menu"  onClick={closeNavbar}>
              <li className="sub-menu-item"><Link to="/create_game?type=rpg"><GrGamepad />Create Room</Link></li>
              <li className="sub-menu-item"><a href="/find_room"><RiUserReceived2Fill />Join</a></li>
              <li className="sub-menu-item"><a href="/spectate"><RiEyeFill />Spectate</a></li>
              {loggedin && <li className="sub-menu-item"><Link to={"/rpg_stat?username="+context.username}><RiFolderVideoFill />My Game Record</Link></li>}
              <li className="sub-menu-item"><a href="/stat?page=game"><RiArchiveFill />All Game Record</a></li>
              <li className="sub-menu-item"><a href="/stat?page=analysis"><RiBarChartFill />Analysis</a></li>
              <li className="sub-menu-item"><a href="https://jkvin114.github.io/Snakes-and-Ladders-RPG-wiki/index.html"><TbWorldQuestion />Wiki</a></li>
            </ul>
          </li>
          <li className="menu-item-container">
            <a className="menu-item"><img src="/stock.png"></img><b className="menu-name">Stock Game</b></a>
            <ul className="sub-menu"  onClick={closeNavbar}>
              {loggedin &&<li className="sub-menu-item"><Link to="/stockgame/mypage"><RiAccountCircleFill />My Page</Link></li>}
              <li className="sub-menu-item"><Link to="/stockgame/play"><GrGamepad />Play</Link></li>
              {/* <li className="sub-menu-item"><Link to="/"><RiTrophyFill />Play Ranked</Link></li> */}
              {/* {loggedin && <li className="sub-menu-item"><Link to="/"><RiFolderVideoFill />Game Record</Link></li>} */}
              <li className="sub-menu-item"><Link to="/stockgame/leaderboard"><RiBarChartFill />Leaderboard</Link></li>
            </ul>
          </li>

          <li className="menu-item-container">
          <a className="menu-item"><img src="/res/img/marble/icon.jpg"></img><b className="menu-name">Marble Game</b></a>
            <ul className="sub-menu"  onClick={closeNavbar}>
              <li className="sub-menu-item"><Link to="/create_game?type=marble"><GrGamepad />Create Room</Link></li>
              <li className="sub-menu-item"><a href="/find_room"><RiUserReceived2Fill />Join</a></li>
              {loggedin && <li className="sub-menu-item"><Link to={"/marble_stat?username="+context.username}><RiFolderVideoFill />My Game Record</Link></li>}
              <li className="sub-menu-item"><Link to="/marble_stat"><RiArchiveFill />All Game Record</Link></li>
            </ul>
          </li>

          <li className="menu-item-container">
          <a className="menu-item"><RiBillFill /><b className="menu-name">Post</b></a>
            <ul className="sub-menu"  onClick={closeNavbar}>
              <li className="sub-menu-item"> <Link to="/board" reloadDocument><RiCompass3Line />View Posts</Link></li>
              {loggedin &&  <li className="sub-menu-item"><Link to="/writepost"><RiBallPenFill />Write Post</Link></li>}
            </ul>
          </li>


          {loggedin && <>
            <li className="menu-item-container" >
            <a className="menu-item"><RiTeamFill /><b className="menu-name">Social</b></a>
              <ul className="sub-menu"  onClick={closeNavbar}>
              <li className="sub-menu-item"><Link to="/friends"><RiTeamFill/>Friends</Link></li>
                <li className="sub-menu-item"><Link to="/"><RiNewspaperFill />Newsfeed</Link></li>
                <li className="sub-menu-item"><Link to="/chat"><RiMessage2Fill/>Chat</Link></li>
              </ul>
            </li>
            <li  onClick={closeNavbar}> 
            <Link className="menu-item" to={"/notification"}>{notiCount >0 && <span className="badge">{notiCount}</span>}<RiNotification2Fill/><b className="menu-name">Notifications</b></Link>
            </li>
          </>}
          
        </ul>
      </nav>
        <div className="bottom"  onClick={closeNavbar}>
            {!loggedin && !isOpenInMobile && (<>
                <button className="button gray" ><Link to={'/register'}>Register</Link></button>
                <button className="button"><Link to={'/login'}>Login</Link></button>
            </>)}
            {loggedin && <Link className="menu-item menu-item-small" to={"/user/"+context.username}><RiAccountCircleFill /><b className="menu-name">My Profile</b></Link>}
           
            <Link className="menu-item menu-item-small" to={"/setting"} ><RiSettings5Fill /><b className="menu-name">Setting</b></Link>
            {/* <Link to="/status" className="menu-item menu-item-small" ><RiBroadcastFill /><b className="menu-name">Status</b></Link> */}
        </div>
    </div>)
}