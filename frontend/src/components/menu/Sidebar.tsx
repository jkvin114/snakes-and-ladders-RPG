import { Link, useNavigate } from "react-router-dom";
import "../../styles/sidebar.scss"
import { RiAccountCircleFill, RiArchiveFill, RiBallPenFill, RiBarChartFill, RiBillFill, RiBroadcastFill, RiCloseLine, RiCompass3Line, RiEyeFill, RiFolderVideoFill, RiHome4Fill, RiMessage2Fill, RiNewspaperFill, RiNotification2Fill, RiPieChartFill, RiPlayFill, RiSettings5Fill, RiStockLine, RiTeamFill, RiTrophyFill, RiUserReceived2Fill } from "react-icons/ri";
import { TbWorldQuestion } from "react-icons/tb";
import { GrGamepad } from "react-icons/gr";
import { useContext, useState } from "react";
import { RootContext } from "../../context/context";
import { LocaleContext } from "../../context/localeContext";
import Text from "../Text"
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
        <Link className="menu-item"  to="/"><RiHome4Fill/><b className="menu-name"><Text lkey="generic.home"></Text></b></Link>
        </li>
          <li className="menu-item-container">
            <a className="menu-item"><img src="/favicon.png"></img><b className="menu-name">RPG Game</b></a>
            <ul className="sub-menu"  onClick={closeNavbar}>
              <li className="sub-menu-item"><Link to="/create_game?type=rpg"><GrGamepad /><Text lkey="sidebar.rpggame.create"/></Link></li>
              <li className="sub-menu-item"><a href="/find_room"><RiUserReceived2Fill /><Text lkey="sidebar.rpggame.join"/></a></li>
              <li className="sub-menu-item"><a href="/spectate"><RiEyeFill /><Text lkey="sidebar.rpggame.spectate"/></a></li>
              {loggedin && <li className="sub-menu-item"><Link to={"/rpg_stat?username="+context.username}><RiFolderVideoFill /><Text lkey="sidebar.rpggame.my"/></Link></li>}
              <li className="sub-menu-item"><a href="/stat?page=game"><RiArchiveFill /><Text lkey="sidebar.rpggame.all"/></a></li>
              <li className="sub-menu-item"><a href="/stat?page=analysis"><RiBarChartFill /><Text lkey="sidebar.rpggame.analysis"/></a></li>
              <li className="sub-menu-item"><a href="https://jkvin114.github.io/Snakes-and-Ladders-RPG-wiki/index.html"><TbWorldQuestion /><Text lkey="sidebar.rpggame.wiki"/></a></li>
            </ul>
          </li>
          <li className="menu-item-container">
            <a className="menu-item"><img src="/stock.png"></img><b className="menu-name">Stock Game</b></a>
            <ul className="sub-menu"  onClick={closeNavbar}>
              {loggedin &&<li className="sub-menu-item"><Link to="/stockgame/mypage"><RiAccountCircleFill /><Text lkey="sidebar.stockgame.my"/></Link></li>}
              <li className="sub-menu-item"><Link to="/stockgame/play"><GrGamepad /><Text lkey="sidebar.stockgame.play"/></Link></li>
              {/* <li className="sub-menu-item"><Link to="/"><RiTrophyFill />Play Ranked</Link></li> */}
              {/* {loggedin && <li className="sub-menu-item"><Link to="/"><RiFolderVideoFill />Game Record</Link></li>} */}
              <li className="sub-menu-item"><Link to="/stockgame/leaderboard"><RiBarChartFill /><Text lkey="sidebar.stockgame.leaderboard"/></Link></li>
            </ul>
          </li>

          <li className="menu-item-container">
          <a className="menu-item"><img src="/res/img/marble/icon.jpg"></img><b className="menu-name"><Text lkey="sidebar.marblegame.marble"/></b></a>
            <ul className="sub-menu"  onClick={closeNavbar}>
              <li className="sub-menu-item"><Link to="/create_game?type=marble"><GrGamepad /><Text lkey="sidebar.marblegame.create"/></Link></li>
              <li className="sub-menu-item"><a href="/find_room"><RiUserReceived2Fill /><Text lkey="sidebar.marblegame.join"/></a></li>
              {loggedin && <li className="sub-menu-item"><Link to={"/marble_stat?username="+context.username}><RiFolderVideoFill /><Text lkey="sidebar.marblegame.my"/></Link></li>}
              <li className="sub-menu-item"><Link to="/marble_stat"><RiArchiveFill /><Text lkey="sidebar.marblegame.all"/></Link></li>
            </ul>
          </li>

          <li className="menu-item-container">
          <a className="menu-item"><RiBillFill /><b className="menu-name"><Text lkey="sidebar.post"/></b></a>
            <ul className="sub-menu"  onClick={closeNavbar}>
              <li className="sub-menu-item"> <Link to="/board" reloadDocument><RiCompass3Line /><Text lkey="sidebar.viewpost"/></Link></li>
              {loggedin &&  <li className="sub-menu-item"><Link to="/writepost"><RiBallPenFill /><Text lkey="sidebar.writepost"/></Link></li>}
            </ul>
          </li>


          {loggedin && <>
            <li className="menu-item-container" >
            <a className="menu-item"><RiTeamFill /><b className="menu-name"><Text lkey="sidebar.social"/></b></a>
              <ul className="sub-menu"  onClick={closeNavbar}>
              <li className="sub-menu-item"><Link to="/friends"><RiTeamFill/><Text lkey="sidebar.friend"/></Link></li>
                <li className="sub-menu-item"><Link to="/"><RiNewspaperFill /><Text lkey="sidebar.newsfeed"/></Link></li>
                <li className="sub-menu-item"><Link to="/chat"><RiMessage2Fill/><Text lkey="sidebar.chat"/></Link></li>
              </ul>
            </li>
            <li  onClick={closeNavbar}> 
            <Link className="menu-item" to={"/notification"}>{notiCount >0 && <span className="badge">{notiCount}</span>}<RiNotification2Fill/><b className="menu-name"><Text lkey="sidebar.noti"/></b></Link>
            </li>
          </>}
          
        </ul>
      </nav>
        <div className="bottom"  onClick={closeNavbar}>
            {!loggedin && !isOpenInMobile && (<>
                <button className="button gray" ><Link to={'/register'}><Text lkey="generic.register"/></Link></button>
                <button className="button"><Link to={'/login'}><Text lkey="generic.login"/></Link></button>
            </>)}
            {loggedin && <Link className="menu-item menu-item-small" to={"/user/"+context.username}><RiAccountCircleFill /><b className="menu-name"><Text lkey="sidebar.myprofile"/></b></Link>}
           
            <Link className="menu-item menu-item-small" to={"/setting"} ><RiSettings5Fill /><b className="menu-name"><Text lkey="generic.setting"/></b></Link>
            {/* <Link to="/status" className="menu-item menu-item-small" ><RiBroadcastFill /><b className="menu-name">Status</b></Link> */}
        </div>
    </div>)
}