import { Action,  ACTION_TYPE, MOVETYPE } from "./Action"
import { ServerRequestModel } from "../../Model/ServerRequestModel"
import { BUILDING } from "../tile/Tile"
import { FortuneCard } from "../FortuneCard"
import { ABILITY_NAME } from "../Ability/AbilityRegistry"
import { BuildType } from "../tile/enum"



/**
 * 유저에게 실행여부 물어봐야되는경우
 * (주사위,건설,인수,선택이동,카드사용,블랙홀설치 등)
 */
 export class QueryAction extends Action {
	category: string
	constructor(type:ACTION_TYPE,turn: number) {
		super(type,turn)
		this.category="query"
	}
}
export class DiceChanceAction extends QueryAction {
	constructor(turn: number,nodouble?:boolean) {
		super(nodouble?ACTION_TYPE.DICE_CHANCE_NO_DOUBLE:ACTION_TYPE.DICE_CHANCE,turn)
		this.duplicateAllowed=false
		if(nodouble){
			this.incompatiableWith.add(ACTION_TYPE.CHOOSE_MOVE_POSITION)
			this.cancels.add(ACTION_TYPE.REQUEST_MOVE)
		}
	}
}

export class AskBuildAction extends QueryAction {
    builds:ServerRequestModel.buildAvaliability[]
	pos:number
	discount:number
	availableMoney:number
	buildsHave:BUILDING[]
	buildType:BuildType
	constructor(turn: number,pos:number,avaliableBuilds:ServerRequestModel.buildAvaliability[],buildsHave:BUILDING[],discount:number,availableMoney:number) {
		super(ACTION_TYPE.CHOOSE_BUILD,turn)
        this.builds=avaliableBuilds
		this.pos=pos
		this.discount=discount
		this.availableMoney=availableMoney
		this.buildsHave=buildsHave
		if(avaliableBuilds[0].type===BUILDING.SIGHT)
			this.buildType=BuildType.SIGHT
		else if(avaliableBuilds[avaliableBuilds.length-1].type===BUILDING.LANDMARK)
			this.buildType=BuildType.LANDMARK
		else this.buildType=BuildType.BUILDINGS
	}

	serialize():ServerRequestModel.LandBuildSelection{
		return {
			pos:this.pos,
			discount:this.discount,
			money:this.availableMoney,
			builds:this.builds,
			buildsHave:this.buildsHave,
			type:this.buildType
		}
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
	serialize():ServerRequestModel.BuyoutSelection {
		return {
			pos:this.pos,
			price:this.price,
			originalPrice:this.originalPrice
		}
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
		this.duplicateAllowed=false
	}
	setPositions(tiles:number[]){
		this.tiles=tiles
		return this
	}
	serialize():ServerRequestModel.TileSelection {
		return {
			tiles:this.tiles,
			source:this.name,
			actionType:this.type
		}
	}
}
export class BlackholeTileSelectionAction extends TileSelectionAction {
	whitehole:number
	constructor(turn: number,tiles:number[],whitehole:number) {
		super(ACTION_TYPE.CHOOSE_BLACKHOLE,turn,tiles,"blackhole")
		this.whitehole=whitehole
		this.duplicateAllowed=false
	}
}
export class MoveTileSelectionAction extends TileSelectionAction{
	moveType:MOVETYPE
	constructor(turn: number,tiles:number[],moveType:MOVETYPE,name?:string){
		if(!name) name="free_move"
		super(ACTION_TYPE.CHOOSE_MOVE_POSITION,turn,tiles,name)
		this.moveType=moveType
		this.duplicateAllowed=false
		
		this.cancels.add(ACTION_TYPE.REQUEST_MOVE)
	}
}
export class MoveToPlayerSelectionAction extends MoveTileSelectionAction{
	targetPlayers:number[]
	constructor(turn: number,moveType:MOVETYPE,targetPlayers:number[]){
		super(turn,[],moveType)
		this.targetPlayers=targetPlayers
	}
}
export class ObtainCardAction extends QueryAction {
    card:FortuneCard

	constructor(turn: number, card:FortuneCard) {
		super(ACTION_TYPE.OBTAIN_CARD,turn)
        this.card=card
		this.duplicateAllowed=false
	}
	serialize():ServerRequestModel.ObtainCardSelection{
		return {
			name:this.card.name,
			level:this.card.level,
			type:this.card.type
		}
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
	attackTargetTile:number
	constructor(turn: number,cardname:string,name:string,attackTargetTile:number) {
		super(ACTION_TYPE.CHOOSE_ATTACK_DEFENCE_CARD_USE,turn,cardname)
		this.attackName=name
		this.attackTargetTile=attackTargetTile
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
	serialize():ServerRequestModel.GodHandSpecialSelection{
		return {
			canLiftTile:this.canLiftTile
		}
	}
}
export class AskIslandAction extends QueryAction{
	canEscape:boolean
	escapePrice:number
	constructor(turn: number,canEscape:boolean,escapePrice:number) {
		super(ACTION_TYPE.CHOOSE_ISLAND,turn)
		this.canEscape=canEscape
		this.escapePrice=escapePrice
	}
	serialize():ServerRequestModel.IslandSelection {
		return{
			canEscape:this.canEscape,
			escapePrice:this.escapePrice
		}
	}
}