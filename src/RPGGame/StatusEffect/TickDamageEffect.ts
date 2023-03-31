import { Damage, PercentDamage } from "../core/Damage"
import { EFFECT } from "./enum"
import { TickEffect } from "./TickEffect"

export class TickDamageEffect extends TickEffect {
	protected tickDamage: Damage | PercentDamage
	constructor(id: EFFECT, dur: number, frequency: number, damage: Damage | PercentDamage) {
		super(id, dur, frequency)
		this.tickDamage = damage
	}
	tick(currentTurn: number): boolean {
		if (currentTurn !== this.owner.turn && this.frequency === TickEffect.FREQ_EVERY_TURN) {
			return false
		}
		if (this.tickAction != null) {
			if (super.tick(currentTurn)) return true
		}

		if (this.tickDamage instanceof Damage) {
			return this.doDamage(this.tickDamage)
		} else if (this.tickDamage instanceof PercentDamage) {
			return this.doDamage(this.tickDamage.pack(this.owner.MaxHP, this.owner.HP))
		}

		return false
	}
}