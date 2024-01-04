import { useEffect, useState } from "react"
import { backend_url } from "../../variables"
import "../../styles/status.css"
interface IStatus{
    db:string
    rpg:string
    marble:string

    dbconnect:boolean,
    rpgconnect:boolean
    marbleconnect:boolean
}

export default function StatusPage(){

    const [status,setStatus] = useState<IStatus>()
    const statuscodes = new Map()
    .set(0,"Disconnected")
    .set(1,"Connected")
    .set(2,"Connecting")
    .set(3,"Disconnecting")
    .set(99,"Uninitialized")

    function ping(){
        fetch(backend_url+"/ping")
        .then((res) => res.json())
        .then(({ mongodb ,marblegame,rpggame}) =>{
              setStatus({
                  db:statuscodes.get(mongodb),
                  dbconnect:mongodb===1,
                  rpg:rpggame>=0?`Avaliable (${rpggame}ms)`:"Unavaliable",
                  rpgconnect:rpggame>=0,
                  marble:marblegame>=0?`Avaliable (${marblegame}ms)`:"Unavaliable",
                  marbleconnect:marblegame>=0
              })
        });
    }
    useEffect(ping,[]);
    
    return ( <div id="statuspage">
        <h1>Status</h1>
            <div>
                <h4>Database</h4>
                <h4 className={status?.dbconnect?"status":"status red"}>{status?status.db:"Disconnected"}</h4>
                <h4>RPG Game Server</h4>
                <h4 className={status?.rpgconnect?"status":"status red"}>{status?status.rpg:"Disconnected"}</h4>
                <h4>Marble Game Server</h4>
                <h4 className={status?.marbleconnect?"status":"status red"}>{status?status.marble:"Disconnected"}</h4>
            </div>
            <div>
                <button onClick={ping}>Refresh</button>
                <br></br>
                <a href="/">Home</a>
            </div>
    </div>)
}