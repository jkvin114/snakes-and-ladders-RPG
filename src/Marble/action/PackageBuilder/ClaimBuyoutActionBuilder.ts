
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import type { BuildableTile } from "../../tile/BuildableTile"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import {  AskBuyoutAction } from "../QueryAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"


export class ClaimBuyoutActionBuilder extends ActionPackageBuilder {
	private tile: BuildableTile

	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, tile: BuildableTile) {
		super(game, trace, invoker, EVENT_TYPE.CLAIM_BUYOUT_PRICE)
		this.tile = tile
	}
	setDefender(p: MarblePlayer): this {
		this.setDefences(p, EVENT_TYPE.BUYOUT_PRICE_CLAIMED)
		return this
	}
	build(): ActionPackage {
		let originalprice = this.tile.getBuyOutPrice()
		let price = originalprice * this.defender.getBuyoutDiscount()
		let pkg = super.build()

		if (price <= this.defender.money)
			pkg.addMain(new AskBuyoutAction(this.defender.turn, this.tile.position, price, originalprice))

		return pkg
	}
}