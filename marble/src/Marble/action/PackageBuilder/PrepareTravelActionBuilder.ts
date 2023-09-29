

import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { ACTION_TYPE, MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import {  DiceChanceAction, MoveTileSelectionAction } from "../QueryAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"


export class PrepareTravelActionBuilder extends ActionPackageBuilder {
	pos: number[]
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, pos: number[]) {
		super(game, trace, invoker, EVENT_TYPE.TRAVEL_START)
		this.pos = pos
	}
	build(): ActionPackage {
		let pkg = super.build()
		.addMain(new MoveTileSelectionAction(this.invoker.turn, this.pos, MOVETYPE.TRAVEL, "travel"))
		const flag = ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL
		const taxi = ABILITY_NAME.ONE_MORE_DICE_AFTER_TRAVEL
		const sophie=ABILITY_NAME.TRAVEL_ON_PASS_TRAVEL_AND_DICE_CHANCE

		if (this.offences.has(flag)) {
			this.trace.setAbilityName(ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL).setName("대지주의깃발")
			pkg.addExecuted(flag, this.invoker.turn)
		}
		
		if(this.trace.useActionAndAbility(ACTION_TYPE.PREPARE_TRAVEL,sophie)){

			pkg.addAction(new DiceChanceAction(this.invoker.turn)
			.reserveAbilityIndicatorOnPop(sophie, this.invoker.turn,1),sophie)
		}
		else if (this.offences.has(taxi)) {
			pkg.addAction(new DiceChanceAction(this.invoker.turn)
			.reserveAbilityIndicatorOnPop(taxi, this.invoker.turn),taxi)
		}
		
		return pkg
	}
}