import { Ability } from "./Abilty"
import { Action } from "./action/Action"
import { ActionSource } from "./action/ActionSource"
import { BuildableTile } from "./tile/BuildableTile"

class MarblePlayer{
    readonly name:string
    readonly char:number
    ownedLands:Set<number>
    ownedLandMarks:Set<number>
    stat:MarblePlayerStat
    pos:number
    money:number
    readonly team:boolean
    AI:boolean
    doubles:number
    turn:number
    retired:boolean
    hadLoan:boolean
    oddeven:number
    cycleLevel:number
    num:number
    private pendingActions:Action[]
    constructor(num:number,name:string,char:number,team:boolean,ai:boolean,money:number,stat:MarblePlayerStat){
        this.num=num
        this.turn=0
        this.name=name
        this.char=char
        this.team=team
        this.pos=0
        this.money=money
        this.AI=ai
        this.ownedLands=new Set<number>()
        this.ownedLandMarks=new Set<number>()
        this.stat=stat
        this.doubles=0
        this.retired=false
        this.hadLoan=false
        this.oddeven=3
        this.cycleLevel=3 //start with 1
        this.pendingActions=[]
    }
    addPendingAction(action:Action){
        this.pendingActions.push(action)
    }
    getPendingAction(){
        return this.pendingActions
    }
    clearPendingAction(){
        this.pendingActions=[]
    }

    sampleAbility(ability:string){
        return false
    }
    setTurn(turn:number){
        this.turn=turn
    }
    addLand(land:number){
        this.ownedLands.add(land)
    }
    removeLand(land:number){
        this.ownedLands.delete(land)
    }
    hasLand(land:number){
        this.ownedLands.has(land)
    }
    getNonLandMarkLands():number[]{
        let lands:number[]=[]
        for(const land of this.ownedLands){
            if(!this.ownedLandMarks.has(land))
                lands.push(land)
        }
        return lands
    }
    isEnemy(turn:number){
        return this.turn !==turn
    }

    moveTo(pos:number){
        this.pos=pos
    }
    moveBy(count:number){
        this.pos+=count
        this.pos=this.pos%32
    }
    onDouble(){
        this.doubles+=1
    }
    onTripleDouble(){
        this.doubles=0
    }
    useOddEven(){
        this.oddeven-=1
    }
    getDiceData(){
        return {
            hasOddEven:this.oddeven > 0,origin:this.pos
        }
    }
    onTurnStart(){
        this.doubles=0
    }
    getBuildDiscount(){
        return 0.85
    }
    onArriveEmptyLand(tile:BuildableTile, moveType:ActionSource){
        return new Ability()
    }
    onArriveMyLand(tile:BuildableTile, moveType:ActionSource){
        return new Ability()
    }
    onArriveToEnemy(source:ActionSource){
        return new Ability()
    }
    onEnemyArriveToMe(source:ActionSource){
        return new Ability()
    }
    onArriveEnemyLand(tile:BuildableTile, source:ActionSource){
        return new Ability()
    }
    onEnemyArriveMyLand(player:MarblePlayer, tile:BuildableTile, source:ActionSource){
        return new Ability()
    }
    getTollDefence(tile:BuildableTile, moveType:ActionSource){
        return new Ability()
    }
    getTollOffence(player:MarblePlayer,tile:BuildableTile, moveType:ActionSource){
        return new Ability()
    }
    buyOutPriceOffence(tile:BuildableTile){
        return new Ability()
    }
    buyOutPriceDefence(buyer:MarblePlayer, tile:BuildableTile){
        return new Ability()
    }
    buyOutOffence(source:ActionSource){
        return new Ability()
    }
    buyOutDefence(source:ActionSource){
        return new Ability()
    }
    monopolyAlertOffence(spots:number[]){
        return new Ability()
    }
    monopolyAlertDefence(spots:number[]){
        return new Ability()
    }
    onBuildLandMark(tile:BuildableTile, source:ActionSource){
        return new Ability()
    }
    onBuild(tile:BuildableTile,source:ActionSource){
        return new Ability()
    }
    onPassEnemy(stayed:MarblePlayer,oldpos:number,newpos:number,source:ActionSource){
        return new Ability()
    }
    onEnemyPassesMe(mover:MarblePlayer,oldpos:number,newpos:number,source:ActionSource){
        return new Ability()
    }
    canBuildLandOfMinimumPrice(price:number){
        return price * this.getBuildDiscount() < this.money
    }
        
    canLoan(amt:number){
        return !this.hadLoan
    }
    onLoan(){
        this.hadLoan=true
    }
    takeMoney(amt:number){
        this.money=Math.max(0,this.money-amt)
    }
    earnMoney(amt:number){
        this.money+=amt
    }
    bankrupt(){
        console.log("bankrupt")
        this.retired=true
    }
}
class MarblePlayerStat{
    tollDiscount:number
    buildingPriceDiscount:number
    buyoutDiscount:number
    diceControl:number
    goldenCard:number
    constructor(stats:number[]){
        this.tollDiscount=stats[0]
        this.buildingPriceDiscount=stats[1]
        this.buyoutDiscount=stats[2]
        this.diceControl=stats[3]
        this.goldenCard==stats[4]
    }
}
export {MarblePlayer,MarblePlayerStat}