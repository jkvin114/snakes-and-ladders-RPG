

import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import {  MoveTileSelectionAction } from "../QueryAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"


export class PrepareTravelActionBuilder extends ActionPackageBuilder {
	pos: number[]
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, pos: number[]) {
		super(game, trace, invoker, EVENT_TYPE.TRAVEL_START)
		this.pos = pos
	}
	build(): ActionPackage {
		let pkg = super.build().addMain(new MoveTileSelectionAction(this.invoker.turn, this.pos, "travel", MOVETYPE.WALK))
		const flag = ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL
		let val = this.offences.get(flag)
		if (val != null) {
			this.trace.setAbilityName(ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL).setName("대지주의깃발")
			pkg.addExecuted(flag, this.invoker.turn)
		}
		return pkg
	}
}