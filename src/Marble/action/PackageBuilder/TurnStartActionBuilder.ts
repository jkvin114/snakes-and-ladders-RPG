
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { DiceChanceAction } from "../QueryAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"


export class TurnStartActionBuilder extends ActionPackageBuilder {
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer) {
		super(game, trace, invoker, EVENT_TYPE.TURN_START)
	}
	build(): ActionPackage {
		let pkg = super.build()

		let pendingActions = this.invoker.getPendingAction()
		if (pendingActions.length === 0) {
			pkg.addMain(new DiceChanceAction(this.invoker.turn))
		} else {
			for (const p of pendingActions) {
				pkg.addMain(p)
			}
		}
		return pkg
	}
}