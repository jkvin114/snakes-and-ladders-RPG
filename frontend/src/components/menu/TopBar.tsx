import { RiAccountCircleFill, RiMenuFill } from "react-icons/ri"
import "../../styles/topbar.scss"
import { Link } from "react-router-dom"
import { useContext } from "react"
import { RootContext } from "../../context/context"

type Props={
    openNavbar:React.Dispatch<React.SetStateAction<boolean>>
}
export default function TopBar({openNavbar}:Props){
    const {context} = useContext(RootContext)

    return (<div id="topbar">
        <div>
            <RiMenuFill onClick={()=>openNavbar(true)} />
        </div>
        <div onClick={()=>openNavbar(false)}>
            <Link to={"/"}><img src="/res/img/ui/logo3.png"></img></Link>
            
        </div>
        <div  onClick={()=>openNavbar(false)}>
            {context.loggedin && <Link to={"/user/"+context.username}><RiAccountCircleFill /></Link>}

            {!context.loggedin && <button className="button" ><Link to={'/login'}>Login</Link></button>}
        </div>
        </div>)
}