import type { MarbleGame } from "../Game"
import { Action, EmptyAction } from "../action/Action"
import MarbleGameCycleState from "./MarbleGameCycleState"

export default class ErrorState extends MarbleGameCycleState<EmptyAction>{
    constructor(game: MarbleGame) {
		super(game,0, MarbleGameCycleState.ERROR_STATE,new EmptyAction())
        this.onCreate()
	}
    onCreate(): void {
        console.error("state error")
    }
}