import { randName } from "../types/names";
import { AxiosApi } from "./axios";

export function createRoom(type:"rpg"|"marble",isPrivate:boolean,loggedinOnly:boolean,nickname?:string,roomname?:string,password?:string,){
    if(nickname==="" || !nickname) nickname = randName()

    //this value will be retrieved in matching page to set nickname of the host
    sessionStorage.nickName = nickname

    AxiosApi.post("/api/room/create",{
        roomname: roomname,
        username: nickname,
        type: type,
        password: password,
        isPrivate: isPrivate,
        loggedinOnly: loggedinOnly,
    })
    .then(res=>{
        console.log(res)
        if (res.status == 201) {
            window.location.href = "/match?gametype=" + type
        }
        
    })
    .catch(e=>{
        console.error(e)
        if (e.response.status == 307) {
            //alert("already in game")
            window.location.href = "/rpggame"
        }
        if(e.response.status === 400) alert("Duplicate room name!")
        else if(e.response.status === 500) alert("Service unavaliable")
    })
}