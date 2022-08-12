


import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { RequestMoveAction } from "../InstantAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"

export class ArriveBlackholeActionBuilder extends ActionPackageBuilder {
	black: number
	white: number
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, black: number, white: number) {
		super(game, trace, invoker, EVENT_TYPE.ARRIVE_BLACKHOLE)
		this.black = black
		this.white = white
	}
	build(): ActionPackage {
		let pkg = super.build().addMain(new RequestMoveAction(this.invoker.turn, this.white, MOVETYPE.BLACKHOLE))

		return pkg
	}
}
