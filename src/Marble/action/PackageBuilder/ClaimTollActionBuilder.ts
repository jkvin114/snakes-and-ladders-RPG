
import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import { CARD_NAME } from "../../FortuneCard"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import type { BuildableTile } from "../../tile/BuildableTile"
import {  forwardBy, percentValueToMultiplier } from "../../util"
import { ACTION_TYPE, MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import {   PayTollAction } from "../InstantAction"
import { AskTollDefenceCardAction } from "../QueryAction"
import { ActionPackageBuilder, DefendableActionBuilder } from "./ActionPackageBuilder"


export class ClaimTollActionBuilder extends DefendableActionBuilder {
	private tile: BuildableTile
	private toll: number
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, tile: BuildableTile, baseToll: number) {
		super(game, trace, invoker, EVENT_TYPE.CLAIM_TOLL)
		this.tile = tile
		this.toll = baseToll
	}
	setDefender(p: MarblePlayer): this {
		this.setDefences(p, EVENT_TYPE.TOLL_CLAIMED)
		return this
	}
	build(): ActionPackage {
		let main = new PayTollAction(this.defender.turn, this.invoker.turn, this.toll)
		let pkg = super.build()

		// if (this.trace.useActionAndAbility(ACTION_TYPE.ARRIVE_TILE, ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND)||
        // this.trace.useActionAndAbility(ACTION_TYPE.ARRIVE_TILE, ABILITY_NAME.MY_LAND_MOVE_AND_FREE_ON_ARRIVE_ENEMY_LAND))
		// 	main.applyMultiplier(0)

		if (main.amount === 0) return pkg

		const atoll = ABILITY_NAME.ADDITIONAL_TOLL
		const angel = ABILITY_NAME.ANGEL_CARD
		const discount = ABILITY_NAME.DISCOUNT_CARD
		const free = ABILITY_NAME.FREE_TOLL
		const ignore_angel = ABILITY_NAME.IGNORE_ANGEL

		let value = this.offences.get(atoll)

		if (value != null) {
			pkg.addExecuted(atoll, this.invoker.turn)
			main.applyMultiplier(percentValueToMultiplier(value.getValue()))
		}

		if(this.trace.thisMoveHasAbility(ABILITY_NAME.THROW_TO_LANDMARK_AND_DONATE_ON_ENEMY_ARRIVE_TO_ME)){
			pkg.addExecuted(ABILITY_NAME.THROW_TO_LANDMARK_AND_DONATE_ON_ENEMY_ARRIVE_TO_ME,this.invoker.turn)
			main.applyMultiplier(2)
		}
		
		if(this.trace.thisMoveHasAbility(ABILITY_NAME.STOP_ENEMY_ON_MY_LANDMARK)){
			pkg.addExecuted(ABILITY_NAME.STOP_ENEMY_ON_MY_LANDMARK,this.invoker.turn)
			main.applyMultiplier(2)
		}

		if (this.defences.has(free)) {
			pkg.addExecuted(free, this.defender.turn)
			main.applyMultiplier(0)
		} else if (this.defences.has(angel)) {
			let blocked = false
			if (this.offences.has(ignore_angel) && this.tile.isLandMark()) blocked = true

			pkg.addAction(
				new AskTollDefenceCardAction(this.defender.turn, CARD_NAME.ANGEL, main.amount, 0)
					.setBlockActionId(main.getId())
					.setAttacker(this.invoker.turn)
					.setIgnore(blocked, ignore_angel),
				angel
			)
		} else if (this.defences.has(discount)) {
			pkg.addAction(
				new AskTollDefenceCardAction(this.defender.turn, CARD_NAME.DISCOUNT, main.amount, main.amount * 0.5)
					.setBlockActionId(main.getId())
					.setAttacker(this.invoker.turn),
				discount
			)
		}
		return pkg.addMain(main)
	}
}
