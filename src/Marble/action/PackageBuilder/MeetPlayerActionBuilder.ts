
import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { AbilityValues } from "../../Ability/AbilityValues"
import { EVENT_TYPE } from "../../Ability/EventType"
import { CARD_NAME, FortuneCardRegistry } from "../../FortuneCard"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { TileFilter } from "../../tile/TileFilter"
import { ACTION_TYPE, MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import { ActionTrace, ActionTraceTag } from "../ActionTrace"
import {  ChangeLandOwnerAction, PayPercentMoneyAction, RequestMoveAction } from "../InstantAction"
import { ObtainCardAction } from "../QueryAction"
import {  DefendableActionBuilder } from "./ActionPackageBuilder"

export class MeetPlayerActionBuilder extends DefendableActionBuilder {
	private pos: number
	private movetype: MOVETYPE
	private stayed: MarblePlayer[]
	overrideArrival: boolean
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, pos: number, movetype: MOVETYPE) {
		super(game, trace, invoker, EVENT_TYPE.ARRIVE_TO_ENEMY)
		this.pos = pos
		this.movetype = movetype
		this.stayed = []
		this.overrideArrival = false
	}
	setDefender(p: MarblePlayer): this {
		return this
	}
	addStayed(p: MarblePlayer) {
		this.stayed.push(p)
	}
	private perfume(pkg: ActionPackage, stayed: MarblePlayer) {
		const perfume = ABILITY_NAME.TAKE_MONEY_ON_ARRIVE_TO_PLAYER
		let value = this.offences.get(perfume)
		if (!value || [MOVETYPE.PULL, MOVETYPE.TELEPORT, MOVETYPE.BLACKHOLE].includes(this.movetype)) return false
		if(this.trace.thisMoveHasAbility(ABILITY_NAME.STOP_ENEMY_ON_MY_LANDMARK)) return false

		pkg.addExecuted(perfume, this.invoker.turn)
		pkg.addAction(new PayPercentMoneyAction(stayed.turn, this.invoker.turn, value.getValue()), perfume)
		return true
	}
	private badge(pkg: ActionPackage, defences: Map<ABILITY_NAME, AbilityValues>, stayed: MarblePlayer) {
		const badge = ABILITY_NAME.TAKE_MONEY_ON_PLAYER_ARRIVE_TO_ME
		let value = defences.get(badge)
		if (!value || this.movetype === MOVETYPE.TELEPORT || this.movetype === MOVETYPE.BLACKHOLE) return false
		pkg.addExecuted(badge, stayed.turn)
		pkg.addAction(new PayPercentMoneyAction(this.invoker.turn, stayed.turn, value.getValue()), badge)
		return true
	}
	private guidebook(pkg: ActionPackage, defences: Map<ABILITY_NAME, AbilityValues>, stayed: MarblePlayer) {
		const guidebook = ABILITY_NAME.THROW_TO_LANDMARK_ON_ENEMY_ARRIVE_TO_ME
		const donate_guidebook=ABILITY_NAME.THROW_TO_LANDMARK_AND_DONATE_ON_ENEMY_ARRIVE_TO_ME

		let pos = this.game.map.getMostExpensiveIn(stayed, TileFilter.MY_LANDMARK())
		if (pos === -1) return false
		if(defences.get(donate_guidebook) && !this.trace.hasActionAndAbility(ACTION_TYPE.REQUEST_MOVE,donate_guidebook)){
			pkg.addAction(
				new RequestMoveAction(this.invoker.turn, pos, MOVETYPE.TELEPORT).reserveAbilityIndicatorOnPop(
					donate_guidebook,
					stayed.turn
				),
				donate_guidebook
			)
			let donatePos=this.game.map.getMostExpensiveIn(this.invoker, TileFilter.MY_LAND().setNoLandMark())
			if(donatePos!==-1){
				pkg.addAction(new ChangeLandOwnerAction(stayed.turn,donatePos,stayed.turn),donate_guidebook)
			}
			this.trace.addTag(ActionTraceTag.GUIDEBOOK).setName("지옥가북")
			return true
		}
		else if(defences.get(guidebook) && !this.trace.hasActionAndAbility(ACTION_TYPE.REQUEST_MOVE,guidebook)){
			pkg.addAction(
				new RequestMoveAction(this.invoker.turn, pos, MOVETYPE.TELEPORT).reserveAbilityIndicatorOnPop(
					guidebook,
					stayed.turn
				),
				guidebook
			)
			this.trace.addTag(ActionTraceTag.GUIDEBOOK)
			return true
		}
		
		return false
		
	}
    private newPerfume(pkg:ActionPackage,stayed: MarblePlayer){
        const ninjascroll=ABILITY_NAME.MOVE_TO_PLAYER_AND_STEAL_ON_ARRIVE_MY_LAND
        if(this.trace.thisMoveHasAbility(ninjascroll))
        {
            let value = this.invoker.getAbilityValueAmount(ninjascroll)
            pkg.addExecuted(ninjascroll, this.invoker.turn)
		    pkg.addBefore(new PayPercentMoneyAction(stayed.turn, this.invoker.turn, value))
            pkg.addBefore(new ObtainCardAction(this.invoker.turn, FortuneCardRegistry.drawAmong([CARD_NAME.BLACKOUT,CARD_NAME.LAND_CHANGE,CARD_NAME.LAND_CHANGE])))
            return true
        }
        return false
    }
	build(): ActionPackage {
		let pkg = super.build()
		if (this.stayed.length === 0) return pkg

		for (const stayed of this.stayed) {
			if (this.overrideArrival) break
			
			const defences = stayed.sampleAbility(EVENT_TYPE.ENEMY_ARRIVE_TO_ME, this.trace)
            if(!this.newPerfume(pkg,stayed))
			    this.perfume(pkg, stayed)

			this.badge(pkg, defences, stayed)

			this.overrideArrival = this.guidebook(pkg, defences, stayed)
		}

		return pkg
	}
}