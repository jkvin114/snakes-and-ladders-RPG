import type mongoose from "mongoose"

export interface IFriend {
	_id: mongoose.Types.ObjectId
	profileImgDir: string
	username: string
	email: string
	status?: string
}
export interface IFollow {
	_id: mongoose.Types.ObjectId
	profileImgDir: string
	username: string
	email: string
	isMyFollowing?: boolean
}
export interface ChatMessageModel {
	username?: string
	content?: string
	serial: number
	createdAt?: string
	unread: number
}
export interface IFriendStatus {
	_id: string
	profileImgDir: string
	username: string
	status: string
	lastActive: number //last active UTC milisecond. -1 if unavaliable.
}
export interface IPassedFriend {
	username: string
	score: number
	userId: string
}
export interface IStockGameResultResponse {
	_id: string
	score: number
	passedFriends: IPassedFriend[]
	better: number
	total: number
	isNewBest: boolean
	friendRanking:number
}

export interface IStockGameFriendScore{
    user:string,
	username:string,
	profileImgDir:string,
	score?:number,
	game?:string,
}