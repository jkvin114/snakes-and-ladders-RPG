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
export class PayMoneyAction extends InstantAction {
    amount:number
	receiver:number
	constructor(payer: number,receiver:number, source:ActionSource,amount:number) {
		super(ACTION_TYPE.PAY_MONEY,payer,source)
        this.amount=amount
		this.receiver=receiver
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