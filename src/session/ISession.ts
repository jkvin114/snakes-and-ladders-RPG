export interface ISession{
    isLogined:boolean
    id:string
    time:Date
    
    userId?:string
    username?:string
    boardDataId?:string
    roomname?:string
    turn?:number
    ip?:string
}
