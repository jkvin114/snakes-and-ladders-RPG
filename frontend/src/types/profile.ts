
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
export interface IUserProfile {
	isFriend: boolean
	isFollowing: boolean
	username: string
	email: string
	profile: string
	isme: boolean
	isadmin: boolean
	isLogined: boolean
	counts: number[] //length = 7
}