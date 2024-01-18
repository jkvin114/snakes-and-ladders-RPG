import { AxiosApi } from "./axios";

export function createRoom(type:"rpg"|"marble",isPrivate:boolean,loggedinOnly:boolean,nickname:string,roomname?:string,password?:string,){
    AxiosApi.post("/room/create",{
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
        if (res.status == 307) {
            alert("already in game")
            // window.location.href = "gamepage.html"
        }
    })
    .catch(e=>{
        console.error(e)
        if(e.response.status === 400) alert("Duplicate room name!")
        else if(e.response.status === 500) alert("Service unavaliable")
    })
}