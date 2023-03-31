import { OnDamageEffect, OnHPBelowThresholdEffect, OnHitEffect, ShieldEffect, StatusEffect, TickEffect } from ".."
import type{ Damage } from "../../core/Damage"
import { CALC_TYPE } from "../../core/Util"
import { HPChange } from "../../core/health"
import { SpecialEffect } from "../../data/SpecialEffectRegistry"
import { ITEM } from "../../data/enum"
import { EFFECT } from "../enum"
import { PlayerAbility } from "../../player/PlayerAbility"
import type{ Player } from "../../player/player"
import { EffectFactory } from "./EffectFactory"


/**
 * construct effects from items
 *invoked when buying item
 */
 export  class ItemPassiveEffectFactory {
	static create(item: ITEM) :(StatusEffect|null)[]{
		let effects:(StatusEffect|null)[]=[null,null]
		switch (item) {
			case ITEM.EPIC_FRUIT:
				effects[0]= new TickEffect(EFFECT.ITEM_FRUIT, StatusEffect.DURATION_PERMANENT, TickEffect.FREQ_EVERY_TURN)
					.setAction(function (this: Player) {
						let amt=this.ability.extraHP * 0.15
						this.changeHP_heal(new HPChange(amt))
						this.inven.addActiveItemData(item,"regen",Math.min(this.MaxHP-this.HP,amt))
						return false
					})
					.setGood()
					break
			case ITEM.POWER_OF_MOTHER_NATURE:
				effects[0]=  new OnDamageEffect(EFFECT.ITEM_POWER_OF_MOTHER_NATURE1, StatusEffect.DURATION_PERMANENT, function (
					damage: Damage,
					owner: Player
				) {
					let change= PlayerAbility.applySkillDmgReduction(damage, 30)
					owner.inven.addActiveItemData(item,"damage",-change)
					return damage
				})
					.on([OnDamageEffect.SKILL_DAMAGE])
					.setGood()
					
				effects[1]=new OnDamageEffect(EFFECT.ITEM_POWER_OF_MOTHER_NATURE2, StatusEffect.DURATION_PERMANENT, function (
					damage: Damage,
					owner: Player
				) {
					owner.effects.applySpecial(
						EffectFactory.create(EFFECT.ITEM_ABILITY_POWER_OF_MOTHER_NATURE),
						SpecialEffect.ITEM.POWER_OF_MOTHER_NATURE_ABILITY.name
					)
					return damage
				})
					.on([OnDamageEffect.SKILL_DAMAGE])
					.setGood()
					.setConditionActiveItem(item)
					break
			case ITEM.POWER_OF_NATURE:
				effects[0]=  new OnDamageEffect(
					EFFECT.ITEM_POWER_OF_NATURE,
					StatusEffect.DURATION_PERMANENT,
					(damage: Damage, owner: Player) => {
						PlayerAbility.applySkillDmgReduction(damage, 10)
						return damage
					}
				)
					.on([OnDamageEffect.SKILL_DAMAGE])
					.setGood()
					break
			case ITEM.CARD_OF_DECEPTION:
				effects[0]=  new OnHitEffect(EFFECT.ITEM_CARD_OF_DECEPTION, StatusEffect.DURATION_PERMANENT, function (
					this: Player,
					target: Player,
					damage: Damage
				) {

					let change=damage.updateNormalDamage(CALC_TYPE.multiply, 1.1)
					this.inven.addActiveItemData(item,"damage",change)
					target.effects.apply(EFFECT.SLOW, 1)
					this.effects.apply(EFFECT.SPEED, 1)
					return damage
				})
					.on(OnHitEffect.SKILLATTACK)
					.setTargetCondition((owner: Player, target: Player) => {
						return owner.pos < target.pos
					})
					.setConditionActiveItem(ITEM.CARD_OF_DECEPTION)
					.setGood()
					break
			case ITEM.ANCIENT_SPEAR:
				effects[0]=  new OnHitEffect(EFFECT.ITEM_ANCIENT_SPEAR1, StatusEffect.DURATION_PERMANENT, function (
					this: Player,
					target: Player,
					damage: Damage
				) {
					let change= damage.updateMagicDamage(CALC_TYPE.plus, target.MaxHP * 0.1)
					this.inven.addActiveItemData(item,"damage",change)
					return damage
				})
					.on(OnHitEffect.SKILLATTACK)
					.setGood()
				effects[1]=  new OnHitEffect(EFFECT.ITEM_ANCIENT_SPEAR2, StatusEffect.DURATION_PERMANENT, function (
						this: Player,
						target: Player,
						damage: Damage
					) {
						let change= damage.updateMagicDamage(CALC_TYPE.plus, target.MaxHP * 0.05)
						this.inven.addActiveItemData(item,"damage",change)
						return damage
					})
						.on(OnHitEffect.BASICATTACK)
						.setGood()
					break
			case ITEM.SPEAR:
				effects[0]=  new OnHitEffect(EFFECT.ITEM_SPEAR1, StatusEffect.DURATION_PERMANENT, function (
					this: Player,
					target: Player,
					damage: Damage
				) {
					//	console.log("ITEM_SPEAR_ADAMAGE")
					damage.updateMagicDamage(CALC_TYPE.plus, target.MaxHP * 0.05)
					return damage
				})
					.on(OnHitEffect.SKILLATTACK)
					.setGood()
				effects[1]=  new OnHitEffect(EFFECT.ITEM_SPEAR2, StatusEffect.DURATION_PERMANENT, function (
						this: Player,
						target: Player,
						damage: Damage
					) {
						//	console.log("ITEM_SPEAR_ADAMAGE")
						damage.updateMagicDamage(CALC_TYPE.plus, target.MaxHP * 0.02)
						return damage
					})
						.on(OnHitEffect.BASICATTACK)
						.setGood()
					break
			case ITEM.CROSSBOW_OF_PIERCING:
				effects[0]=  new OnHitEffect(EFFECT.ITEM_CROSSBOW1, StatusEffect.DURATION_PERMANENT, function (
					this: Player,
					target: Player,
					damage: Damage
				) {
					let change= damage.updateTrueDamage(CALC_TYPE.plus, target.MaxHP * 0.07)
					this.inven.addActiveItemData(item,"damage",change)
					return damage
				})
					.on(OnHitEffect.SKILLATTACK)
					.setGood()
				effects[1]=  new OnHitEffect(EFFECT.ITEM_CROSSBOW2, StatusEffect.DURATION_PERMANENT, function (
						this: Player,
						target: Player,
						damage: Damage
					) {
						let change= damage.updateTrueDamage(CALC_TYPE.plus, target.MaxHP * 0.04)
						this.inven.addActiveItemData(item,"damage",change)
						return damage
					})
						.on(OnHitEffect.BASICATTACK)
						.setGood()
					break
			case ITEM.FULL_DIAMOND_ARMOR:
				effects[0]=  new OnHitEffect(EFFECT.ITEM_DIAMOND_ARMOR, StatusEffect.DURATION_PERMANENT, function (
					this: Player,
					target: Player,
					damage: Damage
				) {
					this.ability.addMaxHP(10)
					this.inven.addActiveItemData(item,"hp",10)

					return damage
				})
					.on(OnHitEffect.EVERYATTACK)
					.setGood()
				break
			case ITEM.BOOTS_OF_PROTECTION:
				effects[0]=  new OnDamageEffect(
					EFFECT.ITEM_BOOTS_OF_ENDURANCE,
					StatusEffect.DURATION_PERMANENT,
					(damage: Damage, owner: Player) => {
						damage.updateNormalDamage(CALC_TYPE.multiply, 0.65)
						return damage
					}
				)
					.on([OnDamageEffect.BASICATTACK_DAMAGE])
					.setGood()
					break
			case ITEM.WARRIORS_SHIELDSWORD:
				effects[0]=  new OnHPBelowThresholdEffect(
					EFFECT.ITEM_SHIELDSWORD,
					StatusEffect.DURATION_PERMANENT,
					(damage: number, owner: Player) => {
						const shieldamt=100+Math.floor(0.7 * owner.ability.AD.get())
						owner.effects.applySpecial(
							new ShieldEffect(EFFECT.ITEM_ABILITY_SHIELDSWORD_SHIELD, 2, shieldamt).setGood(),
							SpecialEffect.ITEM.WARRIOR_SHIELDSWORD_SHIELD.name
						)
						owner.inven.addActiveItemData(item,"shield",shieldamt)

						owner.effects.applySpecial(
							EffectFactory.create(EFFECT.ITEM_ABILITY_SHIELDSWORD_ABSORB),
							SpecialEffect.ITEM.WARRIOR_SHIELDSWORD_ABSORB.name
						)

					}
				)
					.setInvokeConditionHpPercent(30)
					.setGood()
					.setConditionActiveItem(ITEM.WARRIORS_SHIELDSWORD)
					break
			case ITEM.INVISIBILITY_CLOAK:
				effects[0]=  new OnHPBelowThresholdEffect(
					EFFECT.ITEM_INVISIBILITY_CLOAK,
					StatusEffect.DURATION_PERMANENT,
					(damage: number, owner: Player) => {
						owner.effects.apply(EFFECT.INVISIBILITY, 2)
					}
				)
					.setInvokeConditionHpPercent(30)
					.setGood()
					.setConditionActiveItem(ITEM.INVISIBILITY_CLOAK)
					break
			case ITEM.DAGGER:
				effects[0]=  new OnHitEffect(EFFECT.ITEM_DAGGER, StatusEffect.DURATION_PERMANENT, function (
					this: Player,
					target: Player,
					damage: Damage,
					data: number[]
				) {
					damage.updateMagicDamage(CALC_TYPE.plus, data[1])
					return damage
				})
					.on(OnHitEffect.EVERYATTACK)
					.setGood()
					.setConditionActiveItem(item)
					.setData([0, 0])
					break
			case ITEM.STAFF_OF_JUDGEMENT:
				effects[0]=  new OnHitEffect(EFFECT.ITEM_STAFF_OF_JUDGEMENT, StatusEffect.DURATION_PERMANENT, function (
					this: Player,
					target: Player,
					damage: Damage,
					data: number[]
				) {
					let change= damage.updateMagicDamage(CALC_TYPE.plus, data[1])
					this.inven.addActiveItemData(item,"damage",change)
					return damage
				})
					.on(OnHitEffect.SKILLATTACK)
					.setGood()
					.setConditionActiveItem(item)
					.setData([0, 0])
					break
			case ITEM.FLAIL_OF_JUDGEMENT:
				effects[0]=  new OnHitEffect(EFFECT.ITEM_FLAIL_OF_JUDGEMENT, StatusEffect.DURATION_PERMANENT, function (
					this: Player,
					target: Player,
					damage: Damage,
					data: number[]
				) {
					let change=damage.updateMagicDamage(CALC_TYPE.plus, data[1])
					this.inven.addActiveItemData(item,"damage",change)
					return damage
				})
					.on(OnHitEffect.BASICATTACK)
					.setGood()
					.setConditionActiveItem(item)
					.setData([0, 0,0])
					break
		}
		return effects
	}
}
