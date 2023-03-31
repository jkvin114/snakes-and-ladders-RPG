import type { EFFECT } from "./enum"
import { StatusEffect } from "./StatusEffect"
import { SHIELD_EFFECT_TIMING, EFFECT_TYPE } from "./enum"

export class ShieldEffect extends StatusEffect {
	// name:string
	public amount: number
	constructor(id: EFFECT, duration: number, amount: number) {
		super(id, duration, SHIELD_EFFECT_TIMING)
		this.amount = amount
		this.isgood = true
		this.effectType = EFFECT_TYPE.SHIELD
	}
	/**
	 *
	 * @returns remaining amount of shield
	 */
	onBeforeReapply(): number {
		return this.amount
	}

	absorbDamage(amount: number): number {
		if (this.amount <= 0) return -amount

		let reduceamt = this.amount - amount
		this.amount -= amount
		return reduceamt
		//+ if damage <  shield, - if damage > shield
	}
	onBeforeRemove() {
		if (this.amount <= 0) return
		//console.log("shield brefore remove"+this.amount)
		this.owner?.updateTotalShield(-this.amount, true)
	}
}