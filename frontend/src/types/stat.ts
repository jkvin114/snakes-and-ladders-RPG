export interface RPGPlayerStat {
	player: {
        kill:number,
        death:number,
        assist:number,
        name:string,
        champ:string,
        champ_id:number
        turn:number
        team:boolean
        items:number[]
        bestMultiKill:number
    }
	map: string
	isTeam: boolean
	totalturn: number
	gameId: string
	isWon: boolean
	turn: number
	user: string
	username: string
    createdAt:number
}
