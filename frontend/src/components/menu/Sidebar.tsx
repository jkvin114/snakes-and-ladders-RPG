import { Link, useNavigate } from "react-router-dom";
import "../../styles/sidebar.scss"
import { RiAccountCircleFill, RiBallPenFill, RiBarChartFill, RiBillFill, RiBroadcastFill, RiCloseLine, RiCompass3Line, RiEyeFill, RiFolderVideoFill, RiHome4Fill, RiMessage2Fill, RiNewspaperFill, RiNotification2Fill, RiPlayFill, RiSettings5Fill, RiStockLine, RiTeamFill, RiTrophyFill, RiUserReceived2Fill } from "react-icons/ri";
import { TbWorldQuestion } from "react-icons/tb";
import { GrGamepad } from "react-icons/gr";
import { useContext, useState } from "react";
import { RootContext } from "../../context/context";

type Props={
    isOpen:boolean
    openNavbar:React.Dispatch<React.SetStateAction<boolean>>
    notiCount:number
}

export default function SideBar({isOpen,openNavbar,notiCount}:Props){
    const {context} = useContext(RootContext)

    const loggedin = context.loggedin

    return (<div id="sidebar" className={isOpen? "mobile-open":""}>
        <nav className="sidebar-content">
        <ul>
            <li className="close-bar-mobile">
                <a className="menu-item menu-item-small" ><RiCloseLine  onClick={()=>openNavbar(false)}/></a>
            </li>
        <li>
        <Link className="menu-item"  to="/"><RiHome4Fill/><b className="menu-name">Home</b></Link>
        </li>
          <li className="menu-item-container">
            <a className="menu-item"><img src="/favicon.png"></img><b className="menu-name">RPG Game</b></a>
            <ul className="sub-menu">
              <li className="sub-menu-item"><a href="/create_game?type=rpg"><GrGamepad />Create Room</a></li>
              <li className="sub-menu-item"><a href="/find_room"><RiUserReceived2Fill />Join</a></li>
              <li className="sub-menu-item"><a href="/spectate"><RiEyeFill />Spectate</a></li>
              <li className="sub-menu-item"><a href="/stat?page=game"><RiFolderVideoFill />Game Record</a></li>
              <li className="sub-menu-item"><a href="/stat?page=analysis"><RiBarChartFill />Analysis</a></li>
              <li className="sub-menu-item"><a href="https://jkvin114.github.io/Snakes-and-Ladders-RPG-wiki/index.html"><TbWorldQuestion />Wiki</a></li>
            </ul>
          </li>
          <li className="menu-item-container">
            <a className="menu-item"><img src="/stock.png"></img><b className="menu-name">Stock Game</b></a>
            <ul className="sub-menu">
              <li className="sub-menu-item"><Link to="/"><GrGamepad />Play</Link></li>
              <li className="sub-menu-item"><Link to="/"><RiTrophyFill />Play Ranked</Link></li>
              <li className="sub-menu-item"><Link to="/"><RiFolderVideoFill />Game Record</Link></li>
              <li className="sub-menu-item"><Link to="/"><RiBarChartFill />Leaderboard</Link></li>
            </ul>
          </li>

          <li className="menu-item-container">
          <a className="menu-item"><img src="/res/img/marble/icon.jpg"></img><b className="menu-name">Marble Game</b></a>
            <ul className="sub-menu">
              <li className="sub-menu-item"><a href="/create_game?type=marble"><GrGamepad />Create Room</a></li>
              <li className="sub-menu-item"><a href="/find_room"><RiUserReceived2Fill />Join</a></li>
              <li className="sub-menu-item"><Link to="/marble_stat"><RiFolderVideoFill />Game Record</Link></li>
            </ul>
          </li>

          <li className="menu-item-container">
          <a className="menu-item"><RiBillFill /><b className="menu-name">Post</b></a>
            <ul className="sub-menu">
              <li className="sub-menu-item"> <Link to="/board" reloadDocument><RiCompass3Line />View Posts</Link></li>
              <li className="sub-menu-item"><Link to="/board"><RiBallPenFill />Write Post</Link></li>
            </ul>
          </li>


          {loggedin && <>
            <li className="menu-item-container">
            <a className="menu-item"><RiTeamFill /><b className="menu-name">Social</b></a>
              <ul className="sub-menu">
              <li className="sub-menu-item"><Link to="/friends"><RiTeamFill/>Friends</Link></li>
                <li className="sub-menu-item"><Link to="/"><RiNewspaperFill />Newsfeed</Link></li>
                <li className="sub-menu-item"><Link to="/chat"><RiMessage2Fill/>Chat</Link></li>
              </ul>
            </li>
            <li>
            <Link className="menu-item" to={"/notification"}>{notiCount >0 && <span className="badge">{notiCount}</span>}<RiNotification2Fill/><b className="menu-name">Notifications</b></Link>
            </li>
          </>}
          
        </ul>
      </nav>
        <div className="bottom">
            {!loggedin && (<>
                <button className="button gray" ><Link to={'/register'}>Register</Link></button>
            <button className="button"><Link to={'/login'}>Login</Link></button>
            </>)}
            {loggedin && <Link className="menu-item menu-item-small" to={"/user"}><RiAccountCircleFill /><b className="menu-name">Profile</b></Link>}
           
            <br></br>
            <a className="menu-item menu-item-small" ><RiSettings5Fill /><b className="menu-name">Setting</b></a>
            <Link to="/status" className="menu-item menu-item-small" ><RiBroadcastFill /><b className="menu-name">Status</b></Link>
        </div>
    </div>)
}