import type { MarbleGame } from "../Game"
import type { Action } from "../action/Action"
import { GAME_CYCLE } from "../gamecycleEnum"
import MarbleGameCycleState from "./MarbleGameCycleState"

export default class TurnInitializer extends MarbleGameCycleState<Action> {
	static id = GAME_CYCLE.START_TURN
	constructor(game: MarbleGame,sourceAction:Action) {
		super(game,game.getNextTurn(), TurnInitializer.id,sourceAction)
	}
	onCreate(): void {
        this.game.onTurnStart()
        this.game.eventEmitter.turnStart(this.turn)
    }
}