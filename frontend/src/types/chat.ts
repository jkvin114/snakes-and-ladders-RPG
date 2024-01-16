
export interface IChatRoom{
    _id:string
    name:string
    size:number
}
export interface IChatUser{
    _id:string
    profileImgDir:string
     username:string
}
export interface IChatMessage{
    profileImgDir?:string
    username?:string
    content?:string
    serial:number
    createdAt?:string
    unread:number
}

export interface IMessageData{
    messages:IChatMessage[]
    userLastSerials:number[]

    //serial number of a message that is just received. This message`s unread count will be displayed directly without other calculation.
    freshMsgSerial?:number 
}