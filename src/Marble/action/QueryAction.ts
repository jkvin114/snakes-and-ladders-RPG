import { Action, ActionModifyFunction, ACTION_TYPE } from "./Action"
import type { ActionSource } from "./ActionSource"
import { ServerPayloadInterface } from "./../ServerPayloadInterface"
import { BUILDING } from "../tile/Tile"
import { FortuneCard } from "../FortuneCard"



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
	name:string
	constructor(type:ACTION_TYPE,turn: number, source:ActionSource,tiles:number[],name:string) {
		super(type,turn,source)
        this.tiles=tiles
		this.name=name
	}
}
export class ObtainCardAction extends QueryAction {
    card:FortuneCard

	constructor(turn: number,source:ActionSource, card:FortuneCard) {
		super(ACTION_TYPE.OBTAIN_CARD,turn,source)
        this.card=card
	}
}
export class LandSwapAction extends QueryAction{
	myLands:number[]
	enemyLands:number[]
	status:string
	constructor(turn: number,source:ActionSource, myLands:number[],enemyLands:number[]) {
		super(ACTION_TYPE.CHOOSE_LAND_CHANGE,turn,source)
        this.myLands=myLands
		this.enemyLands=enemyLands
		this.status="init"
	}
	getTargetTiles(){
		if(this.status==="init"){
			this.status="choosing_my_land"
			return this.myLands
		}
		if(this.status==="choosing_my_land"){
			this.status="choosing_enemy_land"
			return this.enemyLands
		}
		return []
	}
}
export class AskDefenceCardAction extends QueryAction{
	cardname:string
	toBlock:string
	constructor(type:ACTION_TYPE,turn: number,source:ActionSource,cardname:string) {
		super(type,turn,source)
		this.cardname=cardname

		this.toBlock=""
	}
	setBlockActionId(id:string){
		this.toBlock=id

		return this
	}
}

export class AskAttackDefenceCardAction extends AskDefenceCardAction{
	attackName:string
	constructor(turn: number,source:ActionSource,cardname:string,name:string) {
		super(ACTION_TYPE.CHOOSE_ATTACK_DEFENCE_CARD_USE,turn,source,cardname)
		this.attackName=name
	}
}
export class AskTollDefenceCardAction extends AskDefenceCardAction{
	before:number
	after:number
	constructor(turn: number,source:ActionSource,cardname:string,before:number,after:number) {
		super(ACTION_TYPE.CHOOSE_TOLL_DEFENCE_CARD_USE,turn,source,cardname)
		this.before=before
		this.after=after

		//원래 통행료 무료면 카드 사용 안물어봄
		if(before===0) this.off()
	}
	
}