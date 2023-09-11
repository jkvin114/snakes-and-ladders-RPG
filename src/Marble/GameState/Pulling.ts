import type { MarbleGame } from "../Game"
import type { PullAction } from "../action/DelayedAction"
import { GAME_CYCLE } from "../gamecycleEnum"
import MarbleGameCycleState from "./MarbleGameCycleState"

export default class Pulling extends MarbleGameCycleState<PullAction>{
    
    static id = GAME_CYCLE.PULLING
    constructor(game:MarbleGame,action:PullAction){
        super(game,action.turn,Pulling.id,action)
    }
    onCreate(): void {
        this.game.eventEmitter.indicatePull(this.sourceAction.targetTiles)
        this.game.pullPlayers(this.turn,this.sourceAction)
    }
}