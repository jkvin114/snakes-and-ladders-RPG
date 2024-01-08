
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
    message?:string
    serial:number
    createdAt?:string
    unread:string|null
}
