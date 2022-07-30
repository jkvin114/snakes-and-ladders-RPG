import { AbilityStorage } from "./Ability/AbilityStorage"
import { Ability, EmptyAbility } from "./Ability/Ability"
import type { DefenceAbility, DefenceCardAbility } from "./Ability/DefenceAbilty"
import { EVENT_TYPE } from "./Ability/EventType"
import { Action } from "./action/Action"
import { ActionSource } from "./action/ActionSource"
import { DefenceCard, FortuneCard, FortuneCardRegistry } from "./FortuneCard"
import { BuildableTile } from "./tile/BuildableTile"
import { ABILITY_NAME } from "./Ability/AbilityRegistry"
import { AbilityValues } from "./Ability/AbilityValues"
import { ITEM_REGISTRY } from "./ItemRegistry"
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
    private savedDefenceCardAbility:ABILITY_NAME
    private abilityStorage:AbilityStorage
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
        this.savedDefenceCardAbility=ABILITY_NAME.NONE
        this.abilityStorage=new AbilityStorage()
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
    sampleAbility(event:EVENT_TYPE,source:ActionSource):Map<ABILITY_NAME,AbilityValues>{
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
    onArriveEmptyLand(tile:BuildableTile, moveType:ActionSource):ABILITY_NAME[]{
        return [ ]
    }
    onArriveMyLand(tile:BuildableTile, moveType:ActionSource):ABILITY_NAME[]{
        return [ ]
    }
    onArriveToEnemy(source:ActionSource):Map<ABILITY_NAME,AbilityValues>{
        return this.sampleAbility(EVENT_TYPE.ARRIVE_TO_ENEMY,source)
    }
    onEnemyArriveToMe(source:ActionSource):Map<ABILITY_NAME,AbilityValues>{
        return this.sampleAbility(EVENT_TYPE.ENEMY_ARRIVE_TO_ME,source)
    }
    onArriveEnemyLand(tile:BuildableTile, source:ActionSource):ABILITY_NAME[]{
        return [ ]
    }
    onEnemyArriveMyLand(player:MarblePlayer, tile:BuildableTile, source:ActionSource):ABILITY_NAME[]{
        return [ ]
    }
    // getTollDefence(tile:BuildableTile, moveType:ActionSource):Set<ABILITY_NAME>{
    //   //  return this.abilityStorage.getAbilityForEvent(EVENT_TYPE.TOLL_CLAIMED)
    // }
    // getTollOffence(player:MarblePlayer,tile:BuildableTile, moveType:ActionSource):Set<ABILITY_NAME>{
    //   //  return this.abilityStorage.getAbilityForEvent(EVENT_TYPE.CLAIM_TOLL)
    // }
    // buyOutPriceOffence(tile:BuildableTile):Set<ABILITY_NAME>{
    //   //  return this.abilityStorage.getAbilityForEvent(EVENT_TYPE.BUYOUT_CLAIMED)
    // }
    // buyOutPriceDefence(buyer:MarblePlayer, tile:BuildableTile):Set<ABILITY_NAME>{
    //  //   return this.abilityStorage.getAbilityForEvent(EVENT_TYPE.CLAIM_BUYOUT)
    // }
    buyOutOffence(source:ActionSource):ABILITY_NAME[]{
        return [ ]
    }
    buyOutDefence(source:ActionSource):ABILITY_NAME[]{
        return [ ]
    }
    monopolyAlertOffence(spots:number[]):ABILITY_NAME[]{
        return [ ]
    }
    monopolyAlertDefence(spots:number[]):ABILITY_NAME[]{
        return [ ]
    }
    onBuildLandMark(tile:BuildableTile, source:ActionSource):ABILITY_NAME[]{
        return [ ]
    }
    onBuild(tile:BuildableTile,source:ActionSource):ABILITY_NAME[]{
        return [ ]
    }
    onPassEnemy(stayed:MarblePlayer,oldpos:number,newpos:number,source:ActionSource):ABILITY_NAME[]{
        return []
    }
    onEnemyPassesMe(mover:MarblePlayer,oldpos:number,newpos:number,source:ActionSource):ABILITY_NAME[]{
        return []
    }
    // tileAttackOffence(tile:BuildableTile):Set<ABILITY_NAME>{
    //     return this.abilityStorage.getAbilityForEvent(EVENT_TYPE.DO_ATTACK)
    // }
    // tileAttackDefence(tile:BuildableTile):Set<ABILITY_NAME>{
    //     return this.abilityStorage.getAbilityForEvent(EVENT_TYPE.BEING_ATTACKED)
    // }
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
        this.goldenCard=stats[4]
    }
}
export {MarblePlayer,MarblePlayerStat}