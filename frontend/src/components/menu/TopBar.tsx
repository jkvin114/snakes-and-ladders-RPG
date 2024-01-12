import { RiAccountCircleFill, RiMenuFill } from "react-icons/ri"
import "../../styles/topbar.scss"
import { Link } from "react-router-dom"

type Props={
    openNavbar:React.Dispatch<React.SetStateAction<boolean>>
}
export default function TopBar({openNavbar}:Props){
    return (<div id="topbar">
        <div>
            <RiMenuFill onClick={()=>openNavbar(true)} />
        </div>
        <div>
            <Link to={"/"}><img src="/res/img/ui/logo3.png"></img></Link>
            
        </div>
        <div>
            <Link to={"/user"}><RiAccountCircleFill /></Link>
            
        </div>
        </div>)
}