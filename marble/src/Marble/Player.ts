import { AbilityStorage } from "./Ability/AbilityStorage"
import { EVENT_TYPE } from "./Ability/EventType"
import { Action } from "./action/Action"
import { ActionTrace } from "./action/ActionTrace"
import { ABILITY_NAME } from "./Ability/AbilityRegistry"
import { AbilityAttributes, AbilityValue } from "./Ability/AbilityValues"
import { ServerRequestModel } from "../Model/ServerRequestModel"
import { ActionSelector } from "./Agent/ActionSelector/ActionSelector"
import { PlayerState } from "./Agent/Utility/PlayerState"
import { MONOPOLY } from "./GameMap"
import { AbilityExecution } from "./Ability/Ability"
import { ServerEventModel } from "../Model/ServerEventModel"
import { AbilityTag } from "./Tags"

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
    isAuto:boolean
    doubles:number
    turn:number
    retired:boolean
    hadLoan:boolean
    oddeven:number
    cycleLevel:number
    num:number  //index of this player in player array
    totalBet:number
    monopolyChancePos:Map<number,MONOPOLY> //pos => cost
    items:number[]
    private turnsOnIsland:number
    private pendingActions:Action[]
    private savedDefenceCardAbility:ABILITY_NAME
    private abilityStorage:AbilityStorage
    private statusEffect:Set<string>
    readonly agent:ActionSelector
    constructor(num:number,name:string,char:number,team:boolean,ai:boolean,money:number,stat:MarblePlayerStat,agent:ActionSelector){
        this.num=num
        this.turn=0
        this.name=name
        this.char=char
        this.team=team
        this.pos=0
        this.money=money
        this.AI=ai
        this.isAuto=false
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
        this.turnsOnIsland=0
        this.totalBet=money
        this.agent=agent
        this.monopolyChancePos=new Map<number,number>()
        this.items=[]
    }
    getStateVector(){

    }
    addPendingAction(action:Action){
        this.pendingActions.push(action)
    }
    getPendingAction(){
        return this.pendingActions
    }
    incrementTotalBet(bet:number){
        this.totalBet+=bet
        //console.log(this.totalBet)
    }
    clearPendingAction(){
        this.pendingActions=[]
    }

    // sampleAbility(ability:string){
    //     return false
    // }
    setTurn(turn:number){
        this.turn=turn
        this.agent.setTurn(turn)
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
    stayOnIsland(){
        this.turnsOnIsland+=1
    }
    escapeIsland(){
        this.turnsOnIsland=0
    }
    shouldEscapeIsland(){
        return this.turnsOnIsland >=2
    }
    resetDoubleCount(){
        this.doubles=0
    }
    useOddEven(){
        this.oddeven-=1
    }
    getDiceData():ServerRequestModel.DiceSelection{
        return {
            hasOddEven:this.oddeven > 0,origin:this.pos
        }
    }
    onPassStartTile(){
        this.cycleLevel+=1
    }
    onTurnStart(){
        this.abilityStorage.onTurnStart()
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
        return (this.stat.goldenCard * 0.013)
    }
   
    getSavedCard(){
        return this.savedDefenceCardAbility
    }
    saveCardAbility(ability:ABILITY_NAME){
        this.abilityStorage.removeTemporary(this.savedDefenceCardAbility)
        this.savedDefenceCardAbility=ability
        this.abilityStorage.addTemporary(ability,new AbilityAttributes())
    }
    useCard(){
        this.abilityStorage.removeTemporary(this.savedDefenceCardAbility)
        this.savedDefenceCardAbility=ABILITY_NAME.NONE
    }
    useAbility(name:ABILITY_NAME){
        this.abilityStorage.use(name)
    }
    sampleAbility(event:EVENT_TYPE,source:ActionTrace):Map<ABILITY_NAME,AbilityValue>{
        return this.abilityStorage.getAbilityForEvent(event,source)
    }
    hasOneAbilities(abilities:AbilityTag){
        return this.abilityStorage.hasOneAbilities(abilities)
    }
    getAbilityValueAmount(ability:ABILITY_NAME){
        return this.abilityStorage.getAbilityValueAmount(ability)
    }
    registerPermanentAbilities(abilities: [ABILITY_NAME, AbilityAttributes][],items:number[]){
        this.abilityStorage.registerPermanent(...abilities)
        this.items=items
    }
    getItemDescriptions(){
        return this.abilityStorage.getItemDescriptions()
    }
    getAbilityStringOf(ab:AbilityExecution){
        return this.abilityStorage.getAbilityStringOf(ab)
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
    onLoan(amount:number){
        this.incrementTotalBet(amount)
        this.hadLoan=true
        this.money=0
    }
    takeMoney(amt:number){
        this.money=Math.max(0,this.money-amt)
    }
    earnMoney(amt:number){
        this.money+=amt
    }
    bankrupt(amount:number){
        this.incrementTotalBet(amount)
     //   console.log("bankrupt")
        this.retired=true
    }
    setMonopolyChancePos(pos:number[],type:MONOPOLY){
        for(const p of pos){
            this.monopolyChancePos.set(p,type)
        }
    }
    getResultStat():ServerEventModel.PlayerStat{
        return {
            index:this.num,
            turn:this.turn,
            stats:this.stat.serialize(),
            items:this.items,
            score:0,
            name:this.name,
            char:this.char,
            agentType:this.agent.type
        }
    }

    updateState(state:PlayerState){
        if(state.stats.length===0) state.stats=this.stat.serialize()

        state.money=this.money
        state.angelCard = this.getSavedCard()===ABILITY_NAME.ANGEL_CARD
        state.shieldCard = this.getSavedCard()===ABILITY_NAME.SHIELD_CARD
        state.discountCard = this.getSavedCard()===ABILITY_NAME.DISCOUNT_CARD
        state.canLoan=this.canLoan(0)
        state.landmarks=this.ownedLandMarks.size
        state.lands=this.ownedLands.size
        state.retired=this.retired
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
    serialize(){
        return [this.tollDiscount,this.buildingPriceDiscount,this.buyoutDiscount,this.diceControl,this.goldenCard]
    }
}
export {MarblePlayer,MarblePlayerStat}