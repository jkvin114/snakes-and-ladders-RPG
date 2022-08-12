
import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import type { BuildableTile } from "../../tile/BuildableTile"
import { BUILDING, TILE_TYPE } from "../../tile/Tile"
import { TileFilter } from "../../tile/TileFilter"
import { chooseRandom } from "../../util"
import { ACTION_TYPE, MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { LinePullAction, RangePullAction } from "../DelayedAction"
import { AddMultiplierAction, AutoBuildAction, BuyoutAction, RequestMoveAction } from "../InstantAction"
import { BlackholeTileSelectionAction, TileSelectionAction } from "../QueryAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"


export class OnBuildActionBuilder extends ActionPackageBuilder {
	builds: BUILDING[]
	isAuto: boolean
	tile: BuildableTile
	isDirectBuild: boolean
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
		let value = this.offences.get(construction)
		if (!value || this.tile.getNextBuild() !== BUILDING.LANDMARK) return false

		pkg.addExecuted(construction, this.invoker.turn)
		pkg.addAction(new RequestMoveAction(this.invoker.turn, 0, MOVETYPE.FORCE_WALK), construction)
		return true
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
	private olympicPull(pkg: ActionPackage) {
		if (
			this.trace.useActionAndAbility(ACTION_TYPE.CHOOSE_OLYMPIC_POSITION, ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL) &&
			this.tile.isLandMark()
		) {
			pkg.addExecuted(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL, this.invoker.turn)
			pkg.addAction(
				new RangePullAction(this.invoker.turn, this.tile.position, 4),
				ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL
			)
			return true
		}
		return false
	}
	private redSticker(pkg: ActionPackage) {
		const redsticker = ABILITY_NAME.LINE_BUYOUT_ON_BUILD
		if (!this.offences.has(redsticker) || this.trace.hasAction(ACTION_TYPE.BUYOUT)) return false

		let tiles = this.game.map.getTiles(this.invoker, TileFilter.LANDS_CAN_BUYOUT().setSameLineOnly().setEnemyLandOnly())
		if (tiles.length === 0) return false

		this.trace.setAbilityName(redsticker).setName("빨간딱지")

		pkg.addExecuted(redsticker, this.invoker.turn)
		pkg.addAction(
			new TileSelectionAction(ACTION_TYPE.CHOOSE_BUYOUT_POSITION, this.invoker.turn, tiles, "buyout"),
			redsticker
		)
		return true
	}
	private newtown(pkg: ActionPackage) {
		const newtown = ABILITY_NAME.LINE_LANDMARK_ON_BUILD
		if (!this.offences.has(newtown) || this.tile.type === TILE_TYPE.SIGHT || this.invoker.pos === 0) return false

		let tiles = this.game.map.getTiles(this.invoker, TileFilter.LANDS_CAN_BUYOUT().setSameLineOnly().setMyLandOnly())
		if (tiles.length === 0) return false
		this.indicateMainBuild = false
		pkg.addExecuted(newtown, this.invoker.turn)
		for (const tile of tiles) {
			pkg.addAction(new AutoBuildAction(this.invoker.turn, tile, [BUILDING.LANDMARK]), newtown)
		}

		return true
	}
	build(): ActionPackage {
		let pkg = super.build()

		if (!this.isAuto) {
			this.constructionTool(pkg)
			this.newtown(pkg)

			if (this.tile.isLandMark()) {
				this.multiplier(pkg)
				this.blackhole(pkg)

				if (this.isDirectBuild) this.pull(pkg)
			}

			if (this.isDirectBuild) {
				this.redSticker(pkg)
			}
		} else {
			this.olympicPull(pkg)
		}

		return pkg
	}
}