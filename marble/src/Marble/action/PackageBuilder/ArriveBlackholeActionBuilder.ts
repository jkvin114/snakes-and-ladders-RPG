import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { TileFilter } from "../../tile/TileFilter"
import { ACTION_TYPE, MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { RequestMoveAction, SimpleInstantAction } from "../InstantAction"
import { MoveTileSelectionAction } from "../QueryAction"
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
		let pkg = super.build()
		const escape=ABILITY_NAME.MY_LAND_MOVE_ON_BLACKHOLE
		let mylands=this.game.map.getTiles(this.invoker,TileFilter.MY_LAND().setExcludeMyPos())
		
		
		if(this.offences.has(escape) && mylands.length>0){
			pkg.addAction(new MoveTileSelectionAction(this.invoker.turn,mylands,MOVETYPE.TELEPORT),escape)
			pkg.addExecuted(escape,this.invoker.turn)
		}
		else{
			pkg.addMain(new RequestMoveAction(this.invoker.turn, this.white, MOVETYPE.BLACKHOLE,this.game.thisturn))
		}
		pkg.addMain(new SimpleInstantAction(ACTION_TYPE.REMOVE_BLACKHOLE))
		return pkg
	}
}
