import { Action, ACTION_TYPE } from "./Action"
import type { ActionTrace } from "./ActionTrace"

/**
 * 실행하는데 일정 딜레이 필요, 딜레이 이후 자동으로 다음으로
 * (이동,)
 */
 export class DelayedAction extends Action {
	constructor(type:ACTION_TYPE,turn: number,delay:number) {
		super(type,turn)
		this.delay=delay
	}
}

export class MoveAction extends DelayedAction {
    static DELAY_PER_TILE=100
    distance:number
	from:number
	constructor(type:ACTION_TYPE,turn: number,from:number,distance:number) {
		super(type,turn,Math.abs(distance) * MoveAction.DELAY_PER_TILE)
        this.distance=distance
		this.from=from
	}
}
export class RollDiceAction extends DelayedAction {
    static DELAY=1000
    pos:number
	dice:number
	is3double:boolean
	constructor(turn: number,pos:number,dice:number,is3double:boolean) {
		super(ACTION_TYPE.ROLLING_DICE,turn,RollDiceAction.DELAY)
        this.pos=pos
		this.dice=dice
		this.is3double=is3double
	}
}