import { Action, ActionModifyFunction, ACTION_TYPE, MOVETYPE } from "./Action"
import type { ActionTrace } from "./ActionTrace"
import { ServerPayloadInterface } from "./../ServerPayloadInterface"
import { BUILDING } from "../tile/Tile"
import { FortuneCard } from "../FortuneCard"
import { ABILITY_NAME } from "../Ability/AbilityRegistry"



/**
 * 유저에게 실행여부 물어봐야되는경우
 * (주사위,건설,인수,선택이동,카드사용,블랙홀설치 등)
 */
 export class QueryAction extends Action {
	constructor(type:ACTION_TYPE,turn: number) {
		super(type,turn)
	}
}
export class DiceChanceAction extends QueryAction {
	constructor(turn: number,nodouble?:boolean) {
		super(nodouble?ACTION_TYPE.DICE_CHANCE_NO_DOUBLE:ACTION_TYPE.DICE_CHANCE,turn)
		this.duplicateAllowed=false
	}
}

export class AskBuildAction extends QueryAction {
    builds:ServerPayloadInterface.buildAvaliability[]
	pos:number
	discount:number
	availableMoney:number
	buildsHave:BUILDING[]
	constructor(turn: number,pos:number,avaliableBuilds:ServerPayloadInterface.buildAvaliability[],buildsHave:BUILDING[],discount:number,availableMoney:number) {
		super(ACTION_TYPE.CHOOSE_BUILD,turn)
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
	constructor(turn: number,pos:number,price:number,originalPrice:number) {
		super(ACTION_TYPE.ASK_BUYOUT,turn)
        this.pos=pos
        this.price=price
        this.originalPrice=originalPrice
	}
}

export class AskLoanAction extends QueryAction {
    amount:number
	receiver:number
	constructor(turn: number,amount:number,receiver:number) {
		super(ACTION_TYPE.ASK_LOAN,turn)
        this.amount=amount
		this.receiver=receiver
	}
}
export class TileSelectionAction extends QueryAction {
    tiles:number[]
	name:string
	constructor(type:ACTION_TYPE,turn: number,tiles:number[],name:string) {
		super(type,turn)
        this.tiles=tiles
		this.name=name
	}
}
export class MoveTileSelectionAction extends TileSelectionAction{
	moveType:MOVETYPE
	constructor(turn: number,tiles:number[],name:string,moveType:MOVETYPE){
		super(ACTION_TYPE.CHOOSE_MOVE_POSITION,turn,tiles,name)
		this.moveType=moveType
	}
}
export class ObtainCardAction extends QueryAction {
    card:FortuneCard

	constructor(turn: number, card:FortuneCard) {
		super(ACTION_TYPE.OBTAIN_CARD,turn)
        this.card=card
	}
}
export class LandSwapAction extends QueryAction{
	myLands:number[]
	enemyLands:number[]
	status:string
	constructor(turn: number, myLands:number[],enemyLands:number[]) {
		super(ACTION_TYPE.CHOOSE_LAND_CHANGE,turn)
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
	attacker:number  //방어할 공격을 한 플레이어
	willIgnored:boolean
	ignoredBy:ABILITY_NAME
	constructor(type:ACTION_TYPE,turn: number,cardname:string) {
		super(type,turn)
		this.cardname=cardname
		this.attacker=-1
		this.toBlock=""
		this.willIgnored=false
		this.ignoredBy=ABILITY_NAME.NONE
	}
	setBlockActionId(id:string){
		this.toBlock=id

		return this
	}
	setAttacker(turn:number){
		this.attacker=turn
		return this
	}
	setIgnore(ignore:boolean,by:ABILITY_NAME) {
		this.willIgnored=ignore
		if(ignore) this.ignoredBy=by
		return this
	}
}

export class AskAttackDefenceCardAction extends AskDefenceCardAction{
	attackName:string
	constructor(turn: number,cardname:string,name:string) {
		super(ACTION_TYPE.CHOOSE_ATTACK_DEFENCE_CARD_USE,turn,cardname)
		this.attackName=name
	}
}
export class AskTollDefenceCardAction extends AskDefenceCardAction{
	before:number
	after:number
	constructor(turn: number,cardname:string,before:number,after:number) {
		super(ACTION_TYPE.CHOOSE_TOLL_DEFENCE_CARD_USE,turn,cardname)
		this.before=before
		this.after=after

		//원래 통행료 무료면 카드 사용 안물어봄
		if(before===0) this.off()
	}
	
}

export class AskGodHandSpecialAction extends QueryAction{
	canLiftTile:boolean
	constructor(turn: number,canLiftTile:boolean) {
		super(ACTION_TYPE.CHOOSE_GODHAND_SPECIAL,turn)
		this.canLiftTile=canLiftTile
	}
}