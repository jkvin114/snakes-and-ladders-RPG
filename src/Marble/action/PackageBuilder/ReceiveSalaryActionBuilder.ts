
import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { TileFilter } from "../../tile/TileFilter"
import { chooseRandom } from "../../util"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { AddMultiplierAction, EarnMoneyAction } from "../InstantAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"
	

export class PassOrArriveStartActionBuilder extends ActionPackageBuilder {
	private main: EarnMoneyAction
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, amt: number) {
		super(game, trace, invoker, EVENT_TYPE.RECEIVE_SALARY)
		this.main = new EarnMoneyAction(invoker.turn, amt)
	}
	build(): ActionPackage {
		let pkg = super.build()
		this.salaryBonus(pkg)
		this.passMultiplier(pkg)
		return pkg.addMain(this.main)
	}
	passMultiplier(pkg: ActionPackage) {
		const name = ABILITY_NAME.ADD_MULTIPLIER_ON_PASS_START
		let val = this.offences.get(name)
		if (!val) return false

		let lands = this.game.map.getTiles(this.invoker, TileFilter.MY_LAND())
		if (lands.length === 0) return false

		pkg.addExecuted(name, this.invoker.turn)
		pkg.addAction(new AddMultiplierAction(this.invoker.turn, chooseRandom(lands), 4), name)
		return true
	}
	salaryBonus(pkg: ActionPackage) {
		const name = ABILITY_NAME.SALARY_BONUS
		let val = this.offences.get(name)
		if (!val) return false
		pkg.addExecuted(name, this.invoker.turn)
		this.main.applyMultiplier(1 + val.getValue() * 0.01)

		return true
	}
}