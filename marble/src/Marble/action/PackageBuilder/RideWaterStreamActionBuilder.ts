import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { TileFilter } from "../../tile/TileFilter"
import { ACTION_TYPE, MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { RequestMoveAction, SimpleInstantAction } from "../InstantAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"

export class RideWaterStreamActionBuilder extends ActionPackageBuilder {
	destPos: number
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, destPos: number) {
		super(game, trace, invoker, EVENT_TYPE.RIDE_WATERSTREAM)
		this.destPos = destPos
	}
	build(): ActionPackage {
		let pkg = super.build()
		pkg.addMain(new RequestMoveAction(this.invoker.turn, this.destPos, MOVETYPE.WATERSTREAM,this.game.thisturn))
		return pkg
	}
}
