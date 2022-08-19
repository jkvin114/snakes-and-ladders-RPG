import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { ACTION_TYPE, MOVETYPE } from "../Action"
import { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { MoveTileSelectionAction, TileSelectionAction } from "../QueryAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"

export class ArriveCornerTileActionBuilder extends ActionPackageBuilder {
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, event: EVENT_TYPE) {
		super(game, trace, invoker, event)
	}
	build(): ActionPackage {
		return super.build()
	}
	applyMoveOverrideAbility(pkg: ActionPackage) {
		const watson = ABILITY_NAME.CORNER_SPECIAL_MOVE_ON_ARRIVE_CORNER
        
		if (this.offences.has(watson) && !this.trace.useActionAndAbility(ACTION_TYPE.CHOOSE_MOVE_POSITION,watson)) {
			pkg.addExecuted(watson, this.invoker.turn)
			pkg.addAction(
				new MoveTileSelectionAction(
					this.invoker.turn,
					this.game.map.getSpecialPositions().concat(this.game.map.getCornerPositions()),
					MOVETYPE.TELEPORT
				),
				watson
                )
                // this.trace.setAbilityName(watson)
			return true
		}
		return false
	}
}
