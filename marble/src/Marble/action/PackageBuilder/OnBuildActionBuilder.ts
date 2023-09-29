
import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { START_POS } from "../../mapconfig"
import type { BuildableTile } from "../../tile/BuildableTile"
import { BUILDING, TILE_TYPE } from "../../tile/Tile"
import { TileFilter } from "../../tile/TileFilter"
import { chooseRandom, cl } from "../../util"
import { ACTION_TYPE, MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import { ActionTrace, ActionTraceTag } from "../ActionTrace"
import { LinePullAction, RangePullAction } from "../DelayedAction"
import { AddMultiplierAction, AutoBuildAction,  LandModifierAction,  RequestMoveAction } from "../InstantAction"
import { BlackholeTileSelectionAction, DiceChanceAction, MoveTileSelectionAction, TileSelectionAction } from "../QueryAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"


export class OnBuildActionBuilder extends ActionPackageBuilder {
	readonly builds: BUILDING[]
	readonly isAuto: boolean
	readonly tile: BuildableTile
	readonly isDirectBuild: boolean
	indicateMainBuild: boolean //기본 건설 클라이언트에 표시하는지 여부(즉시 업그레이드시 표시안함)
	constructor(
		game: MarbleGame,
		trace: ActionTrace,
		invoker: MarblePlayer,
		tile: BuildableTile,
		builds: BUILDING[],
		isAuto: boolean
	) {
		super(game, trace, invoker, builds.includes(BUILDING.LANDMARK) ? EVENT_TYPE.BUILD_LANDMARK : EVENT_TYPE.BUILD)
		this.isAuto = isAuto
		this.builds = builds
		this.tile = tile
		this.isDirectBuild = tile.position === this.invoker.pos
		this.indicateMainBuild = true
	}
	private constructionTool(pkg: ActionPackage) {
		const construction = ABILITY_NAME.GO_START_ON_THREE_HOUSE
		const inplace_construction = ABILITY_NAME.MOVE_IN_PLACE_ON_BUILD
		let nextbuild=this.tile.getNextBuild()

		if (nextbuild !== BUILDING.LANDMARK) return false

		if(this.offences.has(inplace_construction)){
			pkg.addAction(new RequestMoveAction(this.invoker.turn, this.invoker.pos, MOVETYPE.FORCE_WALK)
			.reserveAbilityIndicatorOnPop(inplace_construction, this.invoker.turn), inplace_construction)
			return true
		}
		else if(this.offences.has(construction)){

			// pkg.addExecuted(construction, this.invoker.turn)
			pkg.addAction(new RequestMoveAction(this.invoker.turn, 0, MOVETYPE.FORCE_WALK)
			.reserveAbilityIndicatorOnPop(construction, this.invoker.turn), construction)
			return true
		}
		return false
	}
	private blackhole(pkg: ActionPackage) {
		const blackhole = ABILITY_NAME.BLACKHOLE_ON_BUILD_LANDMARK
		let bh = this.offences.get(blackhole)
		if (!bh) return false
		pkg.addExecuted(blackhole, this.invoker.turn)
		pkg.addAction(
			new BlackholeTileSelectionAction(
				this.invoker.turn,
				this.game.map.getTiles(this.invoker, new TileFilter().setExclude([this.tile.position])),
				this.tile.position
			),
			blackhole
		)
		return true
	}
	private pull(pkg: ActionPackage) {
		if (!this.isDirectBuild) return false

		const abilities = [ABILITY_NAME.LINE_PULL_ON_ARRIVE_AND_BUILD_LANDMARK, ABILITY_NAME.RANGE_PULL_ON_BUILD_LANDMARK]
		for (const [i, a] of abilities.entries()) {
			let val = this.offences.get(a)
			if (!val) continue
			if (i === 0) {
				pkg.addAction(
					new LinePullAction(this.invoker.turn, this.tile.position).reserveAbilityIndicatorOnPop(a, this.invoker.turn),
					a
				)
				return true
			}
			if (i === 1) {
				pkg.addAction(
					new RangePullAction(this.invoker.turn, this.tile.position, 4).reserveAbilityIndicatorOnPop(
						a,
						this.invoker.turn
					),
					a
				)
				return true
			}
		}

		return true
	}
	private multiplier(pkg: ActionPackage) {
		const mul = ABILITY_NAME.ADD_MULTIPLIER_ON_BUILD_LANDMARK
		let val = this.offences.get(mul)
		if (!val) return false
		pkg.addExecuted(mul, this.invoker.turn)
		pkg.addAction(new AddMultiplierAction(this.invoker.turn, this.tile.position, chooseRandom([2, 4, 8])), mul)
	}
	
	private redSticker(pkg: ActionPackage) {
		const redsticker = ABILITY_NAME.LINE_BUYOUT_ON_BUILD
		if (!this.offences.has(redsticker) 
		|| this.trace.useActionAndAbility(ACTION_TYPE.CHOOSE_BUYOUT_POSITION,redsticker)) return false

		let tiles = this.game.map.getTiles(this.invoker, TileFilter.LANDS_CAN_BUYOUT().setSameLineOnly().setEnemyLandOnly())
		if (tiles.length === 0) return false

		this.trace.setAbilityName(redsticker).setName("빨간딱지").addTag(ActionTraceTag.IGNORE_BLOCK_BUYOUT)

		pkg.addExecuted(redsticker, this.invoker.turn)
		pkg.addAction(
			new TileSelectionAction(ACTION_TYPE.CHOOSE_BUYOUT_POSITION, this.invoker.turn, tiles, "buyout"),
			redsticker
		)
		return true
	}
	private buildUpgrades(pkg: ActionPackage) {
		const newtown = ABILITY_NAME.LINE_LANDMARK_ON_BUILD
		const auto_upgrade = ABILITY_NAME.UPGRADE_LAND_AND_MULTIPLIER_ON_BUILD
		if(this.tile.type === TILE_TYPE.SIGHT) return false

		if(this.offences.has(newtown) && this.invoker.pos !== 0)
		{
			let tiles = this.game.map.getTiles(this.invoker, TileFilter.LANDS_CAN_BUYOUT().setSameLineOnly().setMyLandOnly())
			if (tiles.length === 0) return false
			this.indicateMainBuild = false
			pkg.addExecuted(newtown, this.invoker.turn)
			for (const tile of tiles) {
				pkg.addAction(new AutoBuildAction(this.invoker.turn, tile, [BUILDING.LANDMARK]), newtown)
			}
			return true
		}
		else if(this.offences.has(auto_upgrade)){
			pkg.addExecuted(auto_upgrade, this.invoker.turn)
			pkg.addAction(new AutoBuildAction(this.invoker.turn,this.tile.position,[this.tile.getNextBuild()]),auto_upgrade)
			pkg.addAction(new AddMultiplierAction(this.invoker.turn,this.tile.position,2),auto_upgrade)

			if(this.tile.getNextBuild()===BUILDING.LANDMARK
			||this.tile.getNextBuild()===BUILDING.VILLA) this.indicateMainBuild = false

			return true
		}
		return false
	}
	private additionalBuild(pkg:ActionPackage){
		const nirvana=ABILITY_NAME.ADDITIONAL_LANDMARK_ON_BUILD
		if(this.offences.has(nirvana)){
			let tiles = this.game.map.getTiles(this.invoker, TileFilter.MY_LANDTILE().setNoLandMark().setExclude([this.tile.position]))
			if(tiles.length===0)
				tiles = this.game.map.getTiles(this.invoker, TileFilter.EMPTY_LANDTILE())

			if(tiles.length===0) return false
			let pos=chooseRandom(tiles)
			pkg.addAction(new AutoBuildAction(this.invoker.turn,pos,[BUILDING.LANDMARK]),nirvana)
			pkg.addExecuted(nirvana,this.invoker.turn)
			if(pos===this.tile.position) this.indicateMainBuild=false
			return true
		}
		return false
	}
	private buildLandmarkEvent(pkg:ActionPackage){
		const adice=ABILITY_NAME.DICE_CHANCE_ON_BUILD_LANDMARK
		const move=ABILITY_NAME.MY_LAND_MOVE_ON_BUILD_LANDMARK

		if(this.offences.has(move)){
			let tiles = this.game.map.getTiles(this.invoker, TileFilter.MY_LAND().setExcludeMyPos())
			if(tiles.length===0) return false
			pkg.addAction(
				new MoveTileSelectionAction(this.invoker.turn, tiles,MOVETYPE.TELEPORT)
				.reserveAbilityIndicatorOnPop(move,this.invoker.turn),
				move
			)
			return true
		}
		else if((this.offences.has(adice))){
			pkg.addAction(new DiceChanceAction(this.invoker.turn,true).reserveAbilityIndicatorOnPop(adice,this.invoker.turn),adice)
			return true
		}
		return false
	}
	private checkStartBuild(pkg:ActionPackage){
		const lock=ABILITY_NAME.LOCK_MULTIPLIER_AND_DOUBLE_ON_START_BUILD
		if(this.offences.has(lock) && this.invoker.pos===START_POS){
			pkg.addExecuted(lock, this.invoker.turn)
            pkg.addAction(new LandModifierAction(this.invoker.turn, this.tile.position, "lock"), lock)
			pkg.addAction(new AddMultiplierAction(this.invoker.turn, this.tile.position, 2), lock)

		}
	}
	build(): ActionPackage {
		let pkg = super.build()
		
		if(this.tile.isLandMark()){
			this.blackhole(pkg)
			this.buildLandmarkEvent(pkg)
		}

		if (!this.isAuto) {
			this.buildUpgrades(pkg)
			this.additionalBuild(pkg)
			if (this.tile.isLandMark()) {
				this.multiplier(pkg)
				this.checkStartBuild(pkg)
				if (this.isDirectBuild) this.pull(pkg)
			}
			else{
				this.constructionTool(pkg)
			}

			if (this.isDirectBuild) {
				this.redSticker(pkg)
			}
		} else {
			// this.olympicPull(pkg)
		}
		return pkg
	}
}