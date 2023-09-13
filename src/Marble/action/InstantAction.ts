import { Action, ACTION_TYPE, MOVETYPE } from "./Action"
import type { ActionTrace } from "./ActionTrace"
import { BuildableTile } from "./../tile/BuildableTile"
import type { MarbleGame } from "../Game"
import { BUILDING } from "../tile/Tile"

/**
 * 즉시 실행됨(통행료지불,배수변화,자동건설,디버프,향수 등)
 */
 export abstract class InstantAction extends Action {
	abstract execute(game:MarbleGame):void
	category: string
	constructor(type:ACTION_TYPE, turn: number) {
		super(type,turn)
		this.category="instant"
	}
}
export class GameOverAction extends InstantAction{
	rewards:number[]
	winType:string
	constructor(winner:number,winType:string,rewards:number[]){
		super(ACTION_TYPE.GAMEOVER,winner)
		this.priority=Action.PRIORITY_IMMEDIATE
		this.rewards=rewards
		this.winType=winType
	}
	execute(game: MarbleGame): void {
		
	}
}


export class SimpleInstantAction extends InstantAction{
	
	constructor(type:ACTION_TYPE) {
		super(type,-1)
	}
	execute(game: MarbleGame): void {
		game.runSimpleInstantAction(this.type)
	}
}

export class SendMessageAction extends InstantAction{
	
    message:string
	constructor(player: number,message:string) {
		super(ACTION_TYPE.MESSAGE,player)
        this.message=message
	}
	execute(game: MarbleGame): void {
		game.eventEmitter.sendMessage(this.turn,this.message)
	}
}
export class IndicateDefenceAction extends InstantAction{
	
    defencetype:string
	pos:number
	constructor(defencetype:string,pos:number) {
		super(ACTION_TYPE.INDICATE_DEFENCE,-1)
        this.defencetype=defencetype
		this.priority=Action.PRIORITY_IMMEDIATE
		this.pos=pos
	}
	execute(game: MarbleGame): void {
		game.eventEmitter.indicateDefence(this.defencetype,this.pos)
	}
}
export class ClaimTollAction extends InstantAction{
	
    tile:BuildableTile
	constructor(payer: number,tile:BuildableTile) {
		super(ACTION_TYPE.CLAIM_TOLL,payer)
        this.tile=tile
	}
	execute(game: MarbleGame): void {
		game.mediator.claimToll(this.turn, this.tile.owner, this.tile, this.source)
	}
}
export class ClaimBuyoutAction extends InstantAction{
    tile:BuildableTile
	constructor(payer: number,tile:BuildableTile) {
		super(ACTION_TYPE.CLAIM_BUYOUT,payer)
        this.tile=tile
	}
	execute(game: MarbleGame): void {
		game.mediator.claimBuyOut(this.turn,this.tile, this.source)
	}

}
export class EarnMoneyAction extends InstantAction {
    amount:number
	constructor(receiver:number,amount:number) {
		super(ACTION_TYPE.EARN_MONEY,receiver)
        this.amount=amount
		this.priority=Action.PRIORITY_IMMEDIATE
	}
	applyMultiplier(mul: number): void {
		console.log("applyMultiplier")
		this.amount = this.amount * mul
		if(mul===0) this.off()
	}
	setValue(val: number): void {
		this.amount=val
		if(val===0) this.off()
	}
	execute(game: MarbleGame): void {
		game.mediator.earnMoney(this.turn, this.amount)
	}
}

export class PayMoneyAction extends InstantAction {
    amount:number
	receiver:number
	constructor(payer: number,receiver:number,amount:number) {
		super(ACTION_TYPE.PAY_MONEY,payer)
        this.amount=amount
		this.receiver=receiver
		this.priority=Action.PRIORITY_IMMEDIATE
	}
	applyMultiplier(mul: number): void {
		this.amount = this.amount * mul
		if(mul===0) this.off()
	}
	setValue(val: number): void {
		this.amount=val
		if(val===0) this.off()
	}
	execute(game: MarbleGame): void {
		game.mediator.payMoney(this.turn, this.receiver, this.amount, this.source,"pay")
	}
}
export class PayTollAction extends PayMoneyAction {
	constructor(payer: number,receiver:number,amount:number) {
		super(payer,receiver,amount)
		this.priority=Action.PRIORITY_NORMAL
	}
	execute(game: MarbleGame): void {
		game.mediator.payMoney(this.turn, this.receiver, this.amount, this.source,"toll")
	}
}
export class AddMultiplierAction extends InstantAction {
	
	pos:number
	count:number
	constructor(turn:number,pos:number,count:number) {
		super(ACTION_TYPE.ADD_MULTIPLIER,turn)
		this.priority=Action.PRIORITY_IMMEDIATE
		this.pos=pos
		this.count=count
	}
	execute(game: MarbleGame): void {
		game.addMultiplierToTile(this.pos,this.count)
	}
}
export class LandModifierAction extends InstantAction {
	
	val:number
	modifierType:string
	pos:number
	constructor(turn:number,pos:number,type:string,val?:number) {
		super(ACTION_TYPE.ADD_MULTIPLIER,turn)
		this.priority=Action.PRIORITY_IMMEDIATE
		this.modifierType=type
		this.pos=pos

		if(val)
			this.val=val
	}
	execute(game: MarbleGame): void {
		game.modifyLand(this.pos,this.modifierType,this.val)
	}
}
export class StealMultiplierAction extends InstantAction {
	dest:number
	from:number
	constructor(turn:number,from:number,dest:number) {
		super(ACTION_TYPE.STEAL_MULTIPLIER,turn)
		this.priority=Action.PRIORITY_IMMEDIATE
		this.from=from
		this.dest=dest
	}
	execute(game: MarbleGame): void {
		game.stealMultiplier(this.turn,this.from,this.dest)
		// game.addMultiplierToTile(this.pos,this.count)
	}
}
export class AutoBuildAction extends InstantAction {
	builds:BUILDING[]
	pos:number
	constructor(turn: number,pos:number,builds:BUILDING[]) {
		super(ACTION_TYPE.AUTO_BUILD,turn)
		this.priority=Action.PRIORITY_IMMEDIATE
		this.pos=pos
		this.builds=builds
	}
	execute(game: MarbleGame): void {
		game.autoBuild(this.turn,this.pos,this.builds,this.source)
	}
}
export class PayPercentMoneyAction extends InstantAction {
	private percent:number
	receiver:number
	constructor(payer: number,receiver:number,percent:number) {
		super(ACTION_TYPE.PAY_MONEY,payer)
		this.priority=Action.PRIORITY_IMMEDIATE
		this.receiver=receiver
		this.percent=percent
	}
	getAmount(base:number){
		return Math.floor(base * this.percent * 0.01)
	}
	execute(game: MarbleGame): void {
		game.mediator.payPecentMoney(this)
	}
}
export class BuyoutAction extends InstantAction{
    private price:number
	private tile:BuildableTile
	constructor(turn: number,tile:BuildableTile,price:number) {
		super(ACTION_TYPE.BUYOUT,turn)
        this.price=price
		this.tile=tile
	}
	applyMultiplier(mul: number): void {
		this.price = this.price * mul
	}
	execute(game: MarbleGame): void {
		game.mediator.buyOut(this.turn, this.tile.owner, this.price, this.tile, this.source)
	}
}
export class ArriveTileAction extends InstantAction{
    pos:number
	constructor(turn: number,pos:number) {
		super(ACTION_TYPE.ARRIVE_TILE,turn)
        this.pos=pos
	}
	execute(game: MarbleGame): void {
		game.arriveTile(this)
	}
}
export class TileAttackAction extends InstantAction{
    tile:BuildableTile
	name:string
	landChangeTile:BuildableTile|null
	constructor(turn: number,tile:BuildableTile,name:string) {
		super(ACTION_TYPE.ATTACK_TILE,turn)
		this.tile=tile
		this.name=name
		this.landChangeTile=null
	}
	setLandChangeTile(tile:BuildableTile){
		this.landChangeTile=tile
		return this
	}
	execute(game: MarbleGame): void {
		game.attackTile(this)
	}
}
export class PrepareTravelAction extends InstantAction{
	constructor(turn: number) {
		super(ACTION_TYPE.PREPARE_TRAVEL,turn)
		this.duplicateAllowed=false
	}
	execute(game: MarbleGame): void {
		game.requestTravel(this)
	}
}
export class ApplyPlayerEffectAction extends InstantAction{
	effect:string
	constructor(turn: number,effect:string) {
		super(ACTION_TYPE.APPLY_PLAYER_EFFECT,turn)
		this.effect=effect
	}
	execute(game: MarbleGame): void {
		game.applyPlayerEffect(this.turn,this.effect)
	}
}
export class CreateBlackholeAction extends InstantAction{
	blackpos:number
	whitepos:number
	constructor(turn: number,blackpos:number,whitepos:number) {
		super(ACTION_TYPE.CREATE_BLACKHOLE,turn)
		this.blackpos=blackpos
		this.whitepos=whitepos
		this.priority=Action.PRIORITY_IMMEDIATE
	}
	execute(game: MarbleGame): void {
		game.createBlackHole(this.blackpos,this.whitepos)
	}
}
export class ChangeLandOwnerAction extends InstantAction{
	pos:number
	owner:number
	constructor(turn: number,pos:number,owner:number) {
		super(ACTION_TYPE.CREATE_BLACKHOLE,turn)
		this.pos=pos
		this.owner=owner
		this.priority=Action.PRIORITY_IMMEDIATE
	}
	execute(game: MarbleGame): void {
		game.setPositionOwner(this.pos,this.owner)
	}
}

export class ActionModifier extends InstantAction{
	static readonly TYPE_OFF=0
	static readonly TYPE_BLOCK=1
	static readonly TYPE_MULTIPLY_VALUE=2
	static readonly TYPE_SET_VALUE=3	
	readonly actionToModify:string
	readonly value:number 
	readonly modifyType:number
	constructor(turn: number,actionToModify:string,type:number,value?:number){
		super(ACTION_TYPE.MODIFY_OTHER,turn)
		this.actionToModify=actionToModify
		this.modifyType=type
		this.value=(value===undefined ? 1 : value)

	}
	modify(action:Action){
		if(action.getId()!==this.actionToModify) return

		if(this.modifyType===ActionModifier.TYPE_BLOCK) action.block()
		else if(this.modifyType===ActionModifier.TYPE_OFF) action.off()
		else if(this.modifyType===ActionModifier.TYPE_MULTIPLY_VALUE) action.applyMultiplier(this.value)
		else if(this.modifyType===ActionModifier.TYPE_SET_VALUE) action.setValue(this.value)
		return action
	}
	execute(game: MarbleGame): void {
		game.modifyActionWith(this)
	}
}

export class RequestMoveAction extends InstantAction{
	
	pos:number
	moveType:MOVETYPE
	forward:boolean
	constructor(turn: number,pos:number,type:MOVETYPE){
		super(ACTION_TYPE.REQUEST_MOVE,turn)
		this.pos=pos
		this.moveType=type
		this.forward=true
	}
	reverseDirection(){
		this.forward=false
		return this
	}
	execute(game: MarbleGame): void {
		game.requestMove(this.turn,this.pos,this.source,this.moveType)
		
	}
}
