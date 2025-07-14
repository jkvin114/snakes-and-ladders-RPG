
import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { TRAVEL_POS } from "../../mapconfig"
import type { BuildableTile } from "../../tile/BuildableTile"
import { TileFilter } from "../../tile/TileFilter"
import {  Action, MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import { ActionTrace, ActionTraceTag } from "../ActionTrace"
import {  ApplyPlayerEffectAction, ClaimBuyoutAction, ClaimTollAction, LandModifierAction,  RequestMoveAction, StealMultiplierAction } from "../InstantAction"
import { MoveTileSelectionAction } from "../QueryAction"
import { ActionPackageBuilder, DefendableActionBuilder } from "./ActionPackageBuilder"


export class ArriveEnemyLandActionBuilder extends DefendableActionBuilder {
	tile: BuildableTile
	tollFree:boolean
	constructor(game: MarbleGame, trace: ActionTrace, mover: MarblePlayer, tile: BuildableTile) {
		super(game, trace, mover, EVENT_TYPE.ARRIVE_ENEMY_LAND)
		this.tile = tile
		this.tollFree=false
		//
	}
	/**
	 *
	 * @param landowner 땅 주인
	 * @returns
	 */
	setDefender(landowner: MarblePlayer): this {
		this.setDefences(landowner, EVENT_TYPE.ENEMY_ARRIVE_MY_LAND)
		return this
	}
	steal(ability: ABILITY_NAME, pkg: ActionPackage) {
		let dest = this.game.map.getLandToMoveMultiplier(this.invoker)
		if (dest > -1) {
			pkg.addExecuted(ability, this.invoker.turn)
			pkg.addAction(new StealMultiplierAction(this.invoker.turn, this.tile.position, dest), ability)
		}
		return dest
	}
	addHealing(pkg: ActionPackage, name: ABILITY_NAME) {
		pkg.addExecuted(name, this.invoker.turn)
		pkg.addAction(new RequestMoveAction(this.invoker.turn, TRAVEL_POS, MOVETYPE.FORCE_WALK,this.game.thisturn), name)
	}

	healing(pkg: ActionPackage) {
		const healing = ABILITY_NAME.TRAVEL_ON_ENEMY_LAND
		const bhealing = ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND
		const ehealing = ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_AND_MY_LAND

		if (this.offences.has(ehealing)) {
			this.addHealing(pkg, ehealing)
			this.tollFree=true
			// this.trace.setAbilityName(ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND).setName("어힐링")
		} else if (this.offences.has(bhealing)) {
			this.addHealing(pkg, bhealing)
			this.tollFree=true
			// this.trace.setAbilityName(ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND).setName("사힐링")
			return true
		} else if (this.offences.has(healing)) {
			this.addHealing(pkg, healing)
			return true
		}

		return false
	}
    stealMultiplier(pkg:ActionPackage){
        if (!this.tile.canStealMultiplier())  return false
		const blueprint = ABILITY_NAME.STEAL_MULTIPLIER
		const locker_blueprint = ABILITY_NAME.STEAL_MULTIPLIER_AND_LOCK

        if (this.offences.has(locker_blueprint)) {
            let dest = this.steal(locker_blueprint, pkg)

            if (dest >= 0) pkg.addAction(new LandModifierAction(this.invoker.turn, dest, "lock"), locker_blueprint)

            return true
        } else if (this.offences.has(blueprint)) {
            this.steal(blueprint, pkg)
            return true
        }
        return false
    }
    teleportAbility(pkg:ActionPackage){
        if(!this.isInvokersTurn()) return false
        const trampoline=ABILITY_NAME.MY_LAND_MOVE_AND_FREE_ON_ARRIVE_ENEMY_LAND
		const free_trampoline=ABILITY_NAME.FREE_MOVE_ON_ARRIVE_ENEMY_LAND

        let tiles:number[]=[]
        let ab=ABILITY_NAME.NONE
        if(this.offences.has(trampoline)){
            tiles=this.game.map.getTiles(this.invoker,TileFilter.MY_LAND().setExcludeMyPos())
            // this.trace.setAbilityName(trampoline).setName("반트램")
            ab=trampoline
			this.tollFree=true
        }
		else if(this.offences.has(free_trampoline)){
            
            tiles=this.game.map.getTiles(this.invoker,TileFilter.ALL_EXCLUDE_MY_POS())
            // this.trace.setAbilityName(free_trampoline).setName("울드트램")
			
            ab=free_trampoline
        }
        if(tiles.length>0){
            pkg.addAction(new MoveTileSelectionAction(this.invoker.turn,tiles,MOVETYPE.TELEPORT),ab)
			pkg.addExecuted(ab,this.invoker.turn)
            return true
        }
        return false
    }
	build(): ActionPackage {
		let pkg = super.build()

		const follow_healing = ABILITY_NAME.FOLLOW_ON_ENEMY_HEALING
		const bubble = ABILITY_NAME.ROOT_ON_ENEMY_ARRIVE_MY_LANDMARK

		//offence:도착한 플레이어능력
		//defence:땅주인 능력
		let healing_invoked = false
		let value = this.defences.get(bubble)
		if (value != null && this.tile.isLandMark() && !this.trace.hasTag(ActionTraceTag.BUBBLE_ROOT)) {
			pkg.addExecuted(bubble, this.defender.turn)
			pkg.addAction(new ApplyPlayerEffectAction(this.invoker.turn, "bubble_root"), bubble)
		}

        this.stealMultiplier(pkg)

        if(!this.teleportAbility(pkg))
            healing_invoked=this.healing(pkg)

		if (healing_invoked && this.defences.has(follow_healing)) {
			pkg.addExecuted(follow_healing, this.defender.turn)
			pkg.addAction(new RequestMoveAction(this.defender.turn, this.game.map.travel, MOVETYPE.FORCE_WALK,this.game.thisturn), follow_healing)
		}

		if(!this.tollFree)
			pkg.addMain(new ClaimTollAction(this.invoker.turn, this.tile))

		if (this.tile.canBuyOut()) pkg.addMain(new ClaimBuyoutAction(this.invoker.turn, this.tile))
		return pkg
	}
}