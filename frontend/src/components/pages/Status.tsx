import { useContext, useEffect, useState } from "react"
import { backend_url } from "../../variables"
import "../../styles/status.css"
import { RiLoopLeftFill } from "react-icons/ri"
import { LocaleContext } from "../../context/localeContext"
import { lText } from "../../util"
import Text from "../Text"
interface IStatus{
    db:string
    rpg:string
    marble:string

    dbconnect:boolean,
    rpgconnect:boolean
    marbleconnect:boolean
}
const statuscodes = new Map()
    .set(0,"Disconnected")
    .set(1,"Connected")
    .set(2,"Connecting")
    .set(3,"Disconnecting")
    .set(99,"Uninitialized")
export default function StatusPage(){

    const [status,setStatus] = useState<IStatus>()
    const { locale } = useContext(LocaleContext)


    function ping(){
        fetch(backend_url+"/api/ping")
        .then((res) => res.json())
        .then(({ mongodb ,marblegame,rpggame}) =>{
              setStatus({
                  db:mongodb===1?lText(locale,"statuspage.status.on"):lText(locale,"statuspage.status.off"),
                  dbconnect:mongodb===1,
                  rpg:rpggame>=0?`${lText(locale,"statuspage.status.on")} (${rpggame}ms)`:lText(locale,"statuspage.status.off"),
                  rpgconnect:rpggame>=0,
                  marble:marblegame>=0?`${lText(locale,"statuspage.status.on")} (${marblegame}ms)`:lText(locale,"statuspage.status.off"),
                  marbleconnect:marblegame>=0
              })
        });
    }
    useEffect(ping,[]);
    
    return ( <div id="statuspage">
        <h1><Text lkey="statuspage.name"/></h1>
            <div>
                <h4><Text lkey="statuspage.service.db"/></h4>
                <h4 className={status?.dbconnect?"status":"status red"}>{status?status.db:lText(locale,"statuspage.status.none")}</h4>
                <h4><Text lkey="statuspage.service.rpg"/></h4>
                <h4 className={status?.rpgconnect?"status":"status red"}>{status?status.rpg:lText(locale,"statuspage.status.none")}</h4>
                <h4><Text lkey="statuspage.service.marble"/></h4>
                <h4 className={status?.marbleconnect?"status":"status red"}>{status?status.marble:lText(locale,"statuspage.status.none")}</h4>
            </div>
            <div>
                <button onClick={ping} className="button"><RiLoopLeftFill style={{verticalAlign:"middle"}} />
                <Text lkey="generic.refresh"/></button>
                {/* <br></br> */}
                {/* <a href="/">Home</a> */}
            </div>
    </div>)
}