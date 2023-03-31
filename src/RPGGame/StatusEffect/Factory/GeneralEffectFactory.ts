import { NormalEffect, OnDamageEffect, StatusEffect, TickDamageEffect, TickEffect } from ".."
import { Damage, PercentDamage } from "../../core/Damage"
import { CALC_TYPE } from "../../core/Util"
import { EFFECT } from "../enum"
import type{ Player } from "../../player/player"
import { EFFECT_TIMING } from "../enum"

/**
 * construct general effect(effects that can be applied from anywhere)
 *
 */
export class GeneralEffectFactory {
	static create(id: EFFECT, dur: number): StatusEffect | null {
		switch (id) {
			case EFFECT.SLOW:
			case EFFECT.BACKDICE:
			case EFFECT.ROOT:
			case EFFECT.CURSE:
			case EFFECT.GROUNGING:
				return new NormalEffect(id, dur, EFFECT_TIMING.BEFORE_OBS)
			case EFFECT.SILENT:
			case EFFECT.BLIND:
			case EFFECT.PRIVATE_LOAN:
				return new NormalEffect(id, dur, EFFECT_TIMING.TURN_END)
			case EFFECT.SHIELD:
				return new NormalEffect(id, dur, EFFECT_TIMING.TURN_START).setGood()
			case EFFECT.SPEED:
			case EFFECT.DOUBLEDICE:
			case EFFECT.INVISIBILITY:
			case EFFECT.FARSIGHT:
				return new NormalEffect(id, dur, EFFECT_TIMING.BEFORE_OBS).setGood()
			case EFFECT.POISON: //poison
				return new TickDamageEffect(id, dur, TickEffect.FREQ_EVERY_TURN, new Damage(0, 0, 30))
			case EFFECT.RADI: //radiation
				return new OnDamageEffect(id, dur, (damage: Damage, owner: Player) => {
					damage.updateAllDamage(CALC_TYPE.multiply, 2)
					return damage
				})
			case EFFECT.ANNUITY: //annuity
				return new TickEffect(id, dur, TickEffect.FREQ_EVERY_TURN)
					.setAction(function (this: Player) {
						this.inven.giveMoney(20)
						return false
					})
					.setGood()
			case EFFECT.SLAVE: //slave
				return new TickDamageEffect(id, dur, TickEffect.FREQ_EVERY_TURN, new Damage(0, 0, 80))
			case EFFECT.IGNITE: //ignite
				return new TickDamageEffect(
					id,
					dur,
					TickEffect.FREQ_EVERY_PLAYER_TURN,
					new PercentDamage(4, PercentDamage.MAX_HP)
				)
			case EFFECT.ANNUITY_LOTTERY: //annuity lottery
				return new TickEffect(id, dur, TickEffect.FREQ_EVERY_TURN)
					.setAction(function (this: Player) {
						this.inven.giveMoney(50)
						this.inven.changeToken(1)
						return false
					})
					.setGood()
			default:
				return null
		}
	}
}