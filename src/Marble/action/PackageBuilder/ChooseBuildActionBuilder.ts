import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type{ MarblePlayer } from "../../Player"
import { ServerRequestModel } from "../../Model/ServerRequestModel"
import type{ BuildableTile } from "../../tile/BuildableTile"
import { LandTile } from "../../tile/LandTile"
import { TILE_TYPE } from "../../tile/Tile"
import { EmptyAction, ACTION_TYPE } from "../Action"
import { ActionPackage } from "../ActionPackage"
import type{ ActionTrace } from "../ActionTrace"
import { SendMessageAction } from "../InstantAction"
import { AskBuildAction } from "../QueryAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"

export class ChooseBuildActionBuilder extends ActionPackageBuilder {
	tile: BuildableTile

    /**
     * always builds to single main action
     * @param game 
     * @param source 
     * @param invoker 
     * @param tile 
     */
	constructor(game: MarbleGame, source: ActionTrace, invoker: MarblePlayer, tile: BuildableTile) {
		super(game, source, invoker, EVENT_TYPE.CHOOSE_BUILD)
		this.tile = tile
	}
    private getMainAction(){

        let playerTurn=this.invoker.turn

        let mainaction = new SendMessageAction(playerTurn,"build_no_more")

		if(this.tile.isLandMark() || (this.tile.type===TILE_TYPE.SIGHT && this.tile.owned())) 
            return new EmptyAction()

		if (this.tile.owned() && !this.tile.isMoreBuildable()) {
			return mainaction
		}
		let builds: ServerRequestModel.buildAvaliability[] = []
		const flag=this.trace.hasAbilityInNumberOfMove(ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL,1) &&
        this.trace.useActionAndAbility(ACTION_TYPE.PREPARE_TRAVEL,ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL)

		if (
			flag &&
			this.tile instanceof LandTile
		) {
			builds = this.tile.getLandMarkBuildData(true)
		} else if (this.invoker.canBuildLandOfMinimumPrice(this.tile.getMinimumBuildPrice())) {
			builds = this.tile.getBuildingAvaliability(this.invoker.cycleLevel)
		}
		else{
			mainaction.message="no_money"
			return mainaction
		}
		if (builds.length > 0)
			return new AskBuildAction(
				playerTurn,
				this.tile.position,
				builds,
				this.tile.getCurrentBuilds(),
				this.invoker.getBuildDiscount(),
				this.invoker.money
			)
			return new EmptyAction()
    }

    build(): ActionPackage {
        let pkg=super.build()
        pkg.addMain(this.getMainAction())
        return pkg
    }
}