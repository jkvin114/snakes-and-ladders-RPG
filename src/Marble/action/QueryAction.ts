import { Action, ACTION_TYPE } from "./Action"
import type { ActionSource } from "./ActionSource"
import { ServerPayloadInterface } from "./../ServerPayloadInterface"
import { BUILDING } from "../tile/Tile"

/**
 * 유저에게 실행여부 물어봐야되는경우
 * (주사위,건설,인수,선택이동,카드사용,블랙홀설치 등)
 */
 export class QueryAction extends Action {
	constructor(type:ACTION_TYPE,turn: number, source:ActionSource) {
		super(type,turn,source)
	}
}
export class AskBuildAction extends QueryAction {
    builds:ServerPayloadInterface.buildAvaliability[]
	pos:number
	discount:number
	availableMoney:number
	buildsHave:BUILDING[]
	constructor(turn: number, source:ActionSource,pos:number,avaliableBuilds:ServerPayloadInterface.buildAvaliability[],buildsHave:BUILDING[],discount:number,availableMoney:number) {
		super(ACTION_TYPE.CHOOSE_BUILD,turn,source)
        this.builds=avaliableBuilds
		this.pos=pos
		this.discount=discount
		this.availableMoney=availableMoney
		this.buildsHave=buildsHave
	}
}

export class AskBuyoutAction extends QueryAction {
    pos:number
    price:number
    originalPrice:number
	constructor(turn: number, source:ActionSource,pos:number,price:number,originalPrice:number) {
		super(ACTION_TYPE.ASK_BUYOUT,turn,source)
        this.pos=pos
        this.price=price
        this.originalPrice=originalPrice
	}
}

export class AskLoanAction extends QueryAction {
    amount:number
	receiver:number
	constructor(turn: number, source:ActionSource,amount:number,receiver:number) {
		super(ACTION_TYPE.ASK_LOAN,turn,source)
        this.amount=amount
		this.receiver=receiver
	}
}
export class TileSelectionAction extends QueryAction {
    tiles:number[]

	constructor(type:ACTION_TYPE,turn: number, source:ActionSource,tiles:number[]) {
		super(type,turn,source)
        this.tiles=tiles
	}
}