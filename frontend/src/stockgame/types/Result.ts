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
