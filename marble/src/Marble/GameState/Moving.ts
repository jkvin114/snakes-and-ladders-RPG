import type{ MarbleGame } from "../Game"
import type{ ActionTrace } from "../action/ActionTrace"
import type { MoveAction } from "../action/DelayedAction"
import { GAME_CYCLE } from "../gamecycleEnum"
import MarbleGameCycleState from "./MarbleGameCycleState"

export default class Moving extends MarbleGameCycleState<MoveAction>{

    static id = GAME_CYCLE.PLAYER_WALKING
    movetype:ActionTrace
    distance:number
    from:number
    isForceMove:boolean
    constructor(game:MarbleGame,sourceAction:MoveAction){
        super(game,sourceAction.turn,Moving.id,sourceAction)
        this.movetype=sourceAction.source
        this.distance=sourceAction.distance
        this.from=sourceAction.from
    }
    onCreate(): void {
        this.distance=this.game.walkMovePlayer(this.turn,this.from,this.distance,this.sourceAction.source,this.sourceAction.moveType)
        this.sourceAction.setDistanceDelay(this.distance)
    }
}