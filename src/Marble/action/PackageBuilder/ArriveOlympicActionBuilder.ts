

import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { ACTION_TYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import {  TileSelectionAction } from "../QueryAction"
import { ArriveCornerTileActionBuilder } from "./ArriveCornerTileActionBuilder"

export class ArriveOlympicActionBuilder extends ArriveCornerTileActionBuilder {
	mylands: number[]
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, mylands: number[]) {
		super(game, trace, invoker, EVENT_TYPE.ARRIVE_OLYMPIC)
		this.mylands = mylands
	}
	build(): ActionPackage {
		let pkg = super
			.build()
		let main=new TileSelectionAction(ACTION_TYPE.CHOOSE_OLYMPIC_POSITION, this.invoker.turn, this.mylands, "olympic")
		let val = this.offences.get(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL)
		if (val != null) {
			pkg.addExecuted(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL, this.invoker.turn)
			main.addAbilityToActionTrace(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL)
			// this.trace.setAbilityName(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL).setName("올림픽끌당")
		}
		this.applyMoveOverrideAbility(pkg)
		return pkg.addMain(main)
	}
}