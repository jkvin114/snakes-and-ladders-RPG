import { ReactNode } from "react"

type Props={
    profileImgDir?:string
    username?:string
    customImage?:ReactNode
}
export default function ProfileImage({profileImgDir,username,customImage}:Props){
    return (<div
        className={
            "profileimg-container divlink" + (!profileImgDir || profileImgDir === "" ? " " : " has-img")
        }>
        {customImage && customImage}
        {
            !customImage && (!profileImgDir || profileImgDir === "" ? (
                <b>{username && username.charAt(0).toUpperCase()}</b>
            ) : (
                <img className="profileimg" src={"/uploads/profile/" + profileImgDir}></img>
            ))
        }
        
    </div>)
}