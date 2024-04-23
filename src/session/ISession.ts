export interface ISession{
    loggedin:boolean
    id:string
    time:Date
    
    userId?:string
    username?:string
    boardDataId?:string
    roomname?:string
    turn?:number
    ip?:string
}

export interface IUserStatus{
    userId: string; 
    username: string; 
    chatRooms: string[]; 
    sessionIds: string[]; 
    lastActive: Date; 
    sockets: string[];
}
export enum SocketStatus{
   RPGGAME= "rpggame",
   MARBLEGAME="marblegame",
   MATCHING="matching",
   RPGSPECTATE="rpgspectate"
}
export const STATUS_PRIPROTY = [
   SocketStatus.RPGGAME,SocketStatus.MARBLEGAME,SocketStatus.MATCHING,
   SocketStatus.RPGSPECTATE
]
export type SessionProps = "loggedin"|"id"|"time"|"userId"|"username"|"boardDataId"|"roomname"|"turn"|"ip"
