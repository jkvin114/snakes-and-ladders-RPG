import { backwardBy, forwardBy, pos2Line, SAME_LINE_TILES } from "../util"
import { Action, ACTION_TYPE, MOVETYPE } from "./Action"
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
	moveType:MOVETYPE
	constructor(type:ACTION_TYPE,turn: number,from:number,distance:number,moveType:MOVETYPE) {
		super(type,turn,Math.abs(distance) * MoveAction.DELAY_PER_TILE)
        this.distance=distance
		this.from=from
		this.moveType=moveType
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
export abstract class PullAction extends DelayedAction {
    static DELAY=1000
    pos:number
	targetTiles:number[]
	constructor(turn: number,pos:number) {
		super(ACTION_TYPE.PULL,turn,PullAction.DELAY)
        this.pos=pos
		this.targetTiles=[]
	}
}
export class RangePullAction extends PullAction {
	radius:number
	constructor(turn: number,pos:number,radius:number) {
		super(turn,pos)
		this.radius=radius
		for(let i=1;i<=radius;++i){
			this.targetTiles.push(forwardBy(pos,i),backwardBy(pos,i))
		}
	}
}
export class LinePullAction extends PullAction {
	constructor(turn: number,pos:number) {
		super(turn,pos)
		this.targetTiles.push(...SAME_LINE_TILES[pos2Line(pos)])
	}
}