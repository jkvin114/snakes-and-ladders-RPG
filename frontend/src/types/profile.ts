
export interface IFriend{
    profileImgDir:string
    username:string
    email:string
    status?:string
	_id:string
}
export interface IFollow{
	_id:string
    profileImgDir:string
    username:string
    email:string
    isMyFollowing?:boolean
}
export interface IUserProfile {
	isFriend: boolean
	requestedFrield:boolean
	isFollowing: boolean
	username: string
	email: string
	profile: string
	isme: boolean
	isadmin: boolean
	isLogined: boolean
	counts: number[] //length = 7
	id:string
}