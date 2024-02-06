export interface IStockGameTransaction{
    time:number
    type:"BUY"|"SELL"
    amount:number
    profit?:number
    date:string
    price:number
}

/**
 * request model when posting a new game result
 */
export interface IStockGameResult{
    score:number
    initialMoney:number
    finaltotal:number
    transactionHistory:IStockGameTransaction[]
    seed:string
    chartgenVersion:string
    variance:number
    scale:number
    username:string
    delistAt?:number
}
export interface IPassedFriend {
	username: string
	score: number
	userId: string
}
/**
 * response model after posting a game result
 */
export interface IStockGameResultResponse {
	_id: string
	score: number
	passedFriends: IPassedFriend[]
	better: number
	total: number
	isNewBest: boolean
    friendRanking:number
    
}


interface ITransactionHistory{
	time:number
	type:string
	price:number
	amount:number
	profit:number
	date:string
}
export interface IStockGameUserRecordResponse {
	score:number
	initialMoney:number
	finaltotal:number
	user:string
	transactionHistory:ITransactionHistory[],
	delistAt?:number
	_id:string
	createdAt:string
	updatedAt:string
}
export interface IStockGameBestScoreResponse{
	_id:string
	createdAt:string
	updatedAt:string
	score:number
	game:string
	user:string
	username:string
	loggedIn:boolean
	isRecent:boolean
}
export interface IStockGameBestScoreResponsePopulated{
	_id:string
	createdAt:string
	updatedAt:string
	score:number
	game:{
		initialMoney:number
		finaltotal:number
		delistAt?:number
	}
	user:string
	username:string
	loggedIn:boolean
	isRecent:boolean
}
export interface ScorePosition{
	total:number
	better:number
}