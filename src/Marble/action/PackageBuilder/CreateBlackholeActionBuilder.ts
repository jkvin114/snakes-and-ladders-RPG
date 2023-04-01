
import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { chooseRandom } from "../../util"
import type { Action, MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { AddMultiplierAction,  CreateBlackholeAction, PayPercentMoneyAction } from "../InstantAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"



export class CreateBlackholeActionBuilder extends ActionPackageBuilder {
	pos: number
	main: Action
	whiteholepos: number
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, pos: number, whiteholepos: number) {
		super(game, trace, invoker, EVENT_TYPE.CREATE_BLACKHOLE)
		this.pos = pos
		this.whiteholepos = whiteholepos
		this.main = new CreateBlackholeAction(this.invoker.turn, pos, whiteholepos)
	}
	build(): ActionPackage {
		let pkg = super.build().addMain(this.main)
		const blackhole_mul = ABILITY_NAME.ADD_MULTIPLIER_ON_CREATE_BLACKHOLE
		// let val = this.offences.get(blackhole_mul)
		if (this.offences.has(blackhole_mul)) {
			pkg.addExecuted(blackhole_mul, this.invoker.turn)
			pkg.addAction(
				new AddMultiplierAction(this.invoker.turn, this.whiteholepos, chooseRandom([2, 4, 8])),
				blackhole_mul
			)
		}
		return pkg
	}
}