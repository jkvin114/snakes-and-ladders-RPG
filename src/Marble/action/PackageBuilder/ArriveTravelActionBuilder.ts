

import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { PrepareTravelAction } from "../InstantAction"
import { DiceChanceAction } from "../QueryAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"

export class ArriveTravelActionBuilder extends ActionPackageBuilder {
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer) {
		super(game, trace, invoker, EVENT_TYPE.ARRIVE_TRAVEL)
	}
	build(): ActionPackage {
		let pkg = super.build().addMain(new PrepareTravelAction(this.invoker.turn))
		const freepass = ABILITY_NAME.INSTANT_TRAVEL
		const taxi = ABILITY_NAME.ONE_MORE_DICE_AFTER_TRAVEL

		let value = this.offences.get(freepass)
		if (value != null && this.isTurnOf(this.invoker.turn)) {
			pkg.addExecuted(freepass, this.invoker.turn)
		} else {
			pkg.setMainToPendingAction()
		}

		value = this.offences.get(taxi)
		if (value != null) {
			pkg.addMain(new DiceChanceAction(this.invoker.turn).reserveAbilityIndicatorOnPop(taxi, this.invoker.turn))
		}
		return pkg
	}
}