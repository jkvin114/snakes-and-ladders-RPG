
import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import type { BuildableTile } from "../../tile/BuildableTile"
import { TileFilter } from "../../tile/TileFilter"
import { Action,  MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { LinePullAction, RangePullAction } from "../DelayedAction"
import { AddMultiplierAction, EarnMoneyAction, RequestMoveAction } from "../InstantAction"
import { BlackholeTileSelectionAction, MoveTileSelectionAction } from "../QueryAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"



export class ArriveMyLandActionBuilder extends ActionPackageBuilder {
	tile: BuildableTile
	main: Action
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, tile: BuildableTile) {
		super(game, trace, invoker, EVENT_TYPE.ARRIVE_MY_LAND)
		this.tile = tile
		this.main = this.game.getAskBuildAction(invoker.turn, tile, trace)
	}

	teleportMoveAbilities(pkg: ActionPackage) {
		if (!this.isInvokersTurn()) return false

		const line = ABILITY_NAME.LINE_MOVE_ON_ARRIVE_MY_LAND
		const myland = ABILITY_NAME.MY_LAND_MOVE_ON_ARRIVE_MY_LAND
		const players = ABILITY_NAME.MOVE_TO_PLAYER_AND_STEAL_ON_ARRIVE_MY_LAND
		let tiles: number[] = []
		let selectedability = ABILITY_NAME.NONE
		if (this.offences.has(players)) {
			selectedability = players
			tiles = this.game.getOtherPlayerPositions(this.invoker)
            .filter((pos)=>pos!==this.invoker.pos)

			this.trace.setAbilityName(players).setName("인술서")
		} else if (this.offences.has(myland)) {
			selectedability = myland
			tiles = this.game.map.getTiles(this.invoker, TileFilter.MY_LAND().setExcludeMyPos())
		} else if (this.offences.has(line)) {
			selectedability = line
			tiles = this.game.map.getTiles(this.invoker, TileFilter.ALL_EXCLUDE_MY_POS().setSameLineOnly())
		}

		if (tiles.length > 0) {
            pkg.addExecuted(selectedability, this.invoker.turn)

			pkg.addAction(
				new MoveTileSelectionAction(this.invoker.turn, tiles, "free_move", MOVETYPE.TELEPORT),
				selectedability
			)
			return true
		}

		return false
	}
	monument(pkg: ActionPackage) {
		if (!this.isInvokersTurn()) return false
		const abilities = [
			ABILITY_NAME.ADD_MULTIPLIER_ON_ARRIVE_MY_LAND,
		]

		for (const ab of abilities) {
			let val = this.offences.get(ab)
			if (val != null) {
				pkg.addExecuted(ab, this.invoker.turn)
				pkg.addAction(new AddMultiplierAction(this.invoker.turn, this.tile.position, 2), ab)
				return true
			}
		}
		return false
	}
	ring(pkg: ActionPackage) {
		const ring = ABILITY_NAME.MONEY_ON_MY_LAND

		let value = this.offences.get(ring)
		if (value != null) {
			pkg.addExecuted(ring, this.invoker.turn)
			pkg.addAction(
				new EarnMoneyAction(this.invoker.turn, Math.floor(this.tile.getBuildPrice() * value.getValue() * 0.01)),
				ring
			)
			return true
		}
		return false
	}
	build(): ActionPackage {
		let pkg = super.build()
		const magnetic = ABILITY_NAME.RANGE_PULL_ON_ARRIVE_LANDMARK
		const line_magnetic = ABILITY_NAME.LINE_PULL_ON_ARRIVE_AND_BUILD_LANDMARK
		const call = ABILITY_NAME.CALL_PLAYERS_ON_TRAVEL
		const blackhole = ABILITY_NAME.BLACKHOLE_ON_ARRIVE_LANDMARK
		const PULL_RANGE = 4

		this.ring(pkg)
		this.monument(pkg)

		if (this.tile.isLandMark()) {
			let mg = this.offences.get(magnetic)
			let linemg = this.offences.get(line_magnetic)
			let bosscall = this.offences.get(call)
			let bh = this.offences.get(blackhole)

			if (bh != null) {
				pkg.addExecuted(blackhole, this.invoker.turn)
				pkg.addAction(
					new BlackholeTileSelectionAction(
						this.invoker.turn,
						this.game.map.getTiles(this.invoker, new TileFilter().setExclude([this.tile.position])),
						this.tile.position
					),
					blackhole
				)
			}

			if (bosscall != null && this.game.mediator.getPlayersAt([this.game.map.travel]).length > 0) {
				let targets = this.game.mediator.getPlayersAt([this.game.map.travel])
				pkg.addExecuted(call, this.invoker.turn)
				for (const p of targets) {
					pkg.addAction(new RequestMoveAction(p.turn, this.invoker.pos, MOVETYPE.TELEPORT), call)
				}
			} else if (linemg != null) {
				// pkg.addExecuted(line_magnetic,this.invoker.turn)
				pkg.addAction(
					new LinePullAction(this.invoker.turn, this.tile.position).reserveAbilityIndicatorOnPop(
						line_magnetic,
						this.invoker.turn
					),
					line_magnetic
				)
			} else if (mg != null) {
				// pkg.addExecuted(magnetic,this.invoker.turn)
				pkg.addAction(
					new RangePullAction(this.invoker.turn, this.tile.position, PULL_RANGE).reserveAbilityIndicatorOnPop(
						magnetic,
						this.invoker.turn
					),
					magnetic
				)
			}
		}

		const ehealing = ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_AND_MY_LAND

		if (this.teleportMoveAbilities(pkg)) {
		} else if (this.offences.has(ehealing)) {
			pkg.addExecuted(ehealing, this.invoker.turn)
			pkg.addAction(new RequestMoveAction(this.invoker.turn, 24, MOVETYPE.FORCE_WALK), ehealing)
		}

		return pkg.addMain(this.main)
	}
}