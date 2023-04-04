import { Indicator } from "./Indicator"

export class PlayerRecord{
    indicator:Indicator
    character:number
    isWinner:boolean
    coreItemBuild:number[]
    team:boolean
    constructor(indicator:Indicator,items:number[],team:boolean){
        this.indicator=indicator
        this.coreItemBuild=items
        this.character=indicator.character
        this.isWinner=indicator.isWinner
        this.team=team
    }
}
