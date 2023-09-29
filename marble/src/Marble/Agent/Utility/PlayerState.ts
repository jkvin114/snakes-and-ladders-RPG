
class MonopolyState{
    colorMonopolies:number
    landsUntilLineMP:number
    buyableLandsUntilLineMP:number
    landsUntilTripleMP:number
    buyableLandsUntilTripleMP:number
    landsUntilSightMP:number
    buyableLandsUntilSightMP:number

    constructor(){
        this.colorMonopolies=0
        this.landsUntilLineMP=0
        this.buyableLandsUntilLineMP=0
        this.landsUntilTripleMP=0
        this.buyableLandsUntilTripleMP=0
        this.landsUntilSightMP=0
        this.buyableLandsUntilSightMP=0
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
         this.money=0
         this.totalAsset=0
         this.totalToll=0
         this.landmarks=0
         this.lands=0
         this.angelCard=false
         this.shieldCard=false
         this.discountCard=false
         this.canLoan=false
         this.retired=false
    }
}