import * as Util from "./Util"
import { EFFECT, EFFECT_TIMING, SKILL, ITEM } from "./enum"
import { PlayerClientInterface } from "./app"
import type { Player } from "./player"
import { SpecialEffect } from "./SpecialEffect"
import {
	StatusEffect,
	EFFECT_TYPE,
	GeneralEffectFactory,
	TickEffect,
	ShieldEffect,
	AblityChangeEffect,
	OnHitEffect,
	OnDamageEffect,
	ItemEffectFactory,
	OnFinalDamageEffect
} from "./StatusEffect"
import PlayerInventory from "./PlayerInventory"
import { Entity } from "./Entity"

interface StatusEffectManager {
	owner: Entity
	storage: Map<number, StatusEffect>
	onLethalDamage(): void
	onDeath(): void
	onBeforeObs(): void
	onAfterObs(): void
	onTurnEnd(): void
	reset(effect: number): void
	tick(currentTurn: number): void
	applySpecial(effect: StatusEffect, name?: string): void
	apply(effect: number, dur: number, timing: EFFECT_TIMING): void
	has(effect: number): boolean
	hasEffectFrom(effect: number, source: string): boolean
	resetAll(): void
	resetAllHarmful(): void
}

class EntityStatusEffect implements StatusEffectManager {
	owner: Entity
	storage: Map<number, StatusEffect>
	constructor(owner: Entity) {
		this.owner = owner
		this.storage = new Map<number, StatusEffect>()
	}
	resetAll(): void {}
	resetAllHarmful(): void {}
	tick(currentTurn: number): void {}
	applySpecial(effect: StatusEffect, name?: string): void {}
	apply(effect: number, dur: number, timing: EFFECT_TIMING): void {}
	has(effect: number): boolean {
		return false
	}
	hasEffectFrom(effect: number, source: string): boolean {
		return false
	}
	onLethalDamage() {}
	onDeath() {}
	onBeforeObs() {}
	onAfterObs() {}
	onTurnEnd() {}
	reset(effect: number) {}
}

class PlayerStatusEffects extends EntityStatusEffect implements StatusEffectManager {
	player: Player
	category: Map<number, StatusEffect>[]

	constructor(player: Player) {
		super(player)
		this.player = player
		this.initCategory()
	}
	initCategory() {
		this.category = []
		this.category.push(new Map<number, StatusEffect>())
		this.category.push(new Map<number, ShieldEffect>())
		this.category.push(new Map<number, AblityChangeEffect>())
		this.category.push(new Map<number, OnHitEffect>())
		this.category.push(new Map<number, OnDamageEffect>())
		this.category.push(new Map<number, TickEffect>())
		this.category.push(new Map<number, OnFinalDamageEffect>())
	}

	transfer(func: Function, ...args: any[]) {
		this.player.mediator.sendToClient(func, ...args)
	}
	onLethalDamage() {
		for (const [key, effect] of this.storage.entries()) {
			if (effect.onLethalDamage()) this.removeByKey(key)
		}
	}

	onDeath() {
		for (const [key, effect] of this.storage.entries()) {
			if (effect.onDeath()) this.removeByKey(key)
		}
	}
	onBeforeObs() {
		this.cooldownEffectTurnStart()
	}

	onAfterObs() {
		this.cooldownEffectsBeforeSkill()
	}
	onTurnEnd() {
		this.cooldownEffectsAfterSkill()
	}

	/**
	 * reset effect
	 * @param effect
	 */
	reset(effect: number) {
		this.removeByKey(effect)
	}

	modifySkillRange(range: number) {
		if (this.has(EFFECT.FARSIGHT)) {
			range *= 3
		}

		if (this.has(EFFECT.BLIND)) {
			range = Math.floor(range / 2)
		}
		return range
	}

	getSpecialEffectDesc(name: string): SpecialEffect.DescriptionData {
		return SpecialEffect.Setting.get(name)
	}
	getEffectSourcePlayerName(source: string): string {
		return this.player.game.getNameById(source)
	}

	applySpecial(effect: StatusEffect, name?: string) {
		if (name != null) effect.setName(name)

		let data: SpecialEffect.DescriptionData = this.getSpecialEffectDesc(effect.name)

		if (data != null) {
		//	console.log(this.getEffectSourcePlayerName(effect.source))

			this.transfer(
				PlayerClientInterface.giveSpecialEffect,
				this.player.turn,
				effect.name,
				data,
				this.getEffectSourcePlayerName(effect.source)
			)
		}

		effect.applyTo(this.player)

	//	console.log("applySpecial  " + effect.name + " " + this.player.turn)

		if (effect instanceof ShieldEffect) {
			this.setShield(effect.id, effect, false)
		} else {
			if (this.storage.has(effect.id)) {
				this.storage.get(effect.id).onBeforeReapply()
			}

			this.storage.set(effect.id, effect)
			this.category[effect.effectType].set(effect.id, effect)
		}
	}

	/**
	 *
	 * @param {*} e 이펙트 ID
	 * @param {*} dur 지속시간
	 * @param {*} num 번호
	 */
	apply(effect: number, dur: number, timing: EFFECT_TIMING) {
		if (dur === 0) return
		if (effect === EFFECT.SLOW && this.player.inven.haveItem(ITEM.BOOTS_OF_HASTE)) {
			return
			//장화로 둔화 무시
		}

		let num = this.player.game.onEffectApply()

		//	console.log("giveeffect" + effect)
		this.transfer(PlayerClientInterface.giveEffect,{
			turn: this.player.turn,
			effect: effect, 
			num:num
		})

		let statusEffect = GeneralEffectFactory.create(effect, dur, timing).applyTo(this.player)
		if (this.storage.has(effect)) {
			this.storage.get(effect).onBeforeReapply()
		}

		this.storage.set(effect, statusEffect)
		this.category[statusEffect.effectType].set(effect, statusEffect)
		//이펙트 부여하자마자 바로 쿨다운 하기 때문에 지속시간 +1 해줌
		// if (type === "obs") {
		// 	this.effects.obs[effect] = Math.max(dur, this.effects.obs[effect])
		// } else if (type === "skill") {
		// 	this.effects.skill[effect] = Math.max(dur, this.effects.skill[effect])
		// }
	}
	// apply(effect: number, dur: number,timing:EFFECT_TIMING){
	// 	this.applyNormal(effect,dur,timing)
	//     // if(timing==EFFECT_TIMING.BEFORE_SKILL){
	//     //     this.applyNormal(effect, dur + 1, "obs")
	//     // }
	//     // else if(timing==EFFECT_TIMING.TURN_END){
	//     //     this.applyNormal(effect, dur + 1, "skill")
	//     // }
	//     // else if(timing==EFFECT_TIMING.TURN_START){
	//     //     this.applyNormal(effect, dur, "obs")

	//     // }
	// }
	removeByKey(key: number) {
		if (key < 0) return

		let effect = this.storage.get(key)
		if (!effect) return
	//	console.log("removeeffect" + effect.name + " " + key + " " + this.player.turn)
		let effectType = effect.effectType
		effect.onBeforeRemove()

		this.category[effectType].delete(key)
		this.storage.delete(key)
		if (key < 30) {
			this.transfer(PlayerClientInterface.update, "removeEffect", this.player.turn, key)
		} else {
			this.transfer(PlayerClientInterface.update, "removeSpecialEffect", this.player.turn, effect.name)
		}
	}
	getKeyByName(name: string) {
		for (const [key, effect] of this.storage.entries()) {
			if (effect.name === name) {
				return key
			}
		}
		return -1
	}

	cooldown(timing: EFFECT_TIMING) {
		for (const [key, effect] of this.storage.entries()) {
			if (effect.timing === timing && !effect.cooldown()) this.removeByKey(key)
		}
	}

	cooldownEffectsBeforeSkill() {
		this.cooldown(EFFECT_TIMING.BEFORE_SKILL)
	}

	cooldownEffectsAfterSkill() {
		this.cooldown(EFFECT_TIMING.TURN_END)
	}
	cooldownEffectTurnStart() {
		this.cooldown(EFFECT_TIMING.TURN_START)
	}

	cooldownAllHarmful() {
		for (const [key, effect] of this.storage.entries()) {
			if (!effect.isgood && !effect.cooldown()) this.removeByKey(key)
		}
	}

	has(effect: number) {
		return this.storage.has(effect)
	}
	hasEffectFrom(effect: number, source: string) {
		let ef = this.storage.get(effect)

		if (ef && ef.source === source) return true

		return false
	}

	resetAll() {
		for (const key of this.storage.keys()) {
			this.removeByKey(key)
		}
	}
	resetAllHarmful() {
		for (const [key, effect] of this.storage.entries()) {
			if (!effect.isgood) this.removeByKey(key)
		}
	}

	tick(currentTurn: number) {
		for (const effect of this.category[EFFECT_TYPE.TICK].values()) {
			if (!(effect instanceof TickEffect)) continue
			//console.log("tick" + effect.owner.turn + "  " + this.player.turn)

			if ((effect as TickEffect).tick(currentTurn)) {
				break
			}
		}
	}
	canBasicAttack() {
		return !this.has(EFFECT.BLIND)
	}
	/**
	 *
	 * @param {*} shield 변화량 + or -
	 * @param {*} noindicate 글자 표시할지 여부
	 */
	setShield(key: EFFECT, effect: ShieldEffect, noindicate: boolean) {
		let change = effect.amount
		if (this.storage.has(key)) {
			change = effect.amount - this.storage.get(key).onBeforeReapply()
		}

		this.storage.set(key, effect)
		this.category[EFFECT_TYPE.SHIELD].set(key, effect)
		this.player.updateTotalShield(change, noindicate)
	}

	applyShield(damage: number) {
		let damageLeft = damage

		for (const [key, s] of this.category[EFFECT_TYPE.SHIELD].entries()) {
			if (!(s instanceof ShieldEffect)) continue

	//		console.log("shield amount" + s.amount)
			let shieldleft = (s as ShieldEffect).absorbDamage(damageLeft)
			//	console.log(shieldleft + "shieldapply" + name)
			if (shieldleft < 0) {
				damageLeft = -shieldleft
				this.removeByKey(key)
			} else {
				damageLeft = 0
				break
			}
		}
		return damageLeft
	}

	onObstacleDamage(damage: number) {
		let dmg = new Util.Damage(0, 0, damage)
		for (const [name, effect] of this.category[EFFECT_TYPE.ONDAMAGE].entries()) {
			if (!(effect instanceof OnDamageEffect)) continue
			;(effect as OnDamageEffect).onObstacleDamage(dmg)
		}
		return dmg.getTotalDmg()
	}
	onSkillDamage(damage: Util.Damage, source: string) {
		//console.log("onskilldamage"+this.player.turn)
		for (const [name, effect] of this.category[EFFECT_TYPE.ONDAMAGE].entries()) {
			if (!(effect instanceof OnDamageEffect)) continue
			;(effect as OnDamageEffect).onSkillDamage(damage, source)
		}
		return damage
	}
	onBasicAttackDamage(damage: Util.Damage, source: string) {
		//console.log("onBasicAttackDamage"+this.player.turn)
		for (const [name, effect] of this.category[EFFECT_TYPE.ONDAMAGE].entries()) {
			if (!(effect instanceof OnDamageEffect)) continue
			;(effect as OnDamageEffect).onBasicAttackDamage(damage, source)
		}
		return damage
	}

	onSkillHit(damage: Util.Damage, target: Player) {
		for (const [name, effect] of this.category[EFFECT_TYPE.ONHIT].entries()) {
			console.log("onSkillHit" + effect.name)
			if (!(effect instanceof OnHitEffect)) continue

			damage = (effect as OnHitEffect).onHitWithSkill(target, damage)
		}
		return damage
	}
	onBasicAttackHit(damage: Util.Damage, target: Player) {
		for (const [name, effect] of this.category[EFFECT_TYPE.ONHIT].entries()) {
			if (!(effect instanceof OnHitEffect)) continue
			damage = (effect as OnHitEffect).onHitWithBasicAttack(target, damage)
		}
		return damage
	}

	onFinalDamage(damage: number) {
		for (const [name, effect] of this.category[EFFECT_TYPE.ON_FINAL_DAMAGE].entries()) {
			if (!(effect instanceof OnFinalDamageEffect)) continue
			;(effect as OnFinalDamageEffect).onFinalDamage(damage)
		}
	}
	onAddItem(item: ITEM) {
		let effect = ItemEffectFactory.create(item)
		if (!effect) return

		this.applySpecial(effect, PlayerInventory.getItemName(item))
	}
	onRemoveItem(item: ITEM) {
		this.removeByKey(this.getKeyByName(PlayerInventory.getItemName(item)))
	}
}
export { PlayerStatusEffects,EntityStatusEffect }
