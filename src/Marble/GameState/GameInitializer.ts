import type{ MarbleGame } from "../Game"
import { Action, EmptyAction } from "../action/Action"
import {TurnInitializer} from "."
import MarbleGameCycleState from "./MarbleGameCycleState"

export default class GameInitializer extends MarbleGameCycleState<EmptyAction>{
    static id=-1
    constructor(game: MarbleGame) {
		super(game,0, GameInitializer.id,new EmptyAction())
        this.onCreate()
	}
    onCreate(): void {
        this.game.onGameStart()
    }
    getNext(action: Action|null): MarbleGameCycleState<Action> {
        return new TurnInitializer(this.game,new EmptyAction())
    }
}