
import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import type { BuildableTile } from "../../tile/BuildableTile"
import type { ActionPackage } from "../ActionPackage"
import { ActionTraceTag,  ActionTrace } from "../ActionTrace"
import { SendMessageAction } from "../InstantAction"
import {  AskBuyoutAction } from "../QueryAction"
import { ActionPackageBuilder, DefendableActionBuilder } from "./ActionPackageBuilder"


export class ClaimBuyoutActionBuilder extends DefendableActionBuilder {
	private tile: BuildableTile

	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, tile: BuildableTile) {
		super(game, trace, invoker, EVENT_TYPE.CLAIM_BUYOUT_PRICE)
		this.tile = tile
	}
	/**
	 * defender = buyer
	 * @param p 
	 * @returns 
	 */
	setDefender(p: MarblePlayer): this {
		this.setDefences(p, EVENT_TYPE.BUYOUT_PRICE_CLAIMED)
		return this
	}
	build(): ActionPackage {
		let originalprice = this.tile.getBuyOutPrice()
		let price = originalprice * this.defender.getBuyoutDiscount()
		let pkg = super.build()
		const free=ABILITY_NAME.FREE_BUYOUT_AND_DOUBLE
		const multiply = ABILITY_NAME.MULTIPLY_BUYOUT_PRICE
		if(this.offences.has(multiply)){
			price = price * this.invoker.getAbilityValueAmount(multiply)
			pkg.addExecuted(multiply,this.invoker.turn)
		}
		if(this.defences.has(free)){
			price = 0
			pkg.addExecuted(free,this.defender.turn)
			this.trace.addTag(ActionTraceTag.FREE_BUYOUT)
		}
		if (price <= this.defender.money)
			pkg.addMain(new AskBuyoutAction(this.defender.turn, this.tile.position, price, originalprice))
		else pkg.addMain(new SendMessageAction(this.defender.turn,"no_money"))
		return pkg
	}
}