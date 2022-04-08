import { GameCycleState } from "./GameCycleState"
import * as GAME_CYCLE from "./StateEnum"
import { Game } from "../Game"

class AiThrowDice extends GameCycleState {
	static id = GAME_CYCLE.BEFORE_OBS.AI_THROW_DICE
	constructor(game: Game) {
		super(game,AiThrowDice.id)
	}
	onCreate(): void {}
}