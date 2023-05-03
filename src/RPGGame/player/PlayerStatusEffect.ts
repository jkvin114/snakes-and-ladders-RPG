import * as Util from "../core/Util"
import {  SKILL, ITEM } from "../data/enum"
import { EFFECT, EFFECT_TIMING, EFFECT_TYPE } from "../StatusEffect/enum"
import type { Player } from "./player"
import { SpecialEffect } from "../data/SpecialEffectRegistry"
import {
	StatusEffect,
	GeneralEffectFactory,
	TickEffect,
	ShieldEffect,
	AblityChangeEffect,
	OnHitEffect,
	OnDamageEffect,
	ItemPassiveEffectFactory,
	OnHPBelowThresholdEffect,
	
} from "../StatusEffect"


import PlayerInventory from "./PlayerInventory"
import { Entity } from "../entity/Entity"
import { PlayerComponent } from "./PlayerComponent"
import { Damage, PercentDamage } from "../core/Damage"

interface StatusEffectManager  {
	onLethalDamage(): void
	onBeforeObs(): void
	onAfterObs(): void
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
	protected owner: Entity
	protected storage: Map<number, StatusEffect>
	constructor(owner: Entity) {
		this.owner = owner
		this.storage = new Map<number, StatusEffect>()
	}
	onTurnStart(): void {}
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

class PlayerStatusEffects extends EntityStatusEffect implements StatusEffectManager,PlayerComponent {
	protected owner: Player
	private category: [
		Map<number, StatusEffect>,
		Map<number, ShieldEffect>,
		Map<number, AblityChangeEffect>,
		Map<number, OnHitEffect>,
		Map<number, OnDamageEffect>,
		Map<number, TickEffect>,
		Map<number, OnHPBelowThresholdEffect>
	]
	static readonly labelEfffects=[EFFECT.ITEM_SHIELDSWORD,
		EFFECT.ITEM_FRUIT,
		EFFECT.ITEM_POWER_OF_NATURE,
		EFFECT.ITEM_POWER_OF_MOTHER_NATURE1,
		EFFECT.ITEM_CARD_OF_DECEPTION,
		EFFECT.ITEM_ANCIENT_SPEAR1,
		EFFECT.ITEM_SPEAR1,
		EFFECT.ITEM_CROSSBOW1,
		EFFECT.ITEM_DIAMOND_ARMOR,
		EFFECT.ITEM_BOOTS_OF_ENDURANCE,
		EFFECT.ITEM_INVISIBILITY_CLOAK,
		EFFECT.ITEM_DAGGER,
		EFFECT.ITEM_STAFF_OF_JUDGEMENT,
		EFFECT.ITEM_FLAIL_OF_JUDGEMENT]
	constructor(player: Player) {
		super(player)
		this.owner = player
		this.initCategory()
	}
	private initCategory() {
		this.category = [
			new Map<number, StatusEffect>(),
			new Map<number, ShieldEffect>(),
			new Map<number, AblityChangeEffect>(),
			new Map<number, OnHitEffect>(),
			new Map<number, OnDamageEffect>(),
			new Map<number, TickEffect>(),
			new Map<number, OnHPBelowThresholdEffect>(),
		]
	}

	// transfer(func: Function, ...args: any[]) {
	// 	this.player.mediator.sendToClient(func, ...args)
	// }
	onLethalDamage() {
		for (const [key, effect] of this.storage.entries()) {
			if (effect.shouldResetOnLethalDamage()) this.removeByKey(key)
		}
	}

	onDeath() {
		for (const [key, effect] of this.storage.entries()) {
			if (effect.shouldResetOnDeath()) this.removeByKey(key)
		}
	}
	onOneMoreDice() {
		this.cooldownAllHarmful()
	}
	onTurnStart() {
		this.cooldownEffectTurnStart()
	}
	onBeforeObs() {
		this.cooldownEffectBeforeObs()
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

	private getSpecialEffectDesc(namespace: string, data: number[]): SpecialEffect.DescriptionData | undefined {
		if (!SpecialEffect.Namespace.has(namespace)) return undefined
		let description = SpecialEffect.Namespace.get(namespace)
		//clone object
		let desc = {
			type: description.type,
			item_id: description.item_id,
			src: description.src,
			desc: description.desc,
			desc_kor: description.desc_kor,
			isgood: description.isgood,
		}
		for (let i = 0; i < data.length; i++) {
			desc.desc = desc.desc.replace(`<d${i + 1}>`, `<b>${data[i]}</b>`)
			desc.desc_kor = desc.desc_kor.replace(`<d${i + 1}>`, `<b>${data[i]}</b>`)
		}
		//console.log(desc.desc)
		return desc
	}
	private getEffectSourcePlayerName(source: string): string {
		return this.owner.game.getNameById(source)
	}
	private transferSpecialEffect(effect: StatusEffect) {
		let data: SpecialEffect.DescriptionData | undefined = this.getSpecialEffectDesc(effect.namespace, effect.data)

		if (data) {
			this.owner.game.eventEmitter.giveSpecialEffect(
				this.owner.turn,
				effect.namespace,
				data,
				this.getEffectSourcePlayerName(effect.source)
			)
		}
	}
	applySpecial(effect: StatusEffect | undefined, namespace?: string) {

		if (!effect) return
		if (namespace != null) effect.setNamespace(namespace)

		this.transferSpecialEffect(effect)
		
		effect.applyTo(this.owner)

		//	console.log("applySpecial  " + effect.name + " " + this.player.turn)

		if (effect instanceof ShieldEffect) {
			this.setShield(effect.id, effect, false)
		} else {
			this.storage.get(effect.id)?.onBeforeReapply()

			this.storage.set(effect.id, effect)
			this.saveEffectInCategory(effect.effectType, effect.id, effect)
			// this.category[effect.effectType].set(effect.id, effect)
		}
	}
	updateSpecialEffectData(key: EFFECT, data: number[]) {
		if (!this.storage.has(key)) return
		this.transferSpecialEffect(this.storage.get(key).setData(data))
	}
	saveEffectInCategory(type: EFFECT_TYPE, key: EFFECT, effect: StatusEffect) {
		switch (type) {
			case EFFECT_TYPE.NORMAL:
				this.category[type].set(key, effect)
				break
			case EFFECT_TYPE.SHIELD:
				this.category[type].set(key, effect as ShieldEffect)
				break
			case EFFECT_TYPE.ABILITY_CHANGE:
				this.category[type].set(key, effect as AblityChangeEffect)
				break
			case EFFECT_TYPE.ONHIT:
				this.category[type].set(key, effect as OnHitEffect)
				break
			case EFFECT_TYPE.ONDAMAGE:
				this.category[type].set(key, effect as OnDamageEffect)
				break
			case EFFECT_TYPE.TICK:
				this.category[type].set(key, effect as TickEffect)
				break
			case EFFECT_TYPE.ON_HP_BELOW_THRESHOLD:
				this.category[type].set(key, effect as OnHPBelowThresholdEffect)
				break
		}
	}

	/**
	 *
	 * @param {*} e 이펙트 ID
	 * @param {*} dur 지속시간
	 * @param {*} num 번호
	 */
	apply(effect: number, dur: number) {
		if (dur === 0 || this.owner.dead) return
		if (effect === EFFECT.SLOW && this.owner.inven.haveItem(ITEM.BOOTS_OF_HASTE)) {
			return
			//장화로 둔화 무시
		}

		let num = this.owner.game.onEffectApply()

		//	console.log("giveeffect" + effect)
		this.owner.game.eventEmitter.giveEffect({
			turn: this.owner.turn,
			effect: effect,
			num: num,
		})

		let statusEffect = GeneralEffectFactory.create(effect, dur)
		if (!statusEffect) return

		statusEffect.applyTo(this.owner)
		this.storage.get(effect)?.onBeforeReapply()

		this.storage.set(effect, statusEffect)
		this.saveEffectInCategory(statusEffect.effectType, effect, statusEffect)

	}
	private removeByKey(key: number) {
		if (key < 0) return

		let effect = this.storage.get(key)
		if (!effect) return
		//	console.log("removeeffect" + effect.name + " " + key + " " + this.player.turn)
		let effectType = effect.effectType
		effect.onBeforeRemove()
		//console.log("----------------------------------removeeffect"+effect.name)
		this.category[effectType].delete(key)
		this.storage.delete(key)
		if (key < 30) {
			this.owner.game.eventEmitter.update("removeEffect", this.owner.turn, key)
		} else {
			this.owner.game.eventEmitter.update("removeSpecialEffect", this.owner.turn, effect.namespace)
		}
	}
	private getKeysByNamespace(namespace: string):number[] {
		let keys=[]
		for (const [key, effect] of this.storage.entries()) {
			if (effect.namespace === namespace) {
				keys.push(key) 
			}
		}
		return keys
	}

	cooldown(timing: EFFECT_TIMING) {
		for (const [key, effect] of this.storage.entries()) {
			if (effect.timing === timing && !effect.cooldown()) this.removeByKey(key)
		}
	}

	private cooldownEffectsBeforeSkill() {
		this.cooldown(EFFECT_TIMING.BEFORE_SKILL)
	}

	private cooldownEffectsAfterSkill() {
		this.cooldown(EFFECT_TIMING.TURN_END)
	}
	private cooldownEffectTurnStart() {
		this.cooldown(EFFECT_TIMING.TURN_START)
	}

	private cooldownEffectBeforeObs() {
		this.cooldown(EFFECT_TIMING.BEFORE_OBS)
	}
	private cooldownAllHarmful() {
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
			if (effect.tick(currentTurn)) {
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
	private setShield(key: EFFECT, effect: ShieldEffect, noindicate: boolean) {
		let change = effect.amount
		let ef = this.storage.get(key)
		if (ef != null) {
			change = effect.amount - ef.onBeforeReapply()
		}

		this.storage.set(key, effect)
		this.category[EFFECT_TYPE.SHIELD].set(key, effect)
		this.owner.updateTotalShield(change, noindicate)
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
		let dmg = new Damage(0, 0, damage)
		for (const [name, effect] of this.category[EFFECT_TYPE.ONDAMAGE].entries()) {
			effect.onObstacleDamage(dmg)
		}
		return dmg.getTotalDmg()
	}
	onSkillDamage(damage: Damage, source: string) {
		for (const [name, effect] of this.category[EFFECT_TYPE.ONDAMAGE].entries()) {
			effect.onSkillDamage(damage, source)
		}
		return damage
	}
	onBasicAttackDamage(damage: Damage, source: string) {
		for (const [name, effect] of this.category[EFFECT_TYPE.ONDAMAGE].entries()) {
			effect.onBasicAttackDamage(damage, source)
		}
		return damage
	}

	onSkillHit(damage: Damage, target: Player) {

		for (const [name, effect] of this.category[EFFECT_TYPE.ONHIT].entries()) {
			let d = effect.onHitWithSkill(target, damage)
			if (d != null) damage = d
		}
		return damage
	}
	onBasicAttackHit(damage: Damage, target: Player) {
		for (const [name, effect] of this.category[EFFECT_TYPE.ONHIT].entries()) {
			let d = effect.onHitWithBasicAttack(target, damage)
			if (d != null) damage = d
		}
		return damage
	}

	onFinalDamage(damage: number) {
		for (const [name, effect] of this.category[EFFECT_TYPE.ON_HP_BELOW_THRESHOLD].entries()) {
			effect.onFinalDamage(damage)
		}
	}
	onAddItem(item: ITEM) {
		let effect = ItemPassiveEffectFactory.create(item)
		for(const e of effect){
			if(!!e)
				this.applySpecial(e, PlayerInventory.getItemName(item))
		}		
	}
	onRemoveItem(item: ITEM) {
		for(const key of this.getKeysByNamespace(PlayerInventory.getItemName(item)))
			this.removeByKey(key)
	}
	getStatusLabel(){
		let str=""
		for(const e of PlayerStatusEffects.labelEfffects){
			str+=(this.has(e)?1:0)+","

		}
		return str
	}
}
export { PlayerStatusEffects, EntityStatusEffect }
