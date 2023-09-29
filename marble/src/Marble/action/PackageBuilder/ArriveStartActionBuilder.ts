import { ABILITY_NAME } from "../../Ability/AbilityRegistry";
import { EVENT_TYPE } from "../../Ability/EventType";
import type { MarbleGame } from "../../Game";
import type { MarblePlayer } from "../../Player";
import { TileFilter } from "../../tile/TileFilter";
import { ACTION_TYPE, MOVETYPE } from "../Action";
import { ActionPackage } from "../ActionPackage";
import { ActionTrace, ActionTraceTag } from "../ActionTrace";
import { MoveTileSelectionAction, TileSelectionAction } from "../QueryAction";
import { ArriveCornerTileActionBuilder } from "./ArriveCornerTileActionBuilder";

export class ArriveStartActionBuilder extends ArriveCornerTileActionBuilder{
    constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer) {
		super(game, trace, invoker, EVENT_TYPE.ARRIVE_START)
	}
    build(): ActionPackage {
        let pkg = super.build()
        let targetTiles = this.game.map.getTiles(
			this.invoker,
			TileFilter.MY_LANDTILE().setOnlyMoreBuildable()
		)
		if (targetTiles.length>0){
            pkg.addMain(new TileSelectionAction(
				ACTION_TYPE.CHOOSE_BUILD_POSITION,
				this.invoker.turn,
				targetTiles,
				"start_build"
			).addFlagToActionTrace(ActionTraceTag.START_BUILD))
        }
        this.applyMoveOverrideAbility(pkg)
        return pkg
    }
}