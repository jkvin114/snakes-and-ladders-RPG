
export interface IFriend{
    profileImgDir:string
    username:string
    email:string
    status?:string
}
export interface IFollow{
    profileImgDir:string
    username:string
    email:string
    isMyFollowing?:boolean
}