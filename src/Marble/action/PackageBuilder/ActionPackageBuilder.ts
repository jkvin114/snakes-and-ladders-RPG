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
	protected defender: MarblePlayer
	protected defences: Map<ABILITY_NAME, AbilityValues>
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
	protected setDefences(p: MarblePlayer, defenderEvent: EVENT_TYPE) {
		this.defender = p
		this.defences = p.sampleAbility(defenderEvent, this.trace)
		return this
	}
	protected isInvokersTurn() {
		return this.game.thisturn === this.invoker.turn
	}
	setDefender(p: MarblePlayer) {
		return this
	}
	build(): ActionPackage {
		return new ActionPackage(this.trace)
	}
}