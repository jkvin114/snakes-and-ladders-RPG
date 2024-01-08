import { IChatMessage, IChatUser } from "../types/chat"

export namespace ChatStorage{
    export function maxSerial(roomId:string){
        let maxSerial = localStorage.getItem(`chat-${roomId}-serial-max`)
        let max = maxSerial?Number(maxSerial):0
        return max
    }
    export function storeMessage(roomId:string,message:IChatMessage,user:IChatUser){
        
        localStorage.setItem(`chat-${roomId}-${message.serial}`,JSON.stringify({
            message:message.message,
            username:user.username,
            profileImgDir:user.profileImgDir,
            createdAt:message.createdAt,
            serial:message.serial
        } as IChatMessage))
        localStorage.setItem(`chat-${roomId}-${message.serial}-unread`,String(message.unread))

        let minSerial = localStorage.getItem(`chat-${roomId}-serial-min`)
        let maxSerial = localStorage.getItem(`chat-${roomId}-serial-max`)
        if(!minSerial || message.serial < Number(minSerial)){
            localStorage.setItem(`chat-${roomId}-serial-min`,String(message.serial))
        }
        if(!maxSerial || message.serial > Number(maxSerial)){
            localStorage.setItem(`chat-${roomId}-serial-max`,String(message.serial))
        }
    }

    export function iterateStoredMsg(roomId:string,func:(msgobj:IChatMessage|null,unread:string|null,i:number)=>void,from?:number,to?:number){
        let minSerial = localStorage.getItem(`chat-${roomId}-serial-min`)
        let maxSerial = localStorage.getItem(`chat-${roomId}-serial-max`)
        let min = minSerial?Number(minSerial):0
        let max = maxSerial?Number(maxSerial):0

        if(from) min = from
        if(to) max = to

        for(let i=min;i<=max;++i){
            let data = localStorage.getItem(`chat-${roomId}-${i}`)
            let unread = localStorage.getItem(`chat-${roomId}-${i}-unread`)
            if(!data){
                func(null,unread,i)
                continue
            }
            let msgobj = JSON.parse(data)
            func(msgobj,unread,i)
        }
    }


    export function loadStoredMessages(roomId:string|null):IChatMessage[]{
        let messages:IChatMessage[]=[]
        if(!roomId) return messages

        iterateStoredMsg(roomId,(msgobj,unread,i)=>{
            if(!msgobj) {
                messages.push({
                    serial:i,
                    unread:'0'
                })
            }
            else{
                messages.push({
                    message:msgobj.message,
                    username:msgobj.username,
                    profileImgDir:msgobj.profileImgDir,
                    serial:i,
                    createdAt:msgobj.createdAt,
                    unread:unread
                })
            }
        })
        return messages
    }
    export function decrementUnread(roomId:string,from:number){
        iterateStoredMsg(roomId,(msg,u,i)=>{
            let unread = localStorage.getItem(`chat-${roomId}-${i}-unread`)
            if(unread && !isNaN(Number(unread))){
                localStorage.setItem(`chat-${roomId}-${i}-unread`,String(Number(unread)-1))
            }
        },from)
    }

}