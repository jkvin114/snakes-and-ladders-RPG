
import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { BuyoutAction, PayPercentMoneyAction } from "../InstantAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"


export class PassPlayerActionBuilder extends ActionPackageBuilder {
	oldpos: number
	newpos: number
	stopMover: boolean
	movetype: MOVETYPE
	constructor(
		game: MarbleGame,
		trace: ActionTrace,
		invoker: MarblePlayer,
		oldpos: number,
		newpos: number,
		movetype: MOVETYPE
	) {
		super(game, trace, invoker, EVENT_TYPE.PASS_ENEMY)
		this.oldpos = oldpos
		this.newpos = newpos
		this.stopMover = false
		this.movetype = movetype
	}
	setDefender(p: MarblePlayer): this {
		this.setDefences(p, EVENT_TYPE.ENEMY_PASS_ME)
		return this
	}
	blockingAbilities(pkg: ActionPackage) {
		if (this.movetype !== MOVETYPE.WALK) return false

		const police_car = ABILITY_NAME.STOP_ENEMY_ON_MY_LANDMARK
		let value = this.defences.get(police_car)

		if (value != null) {
			let tile = this.game.map.buildableTileAt(this.defender.pos)
			if (!tile || !tile.isLandMark() || tile.owner !== this.defender.turn) return false

			pkg.addExecuted(police_car, this.defender.turn)
			this.stopMover = true
			return true
		}

		return false
	}
	build(): ActionPackage {
		const agreement = ABILITY_NAME.TAKE_MONEY_ON_PASS_ENEMY
		const inverse_agreement = ABILITY_NAME.TAKE_MONEY_ON_ENEMY_PASS_ME

		let pkg = super.build()

		if (this.blockingAbilities(pkg)) return pkg

		let value = this.defences.get(inverse_agreement)
		if (value != null) {
			pkg.addExecuted(inverse_agreement, this.defender.turn)
			pkg.addAction(
				new PayPercentMoneyAction(this.invoker.turn, this.defender.turn, value.getValue()),
				inverse_agreement
			)
		}

		value = this.offences.get(agreement)
		if (value != null) {
			pkg.addExecuted(agreement, this.invoker.turn)
			pkg.addAction(new PayPercentMoneyAction(this.defender.turn, this.invoker.turn, value.getValue()), agreement)
		}
		return pkg
	}
}