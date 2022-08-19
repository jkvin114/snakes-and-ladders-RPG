import { ABILITY_NAME } from "../Ability/AbilityRegistry"
import { cl, hexId } from "../util"
import { ActionTrace, ActionTraceTag, ACTION_SOURCE_TYPE } from "./ActionTrace"

export enum ACTION_TYPE {
	WALK_MOVE, //0
	FORCE_WALK_MOVE,
	TELEPORT,
	INSTANT_TELEPORT, //3
	ROLLING_DICE,
	DICE_CHANCE,
	DICE_CHANCE_NO_DOUBLE, //6
	ARRIVE_TILE,
	CHOOSE_BLACKHOLE,
	CHOOSE_MOVE_POSITION, //9
	CHOOSE_BUILD_POSITION,
	CHOOSE_POSITION,
	END_TURN, //12
	CHOOSE_BUILD,
	CLAIM_TOLL,
	CLAIM_BUYOUT, //15
	PAY_MONEY,
	ASK_LOAN,
	ASK_BUYOUT, //18
	BUYOUT,
	GAMEOVER,
	CHOOSE_OLYMPIC_POSITION,
	OBTAIN_CARD,
	CHOOSE_ATTACK_POSITION,
	ATTACK_TILE,
	CHOOSE_DONATE_POSITION,
	CHOOSE_LAND_CHANGE,
	CHOOSE_ATTACK_DEFENCE_CARD_USE,
	CHOOSE_TOLL_DEFENCE_CARD_USE,
	MODIFY_OTHER,
	EARN_MONEY,
	REQUEST_MOVE,
	CHOOSE_GODHAND_SPECIAL,
	CHOOSE_GODHAND_TILE_LIFT,
	EXECUTE_PENDING_ACTION,
	TURN_START,
	PREPARE_TRAVEL,
	PULL,
	AUTO_BUILD,
	ADD_MULTIPLIER,
	APPLY_PLAYER_EFFECT,
	CREATE_BLACKHOLE,
	STEAL_MULTIPLIER,
	EMPTY,
	CHOOSE_ISLAND,
	CHOOSE_BUYOUT_POSITION,
	CHANGE_LAND_OWNER
}

export const ACTION_LIST = [
	"WALK_MOVE", //0
	"FORCE_WALK_MOVE",
	"TELEPORT",
	"INSTANT_TELEPORT", //3
	"ROLLING_DICE",
	"DICE_CHANCE",
	"DICE_CHANCE_NO_DOUBLE", //6
	"ARRIVE_TILE",
	"CHOOSE_BLACKHOLE",
	"CHOOSE_MOVE_POSITION", //9
	"CHOOSE_BUILD_POSITION",
	"CHOOSE_POSITION",
	"END_TURN", //12
	"CHOOSE_BUILD",
	"CLAIM_TOLL",
	"CLAIM_BUYOUT", //15
	"PAY_MONEY",
	"ASK_LOAN",
	"ASK_BUYOUT", //18
	"BUYOUT",
	"GAMEOVER",
	"CHOOSE_OLYMPIC_POSITION",
	"OBTAIN_CARD",
	"CHOOSE_ATTACK_POSITION",
	"ATTACK_TILE",
	"CHOOSE_DONATE_POSITION",
	"CHOOSE_LAND_CHANGE",
	"CHOOSE_ATTACK_DEFENCE_CARD_USE",
	"CHOOSE_TOLL_DEFENCE_CARD_USE",
	"MODIFY_OTHER",
	"EARN_MONEY",
	"REQUEST_MOVE",
	"CHOOSE_GODHAND_SPECIAL",
	"CHOOSE_GODHAND_TILE_LIFT",
	"EXECUTE_PENDING_ACTION",
	"TURN_START",
	"PREPARE_TRAVEL",
	"PULL"	,
	"AUTO_BUILD",
	"ADD_MULTIPLIER",
	"APPLY_PLAYER_EFFECT",
	"CREATE_BLACKHOLE",
	"STEAL_MULTIPLIER",
	"EMPTY",
	"CHOOSE_ISLAND",
	"CHOOSE_BUYOUT_POSITION",
	"CHANGE_LAND_OWNER"
]

export enum MOVETYPE{
	WALK="walk",FORCE_WALK="force_walk",TELEPORT="tp",PULL="pull",BLACKHOLE="blackhole",TRAVEL="travel"
}
export abstract class Action {
	type: ACTION_TYPE
	source: ActionTrace
	turn: number
	priority: number
	delay: number
	valid: boolean
	blocked: boolean
	indicateAbilityOnPop:boolean
	duplicateAllowed:boolean // 같은플레이어의 같은종류 액션 두개 동시에 스택에 존재 가능한지
	incompatiableWith:Set<ACTION_TYPE> //호환 안되는 능력들 (같은 플레이어의 해당 능력이 이미 스택에 있으면 이 능력은 무시됨)
	cancels:Set<ACTION_TYPE>// 이 능력이 발동하면 stack에 있는 해당 능력들 취소됨
	private reservedAbility:{name: ABILITY_NAME, turn: number }
	private id: string
	static readonly PRIORITY_NORMAL=0
	static readonly PRIORITY_FIRST=1
	constructor(type: ACTION_TYPE, turn: number) {
		this.type = type
		this.source = new ActionTrace(this.type)
		this.delay = 0
		this.turn = turn
		this.valid = true
		this.blocked = false
		this.id = hexId()
		this.priority=Action.PRIORITY_NORMAL
		this.indicateAbilityOnPop=false
		this.reservedAbility={ name: ABILITY_NAME.NONE, turn: -1 }
		this.duplicateAllowed=true
		this.incompatiableWith=new Set<ACTION_TYPE>()
		this.cancels=new Set<ACTION_TYPE>()

	}
	setSource(source:ActionTrace){
		this.source=source
		return this
	}
	setPrevActionTrace(source:ActionTrace){
		if(this.source === source) return this
		this.source.setPrev(source)
		cl(this.source.toString(20))
		return this
	}
	addFlagToActionTrace(flag:ActionTraceTag){
		this.source.addTag(flag)
		return this
	}
	addAbilityToActionTrace(ability:ABILITY_NAME){
		this.source.setAbilityName(ability)
		return this
	}
	/**
	 * off 될경우 아예 실행 안됨
	 */
	off() {
		this.valid = false
	}
	/**
	 * 실행은 안되지만 막혔다고 알려줘야 하는 경우(통행료징수 천사카드에 막힘, 공격 방어에 막힘 등)
	 */
	block() {
		this.blocked = true
	}
	getId() {
		return this.id
	}

	offIf(id: string) {
		if (this.id === id) this.off()
	}
	applyMultiplier(mul: number): void {
		console.error("multiplier could not be applied")
	}
	setValue(val: number) {
		console.error(" could not set the value")
	}
	/**
	 * action이 실행될띠 ability 알림 표시(아이템으로 인한 action만 적용)
	 */
	reserveAbilityIndicatorOnPop(ability:ABILITY_NAME,turn:number){
		this.reservedAbility.name=ability
		this.reservedAbility.turn=turn
		this.indicateAbilityOnPop=true
		return this
	}
	getReservedAbility(){
		return this.reservedAbility
	}
}

export class EmptyAction extends Action {
	constructor() {
		super(ACTION_TYPE.EMPTY, -1)
	}
}

/**
 * 즉시 실행됨(상태 변화)
 */
export class StateChangeAction extends Action {
	constructor(type: ACTION_TYPE, turn: number) {
		super(type, turn)
		if(type===ACTION_TYPE.GAMEOVER)
			this.priority=Action.PRIORITY_FIRST
	}
}
