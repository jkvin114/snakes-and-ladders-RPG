import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import type { BuildableTile } from "../../tile/BuildableTile"
import type { ActionPackage } from "../ActionPackage"
import { ActionTrace, ActionTraceTag } from "../ActionTrace"
import { AddMultiplierAction, BuyoutAction, IndicateDefenceAction } from "../InstantAction"
import { ActionPackageBuilder, DefendableActionBuilder } from "./ActionPackageBuilder"


export class BuyoutActionBuilder extends DefendableActionBuilder {
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
		let pkg= super.build().addMain(this.main)
		const cloe=ABILITY_NAME.BLOCK_BUYOUT
		if(this.defences.has(cloe) && !this.trace.useTag(ActionTraceTag.IGNORE_BLOCK_BUYOUT)){
			// pkg.blockMain()
			pkg.replaceMain(new IndicateDefenceAction("block",this.invoker.pos)) 
			pkg.addExecuted(cloe,this.defender.turn)
		}
		else if(this.trace.useTag(ActionTraceTag.FREE_BUYOUT)){
			pkg.addAction(new AddMultiplierAction(this.invoker.turn, this.tile.position, 2), ABILITY_NAME.FREE_BUYOUT_AND_DOUBLE)
			pkg.addExecuted(ABILITY_NAME.FREE_BUYOUT_AND_DOUBLE,this.invoker.turn,1)
		}
		return pkg
	}
}