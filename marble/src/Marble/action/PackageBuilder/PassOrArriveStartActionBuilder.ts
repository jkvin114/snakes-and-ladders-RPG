
import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { BUILDING } from "../../tile/Tile"
import { TileFilter } from "../../tile/TileFilter"
import { chooseRandom } from "../../util"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { AddMultiplierAction, AutoBuildAction, EarnMoneyAction } from "../InstantAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"
	

export class PassOrArriveStartActionBuilder extends ActionPackageBuilder {
	private main: EarnMoneyAction
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, salary_amt: number) {
		super(game, trace, invoker, EVENT_TYPE.PASS_START)
		this.main = new EarnMoneyAction(invoker.turn, salary_amt)
	}
	build(): ActionPackage {
		let pkg = super.build()
		this.salaryBonus(pkg)
		this.passMultiplier(pkg)
		this.buildLandmark(pkg)

		return pkg.addMain(this.main)
	}

	buildLandmark(pkg: ActionPackage){
		const odin = ABILITY_NAME.BUILD_LANDMARK_ON_PASS_START
		let val = this.offences.get(odin)
		if (!val) return false
		let lands = this.game.map.getTiles(this.invoker, TileFilter.MY_LAND().setOnlyMoreBuildable())
		if (lands.length === 0) return false

		pkg.addExecuted(odin, this.invoker.turn)
		let selected = chooseRandom(lands)
		pkg.addAction(new AutoBuildAction(this.invoker.turn,selected, [BUILDING.LANDMARK]), odin)
		pkg.addAction(new AddMultiplierAction(this.invoker.turn,selected, 2), odin)

		return true
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
		this.main.applyMultiplier(1 + val.value * 0.01)
		this.invoker.incrementTotalBet(this.main.amount)
		return true
	}
}