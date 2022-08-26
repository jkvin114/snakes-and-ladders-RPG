import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import type { AbilityValues } from "../../Ability/AbilityValues"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"

export abstract class ActionPackageBuilder {
	protected game: MarbleGame
	protected trace: ActionTrace
	protected invoker: MarblePlayer
	protected offences: Map<ABILITY_NAME, AbilityValues>
	protected invokerEvent:EVENT_TYPE
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, invokerEvent: EVENT_TYPE) {
		this.game = game
		this.trace = trace
		this.invoker = invoker
		this.offences = invoker.sampleAbility(invokerEvent, this.trace)
		this.invokerEvent=invokerEvent
	}
	protected isTurnOf(turn: number) {
		return this.game.thisturn === turn
	}
	protected isInvokersTurn() {
		return this.game.thisturn === this.invoker.turn
	}
	build(): ActionPackage {
		return new ActionPackage(this.trace)
	}
}

export abstract class DefendableActionBuilder extends ActionPackageBuilder{
	protected defender: MarblePlayer
	protected defences: Map<ABILITY_NAME, AbilityValues>
	abstract setDefender(p: MarblePlayer):this
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, invokerEvent: EVENT_TYPE){
		super(game, trace, invoker, invokerEvent)
	}
	protected setDefences(p: MarblePlayer, defenderEvent: EVENT_TYPE){
		this.defender = p
		this.defences = p.sampleAbility(defenderEvent, this.trace)
		return this
	}
}