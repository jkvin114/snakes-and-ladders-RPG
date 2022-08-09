import { AbilityStorage } from "./Ability/AbilityStorage"
import { EVENT_TYPE } from "./Ability/EventType"
import { Action } from "./action/Action"
import { ActionTrace } from "./action/ActionTrace"
import { ABILITY_NAME } from "./Ability/AbilityRegistry"
import { AbilityValues } from "./Ability/AbilityValues"
import { cl } from "./util"
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
    num:number  //index of this player in player array
    private pendingActions:Action[]
    private savedDefenceCardAbility:ABILITY_NAME
    private abilityStorage:AbilityStorage
    private statusEffect:Set<string>
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
        this.cycleLevel=1 //start with 1
        this.pendingActions=[]
        this.savedDefenceCardAbility=ABILITY_NAME.NONE
        this.abilityStorage=new AbilityStorage()
        this.statusEffect=new Set<string>()
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

    // sampleAbility(ability:string){
    //     return false
    // }
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
        this.pos=(this.pos+64)%32
    }
    onDouble(){
        this.doubles+=1
    }
    onTripleDouble(){
        this.doubles=0
    }
    resetDoubleCount(){
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
    onPassStartTile(){
        this.cycleLevel+=1
    }
    onTurnStart(){
        this.doubles=0
    }
    getBuildDiscount(){
        return 1 - (this.stat.buildingPriceDiscount * 0.005)
    }
    getTollDiscount(){
        return 1 - (this.stat.tollDiscount * 0.005)
    }
    getBuyoutDiscount(){
        return 1 - (this.stat.buyoutDiscount * 0.005)
    }
    getDiceControlChance(){
        return this.stat.diceControl * 0.008
    }
    getGoldFortuneChance(){
        return (this.stat.goldenCard * 0.02)
    }
   
    getSavedCard(){
        return this.savedDefenceCardAbility
    }
    saveCardAbility(ability:ABILITY_NAME){
        this.abilityStorage.removeTemporary(this.savedDefenceCardAbility)
        this.savedDefenceCardAbility=ability
        this.abilityStorage.addTemporary(ability,new AbilityValues())
    }
    useCard(){
        this.abilityStorage.removeTemporary(this.savedDefenceCardAbility)
        this.savedDefenceCardAbility=ABILITY_NAME.NONE
    }
    useAbility(name:ABILITY_NAME){
        this.abilityStorage.use(name)
    }
    sampleAbility(event:EVENT_TYPE,source:ActionTrace):Map<ABILITY_NAME,AbilityValues>{
        return this.abilityStorage.getAbilityForEvent(event,source)
    }
    registerPermanentAbilities(abilities: [ABILITY_NAME, AbilityValues][]){
        this.abilityStorage.registerPermanent(...abilities)
    }
    getAbilityString(){
        return this.abilityStorage.getAbilityString()
    }
    getAbilityStringOf(name:ABILITY_NAME){
        return this.abilityStorage.getAbilityStringOf(name)
    }
    upgradeAbility(){
        return this.abilityStorage.upgradeAbility()
    }
    canBuildLandOfMinimumPrice(price:number){
        return price * this.getBuildDiscount() < this.money
    }
    applyEffect(effect:string){
        this.statusEffect.add(effect)
    }
    hasEffect(effect:string){
        return this.statusEffect.has(effect)
    }
    clearEffect(effect:string){
        return this.statusEffect.delete(effect)
    }

    canLoan(amt:number){
        return !this.hadLoan
    }
    onLoan(){
        this.hadLoan=true
        this.money=0
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
        this.goldenCard=stats[4]
    }
}
export {MarblePlayer,MarblePlayerStat}