
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
