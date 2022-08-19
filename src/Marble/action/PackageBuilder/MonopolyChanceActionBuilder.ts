

import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { DiceChanceAction } from "../QueryAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"

export class MonopolyChanceActionBuilder extends ActionPackageBuilder {
	spots: number[]

	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, spots: number[]) {
		super(game, trace, invoker, EVENT_TYPE.MONOPOLY_CHANCE)
		this.spots = spots
	}
	setDefender(p: MarblePlayer): this {
		this.setDefences(p, EVENT_TYPE.MONOPOLY_ALERT)
		return this
	}
	build(): ActionPackage {
		let pkg = super.build()
		const speaker = ABILITY_NAME.ONE_MORE_DICE_ON_MONOPOLY_CHANCE

		let val = this.offences.get(speaker)
		if (val != null) {
			pkg.addAction(new DiceChanceAction(this.invoker.turn).reserveAbilityIndicatorOnPop(speaker, this.invoker.turn), speaker)
		}
		return pkg
	}
}