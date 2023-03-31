import type  { Player } from "../player/player"
import { StatusEffect } from "."
import { EFFECT_TIMING, ABILITY_CHANGE_EFFECT_TIMING, EFFECT_TYPE,EFFECT } from "./enum"

export class AblityChangeEffect extends StatusEffect {
	protected abilityChanges: Map<string, number>
	protected remainingChanges: Map<string, number>
	protected decay: boolean
	constructor(id: EFFECT, dur: number, abilityChanges: Map<string, number>, timing?: EFFECT_TIMING) {
		if (!timing) timing = ABILITY_CHANGE_EFFECT_TIMING
		super(id, dur, timing)
		this.decay = false
		this.abilityChanges = abilityChanges
		this.remainingChanges = new Map()
		this.effectType = EFFECT_TYPE.ABILITY_CHANGE
	}
	setDecay() {
		this.decay = true
		return this
	}
	applyTo(owner: Player) {
		super.applyTo(owner)

		for (const [name, val] of this.abilityChanges.entries()) {
			this.owner?.ability.update(name, val)

			this.remainingChanges.set(name, val)
		}
		this.owner?.ability.flushChange()

		return this
	}
	cooldown(): boolean {
		if (this.decay) {
			for (const [name, val] of this.remainingChanges.entries()) {
				if (this.abilityChanges.has(name)) {
					let decayamt = Math.floor((-1 * this.abilityChanges.get(name)) / this.duration)

					this.owner?.ability.update(name, decayamt)

					this.remainingChanges.set(name, val + decayamt)
				}
			}
			this.owner?.ability.flushChange()
		}

		return super.cooldown()
	}
	onBeforeReapply(): number {
		for (const [name, val] of this.remainingChanges.entries()) {
			this.owner?.ability.update(name, -1 * val)

			this.remainingChanges.set(name, 0)
		}

		return 0
	}
	onBeforeRemove(): void {
		//	console.log(this.owner.ability.MR)
		for (const [name, val] of this.remainingChanges.entries()) {
			this.owner?.ability.update(name, -1 * val)
			//	console.log("removeabilitychange"+name+" "+val)
			this.remainingChanges.set(name, 0)
		}

		this.owner?.ability.flushChange()
	}
}