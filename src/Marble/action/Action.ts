import type { ActionSource } from "./ActionSource"

export enum ACTION_TYPE {
	WALK_MOVE,//0
	FORCE_WALK_MOVE,
	TELEPORT,
	INSTANT_TELEPORT,//3
	ROLLING_DICE,
	DICE_CHANCE,
	DICE_CHANCE_NO_DOUBLE,//6
    ARRIVE_TILE,
	CHOOSE_BLACKHOLE,
	CHOOSE_MOVE_POSITION,//9
	CHOOSE_BUILD_POSITION,
	CHOOSE_POSITION,
	END_TURN,//12
    CHOOSE_BUILD,
    CLAIM_TOLL,
	CLAIM_BUYOUT,//15
    PAY_MONEY,
    ASK_LOAN,
    ASK_BUYOUT,//18
    BUYOUT,
	GAMEOVER,
	CHOOSE_OLYMPIC_POSITION
}

export const ACTION_LIST=[
	"WALK_MOVE",//0
	"FORCE_WALK_MOVE",
	"TELEPORT",
	"INSTANT_TELEPORT",//3
	"ROLLING_DICE",
	"DICE_CHANCE",
	"DICE_CHANCE_NO_DOUBLE",//6
    "ARRIVE_TILE",
	"CHOOSE_BLACKHOLE",
	"CHOOSE_MOVE_POSITION",//9
	"CHOOSE_BUILD_POSITION",
	"CHOOSE_POSITION",
	"END_TURN",//12
    "CHOOSE_BUILD",
    "CLAIM_TOLL",
	"CLAIM_BUYOUT",//15
    "PAY_MONEY",
    "ASK_LOAN",
    "ASK_BUYOUT",//18
    "BUYOUT","GAMEOVER","CHOOSE_OLYMPIC_POSITION"
]
export abstract class Action {
	type:ACTION_TYPE
    source:ActionSource
	turn: number
	priority: number
    delay:number
	valid:boolean
	constructor( type:ACTION_TYPE,turn: number,source:ActionSource) {
		this.type=type
		this.source = source
        this.delay=0
        this.turn = turn
		this.valid=true
	}
	off(){
		this.valid=false
	}
}
// export class EventAction extends Action {
// 	constructor(type:ACTION_TYPE, turn: number,source:ActionSource) {
// 		super(type,turn,source)
// 	}
// }

/**
 * 즉시 실행됨(상태 변화)
 */
 export class StateChangeAction extends Action {
	constructor(type:ACTION_TYPE, turn: number,source:ActionSource) {
		super(type,turn,source)
	}
}
