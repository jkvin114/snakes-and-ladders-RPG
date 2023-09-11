import type { MarbleGame } from "../Game"
import type { RollDiceAction } from "../action/DelayedAction"
import { GAME_CYCLE } from "../gamecycleEnum"
import MarbleGameCycleState from "./MarbleGameCycleState"

export default class ThrowingDice extends MarbleGameCycleState<RollDiceAction>{

    static id = GAME_CYCLE.THROWING_DICE
    constructor(game:MarbleGame,action:RollDiceAction){
        super(game,game.thisturn,ThrowingDice.id,action)
    }
    onCreate(): void {
    }
}