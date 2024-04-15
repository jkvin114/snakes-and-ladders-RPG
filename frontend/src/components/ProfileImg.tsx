import { backend_url } from "../variables"

type Props = {
    className?:string
    src:string
    id?:string
}

export default function ProfileImg({src,className,id}:Props){
    const path = "/resource/profileimage/"+src
    return (<img src={backend_url+ path} className={className} id={id}></img>)
}