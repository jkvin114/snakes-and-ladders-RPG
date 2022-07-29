import { hexId } from "../util"
import { ActionSource, ACTION_SOURCE_TYPE } from "./ActionSource"

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
	EMPTY,
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
	"EMPTY",
]

export interface ActionModifyFunction {
	(action: Action): void
}
export abstract class Action {
	type: ACTION_TYPE
	source: ActionSource
	turn: number
	priority: number
	delay: number
	valid: boolean
	blocked: boolean
	private id: string
	static readonly PRIORITY_NORMAL=0
	static readonly PRIORITY_FIRST=1
	constructor(type: ACTION_TYPE, turn: number, source: ActionSource) {
		this.type = type
		this.source = source
		this.delay = 0
		this.turn = turn
		this.valid = true
		this.blocked = false
		this.id = hexId()
		this.priority=Action.PRIORITY_NORMAL
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
}

export class EmptyAction extends Action {
	constructor() {
		super(ACTION_TYPE.EMPTY, -1, new ActionSource(ACTION_SOURCE_TYPE.GAMELOOP))
	}
}

/**
 * 즉시 실행됨(상태 변화)
 */
export class StateChangeAction extends Action {
	constructor(type: ACTION_TYPE, turn: number, source: ActionSource) {
		super(type, turn, source)
	}
}
