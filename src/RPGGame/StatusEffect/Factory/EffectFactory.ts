import { AblityChangeEffect, OnHitEffect } from ".."
import type { Damage } from "../../core/Damage"
import { CALC_TYPE } from "../../core/Util"
import { EFFECT } from "../enum"
import type { Player } from "../../player/player"
import { EFFECT_TIMING } from "../enum"

export class EffectFactory {
	static create(effect_id: EFFECT) {
		switch (effect_id) {
			case EFFECT.MAGIC_CASTLE_ADAMAGE:
				return new OnHitEffect(effect_id, 1, function (this: Player, t: Player, damage: Damage) {
					damage.updateTrueDamage(CALC_TYPE.plus, this.ability.getMagicCastleDamage())
					return damage
				})
					.setGood()
					.on(OnHitEffect.SKILLATTACK)
			case EFFECT.ITEM_ABILITY_POWER_OF_MOTHER_NATURE:
				return new AblityChangeEffect(effect_id, 1, new Map().set("moveSpeed", 1), EFFECT_TIMING.TURN_END).setGood()
			case EFFECT.ITEM_ABILITY_TRINITY_FORCE:
				return new AblityChangeEffect(effect_id, 1, new Map().set("moveSpeed", 1), EFFECT_TIMING.TURN_START).setGood()
			case EFFECT.ITEM_ABILITY_SHIELDSWORD_ABSORB:
				return new AblityChangeEffect(effect_id, 2, new Map().set("absorb", 30), EFFECT_TIMING.TURN_END).setGood()
		}
	}
}