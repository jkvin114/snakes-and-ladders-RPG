

import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { ACTION_TYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import { ActionTrace, ActionTraceTag } from "../ActionTrace"
import { PrepareTravelAction } from "../InstantAction"
import { DiceChanceAction } from "../QueryAction"
import { ArriveCornerTileActionBuilder } from "./ArriveCornerTileActionBuilder"

export class ArriveTravelActionBuilder extends ArriveCornerTileActionBuilder {
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer) {
		super(game, trace, invoker, EVENT_TYPE.ARRIVE_TRAVEL)
	}

	private instantTravel(pkg:ActionPackage){
		const freepass = ABILITY_NAME.INSTANT_TRAVEL

		if(!this.isInvokersTurn()) return false
		
		if(this.offences.has(freepass)){
			pkg.addExecuted(freepass, this.invoker.turn)
			return true
		}
		
		return false
	}
	private travelOverrider(pkg:ActionPackage){
		if(!this.isInvokersTurn()) return false
		const sophie=ABILITY_NAME.TRAVEL_ON_PASS_TRAVEL_AND_DICE_CHANCE
		if(this.offences.has(sophie))
		{
			// this.trace.addTag(ActionTraceTag.SOPHIE_TRAVEL).setName("소피")
			pkg.addExecuted(sophie,this.invoker.turn)
			pkg.addAction(new PrepareTravelAction(this.invoker.turn),sophie)

			return true
		}
		return false
	}
	build(): ActionPackage {
		let pkg = super.build()
		const taxi = ABILITY_NAME.ONE_MORE_DICE_AFTER_TRAVEL

		if(!this.applyMoveOverrideAbility(pkg) && !this.travelOverrider(pkg)){
			if(!this.instantTravel(pkg))
				pkg.setMainToPendingAction()

			pkg.addMain(new PrepareTravelAction(this.invoker.turn))

			
		}

		return pkg
	}
}