import type { MarbleGame } from "../Game"
import type { TeleportAction } from "../action/DelayedAction"
import { GAME_CYCLE } from "../gamecycleEnum"
import MarbleGameCycleState from "./MarbleGameCycleState"

export default class Teleporting extends MarbleGameCycleState<TeleportAction>{
   
    constructor(game:MarbleGame,sourceAction:TeleportAction){
        super(game,sourceAction.turn,GAME_CYCLE.PLAYER_TELEPORTING,sourceAction)
    }
    onCreate(): void {
        this.game.teleportPlayer(this.turn,this.sourceAction.pos,this.sourceAction.source,this.sourceAction.movetype)
    }
}