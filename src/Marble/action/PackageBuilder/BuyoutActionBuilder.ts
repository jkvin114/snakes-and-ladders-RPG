
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import type { BuildableTile } from "../../tile/BuildableTile"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { BuyoutAction } from "../InstantAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"


export class BuyoutActionBuilder extends ActionPackageBuilder {
	tile: BuildableTile
	main: BuyoutAction

	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, tile: BuildableTile, price: number) {
		super(game, trace, invoker, EVENT_TYPE.DO_BUYOUT)
		this.tile = tile
		this.main = new BuyoutAction(invoker.turn, tile, price)
	}
	setDefender(p: MarblePlayer): this {
		this.setDefences(p, EVENT_TYPE.BEING_BUYOUT)
		return this
	}
	build(): ActionPackage {
		return super.build().addMain(this.main)
	}
}