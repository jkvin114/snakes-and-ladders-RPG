import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type{ MarblePlayer } from "../../Player"
import type{ BuildableTile } from "../../tile/BuildableTile"
import type{ Action } from "../Action"
import type{ ActionPackage } from "../ActionPackage"
import type{ ActionTrace } from "../ActionTrace"
import { ActionPackageBuilder } from "./ActionPackageBuilder"

export class ArriveEmptyLandActionBuilder extends ActionPackageBuilder {
	tile: BuildableTile
	main: Action

	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, tile: BuildableTile) {
		super(game, trace, invoker, EVENT_TYPE.ARRIVE_MY_LAND)
		this.tile = tile
		this.main = this.game.getAskBuildAction(invoker.turn, tile, trace)
	}
	build(): ActionPackage {
		return super.build().addMain(this.main)
	}
}