
class MonopolyState{
    colorMonopolies:number
    landsUntilLineMP:number
    buyableLandsUntilLineMP:number
    landsUntilTripleMP:number
    buyableLandsUntilTripleMP:number
    landsUntilSightMP:number
    buyableLandsUntilSightMP:number

    constructor(){

    }
}

export class PlayerState{
    // lands:Set<number>
    // landmarks:Set<number>

    money:number
    totalAsset:number
    totalToll:number
    landmarks:number
    lands:number
    angelCard:boolean
    shieldCard:boolean
    discountCard:boolean
    canLoan:boolean
    retired:boolean
    monopolyState:MonopolyState
    stats:number[]

    constructor(){
         this.monopolyState=new MonopolyState()
         this.stats=[]
    }
}