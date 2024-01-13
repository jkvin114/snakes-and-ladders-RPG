
type Props={
    profileImgDir?:string
    username?:string
}
export default function ProfileImage({profileImgDir,username}:Props){
    return (<div
        className={
            "profileimg-container divlink" + (!profileImgDir || profileImgDir === "" ? " " : " has-img")
        }>
        {!profileImgDir || profileImgDir === "" ? (
            <b>{username && username.charAt(0).toUpperCase()}</b>
        ) : (
            <img className="profileimg" src={"/uploads/profile/" + profileImgDir}></img>
        )}
    </div>)
}