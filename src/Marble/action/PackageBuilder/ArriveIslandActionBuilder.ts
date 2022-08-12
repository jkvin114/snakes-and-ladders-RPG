


import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { DiceChanceAction, AskIslandAction } from "../QueryAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"

export class ArriveIslandActionBuilder extends ActionPackageBuilder {
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer) {
		super(game, trace, invoker, EVENT_TYPE.ARRIVE_ISLAND)
	}
	build(): ActionPackage {
		let pkg = super.build()
		const escape = ABILITY_NAME.INSTANT_ESCAPE_ISLAND
		let ab = this.offences.get(escape)
		if (ab != null) {
			pkg.addExecuted(escape, this.invoker.turn)
			pkg.addMain(new DiceChanceAction(this.invoker.turn, true))
		} else {
			pkg.setMainToPendingAction()
			pkg.addMain(
				new AskIslandAction(
					this.invoker.turn,
					this.invoker.money > this.game.ISLAND_ESCAPE_MONEY,
					this.game.ISLAND_ESCAPE_MONEY
				)
			)
		}

		return pkg
	}
}
