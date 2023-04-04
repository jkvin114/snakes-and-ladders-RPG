import { Indicator } from "./Indicator"
import { PlayerRecord } from "./PlayerRecord"


export class GameRecord{
    players:PlayerRecord[]
    totalturn:number
    map:string
    isTeam:boolean

    constructor(totalturn:number,map:string,isTeam:boolean){
        this.totalturn=totalturn
        this.map=map
        this.players=[]
        this.isTeam=isTeam
    }
    add(indicator:Indicator,items:number[],team:boolean){
        this.players.push(new PlayerRecord(indicator,items,team))
    }
}