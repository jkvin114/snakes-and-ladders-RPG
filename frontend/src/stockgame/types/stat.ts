export interface ILeaderboard{
    createdAt: string
    game:string
    isRecent:boolean
    loggedIn:boolean
    score:number
    updatedAt:string
    username:string
    user?:string
}
export interface IFriendScore{
    user:string,
	username:string,
	profileImgDir:string,
	score?:number,
	game?:string,
}