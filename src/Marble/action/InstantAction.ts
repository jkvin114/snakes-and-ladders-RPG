import { Action, ACTION_TYPE } from "./Action"
import type { ActionSource } from "./ActionSource"
import { BuildableTile } from "./../tile/BuildableTile"

/**
 * 즉시 실행됨(통행료지불,배수변화,자동건설,디버프,향수 등)
 */
 export class InstantAction extends Action {
	constructor(type:ACTION_TYPE, turn: number,source:ActionSource) {
		super(type,turn,source)
		
	}
}
export class ClaimTollAction extends InstantAction{
    tile:BuildableTile
	constructor(turn: number,source:ActionSource,tile:BuildableTile) {
		super(ACTION_TYPE.CLAIM_TOLL,turn,source)
        this.tile=tile
	}
}
export class ClaimBuyoutAction extends InstantAction{
    tile:BuildableTile
	constructor(turn: number,source:ActionSource,tile:BuildableTile) {
		super(ACTION_TYPE.CLAIM_BUYOUT,turn,source)
        this.tile=tile
	}
}
export class TeleportAction extends InstantAction {
    pos:number
	constructor(type:ACTION_TYPE,turn: number, source:ActionSource,pos:number) {
		super(type,turn,source)
        this.pos=pos
	}
}
export class EarnMoneyAction extends InstantAction {
    amount:number
	constructor(receiver:number, source:ActionSource,amount:number) {
		super(ACTION_TYPE.EARN_MONEY,receiver,source)
        this.amount=amount
		this.priority=Action.PRIORITY_FIRST
	}
	applyMultiplier(mul: number): void {
		// console.log("applyMultiplier")
		this.amount = this.amount * mul
		if(mul===0) this.off()
	}
	setValue(val: number): void {
		this.amount=val
		if(val===0) this.off()
	}
}

export class PayMoneyAction extends InstantAction {
    amount:number
	receiver:number
	constructor(payer: number,receiver:number, source:ActionSource,amount:number) {
		super(ACTION_TYPE.PAY_MONEY,payer,source)
        this.amount=amount
		this.receiver=receiver
		this.priority=Action.PRIORITY_FIRST
	}
	applyMultiplier(mul: number): void {
		this.amount = this.amount * mul
		if(mul===0) this.off()
	}
	setValue(val: number): void {
		this.amount=val
		if(val===0) this.off()
	}
}
export class PayTollAction extends PayMoneyAction {
	constructor(payer: number,receiver:number, source:ActionSource,amount:number) {
		super(payer,receiver,source,amount)
		this.priority=Action.PRIORITY_NORMAL
	}
}
export class PayPercentMoneyAction extends InstantAction {
	percent:number
	receiver:number
	constructor(payer: number,receiver:number, source:ActionSource,percent:number) {
		super(ACTION_TYPE.PAY_MONEY,payer,source)
		this.priority=Action.PRIORITY_FIRST
		this.receiver=receiver
		this.percent=percent
	}
	getAmount(base:number){
		return Math.floor(base * this.percent * 0.01)
	}
}
export class BuyoutAction extends InstantAction{
    price:number
	tile:BuildableTile
	constructor(turn: number,source:ActionSource,tile:BuildableTile,price:number) {
		super(ACTION_TYPE.BUYOUT,turn,source)
        this.price=price
		this.tile=tile
	}
	applyMultiplier(mul: number): void {
		this.price = this.price * mul
	}
}
export class ArriveTileAction extends InstantAction{
    pos:number
	constructor(turn: number,source:ActionSource,pos:number) {
		super(ACTION_TYPE.ARRIVE_TILE,turn,source)
        this.pos=pos
	}
}
export class TileAttackAction extends InstantAction{
    tile:BuildableTile
	name:string
	landChangeTile:BuildableTile|null
	constructor(turn: number,source:ActionSource,tile:BuildableTile,name:string) {
		super(ACTION_TYPE.ATTACK_TILE,turn,source)
		this.tile=tile
		this.name=name
		this.landChangeTile=null
	}
	setLandChangeTile(tile:BuildableTile){
		this.landChangeTile=tile
		return this
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
	constructor(turn: number,source:ActionSource,actionToModify:string,type:number,value?:number){
		super(ACTION_TYPE.MODIFY_OTHER,turn,source)
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
}
export class RequestMoveAction extends InstantAction{
	static readonly TYPE_WALK=0
	static readonly TYPE_FORCE_WALK=1
	static readonly TYPE_TELEPORT=2
	pos:number
	moveType:number
	forward:boolean
	constructor(turn: number,source:ActionSource,pos:number,type:number){
		super(ACTION_TYPE.REQUEST_MOVE,turn,source)
		this.pos=pos
		this.moveType=type
		this.forward=true
	}
	reverseDirection(){
		this.forward=false
		return this
	}
}