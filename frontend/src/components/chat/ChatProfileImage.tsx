import { ReactNode } from "react"
import ProfileImg from "../ProfileImg"
import e from "express"

type Props={
    profileImgDir?:string
    username?:string
    customImage?:ReactNode
}
export default function ChatProfileImage({profileImgDir,username,customImage}:Props){
    let elem:HTMLElement
    return (<div
        className={
            "profileimg-container" + (!profileImgDir || profileImgDir === "" ? " " : " has-img")
        }>
        {customImage && customImage}
        {
            !customImage && (!profileImgDir || profileImgDir === "" ? (
                <b>{username && username.charAt(0).toUpperCase()}</b>
            ) : (
                <ProfileImg className="profileimg" src={profileImgDir}/>
                // <img className="profileimg" src={"/uploads/profile/" + profileImgDir}></img>
            ))
        }
        
    </div>)
}