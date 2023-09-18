import { ABILITY_NAME } from "../../Ability/AbilityRegistry";
import { EVENT_TYPE } from "../../Ability/EventType";
import type { MarbleGame } from "../../Game";
import type { MarblePlayer } from "../../Player";
import type { BuildableTile } from "../../tile/BuildableTile";
import { BUILDING, TILE_TYPE } from "../../tile/Tile";
import { ACTION_TYPE, MOVETYPE } from "../Action";
import { ActionPackage } from "../ActionPackage";
import { ActionTrace, ActionTraceTag } from "../ActionTrace";
import { RangePullAction } from "../DelayedAction";
import { AutoBuildAction, PrepareTravelAction } from "../InstantAction";
import { ActionPackageBuilder } from "./ActionPackageBuilder";

export class SelectOlympicActionBuilder extends ActionPackageBuilder{
    tile:BuildableTile
    constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer,tile:BuildableTile) {
		super(game, trace, invoker, EVENT_TYPE.SELECT_OLYMPIC)
        this.tile=tile
	}
    private olympicPull(pkg: ActionPackage) {
        pkg.addExecuted(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL, this.invoker.turn,1)
        pkg.addAction(
            new RangePullAction(this.invoker.turn, this.tile.position, 4),
            ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL
        )
	}
    build(): ActionPackage {
        let pkg = super.build()

        if (
			this.trace.useActionAndAbility(ACTION_TYPE.CHOOSE_OLYMPIC_POSITION, ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL) &&
			this.tile.type===TILE_TYPE.LAND
		) {
            if(!this.tile.isLandMark())
                pkg.addAction(
                    new AutoBuildAction(this.invoker.turn, this.tile.position, [BUILDING.LANDMARK])
                    .addAbilityToActionTrace(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL),
                    ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL
                )
            this.olympicPull(pkg)
		}

        
        return pkg
    }
}