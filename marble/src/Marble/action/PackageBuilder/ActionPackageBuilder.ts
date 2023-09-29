import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import type { AbilityAttributes, AbilityValue } from "../../Ability/AbilityValues"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"

export abstract class ActionPackageBuilder {
	protected game: MarbleGame
	protected trace: ActionTrace
	protected invoker: MarblePlayer
	offences: Map<ABILITY_NAME, AbilityValue>
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
	protected defender: MarblePlayer|undefined
	defences: Map<ABILITY_NAME, AbilityValue>
	abstract setDefender(p: MarblePlayer):this
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, invokerEvent: EVENT_TYPE){
		super(game, trace, invoker, invokerEvent)
		this.defences=new  Map<ABILITY_NAME, AbilityValue>()
	}
	protected setDefences(p: MarblePlayer, defenderEvent: EVENT_TYPE){
		this.defender = p
		this.defences = p.sampleAbility(defenderEvent, this.trace)
		return this
	}
}