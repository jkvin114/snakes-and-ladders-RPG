import * as Util from "../core/Util"
import { EFFECT,  SKILL, ITEM } from "../data/enum"
import type { Player } from "./player"
import { SpecialEffect } from "../data/SpecialEffectRegistry"
import {
	StatusEffect,
	EFFECT_TYPE,
	GeneralEffectFactory,
	TickEffect,
	ShieldEffect,
	AblityChangeEffect,
	OnHitEffect,
	OnDamageEffect,
	ItemPassiveEffectFactory,
	OnFinalDamageEffect,EFFECT_TIMING
} from "../StatusEffect"
import PlayerInventory from "./PlayerInventory"
import { Entity } from "../entity/Entity"
import { PlayerComponent } from "./PlayerComponent"
import { Damage,PercentDamage } from "../core/Damage"

interface StatusEffectManager {
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
	protected owner: Entity
	protected storage: Map<number, StatusEffect>
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

class PlayerStatusEffects extends EntityStatusEffect implements StatusEffectManager,PlayerComponent {
	protected owner: Player
	private category:[ Map<number, StatusEffect>,Map<number, ShieldEffect>
		,Map<number, AblityChangeEffect>,Map<number, OnHitEffect>
		,Map<number, OnDamageEffect>,Map<number, TickEffect>
		,Map<number, OnFinalDamageEffect>]

	constructor(player: Player) {
		super(player)
		this.owner = player
		this.initCategory()
	}
	private initCategory() {
		this.category = [new Map<number, StatusEffect>(),new Map<number, ShieldEffect>()
			,new Map<number, AblityChangeEffect>(),new Map<number, OnHitEffect>()
			,new Map<number, OnDamageEffect>(),new Map<number, TickEffect>()
			,new Map<number, OnFinalDamageEffect>()]
		// this.category.push()
		// this.category.push()
		// this.category.push()
		// this.category.push()
		// this.category.push()
		// this.category.push()
		// this.category.push())
	}

	// transfer(func: Function, ...args: any[]) {
	// 	this.player.mediator.sendToClient(func, ...args)
	// }
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
	onOneMoreDice(){
		this.cooldownAllHarmful()
	}
	onTurnStart(){
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

	private getSpecialEffectDesc(name: string): SpecialEffect.DescriptionData|undefined {
		return SpecialEffect.Setting.get(name)
	}
	private getEffectSourcePlayerName(source: string): string {
		return this.owner.game.getNameById(source)
	}

	applySpecial(effect: StatusEffect|undefined, name?: string) {
		if(!effect)return
		if (name != null) effect.setName(name)

		let data: SpecialEffect.DescriptionData|undefined = this.getSpecialEffectDesc(effect.name)

		if (data) {
		//	console.log(this.getEffectSourcePlayerName(effect.source))
			this.owner.game.eventEmitter.giveSpecialEffect(
				this.owner.turn,
				effect.name,
				data,
				this.getEffectSourcePlayerName(effect.source)
			)
		}

		effect.applyTo(this.owner)

	//	console.log("applySpecial  " + effect.name + " " + this.player.turn)

		if (effect instanceof ShieldEffect) {
			this.setShield(effect.id, effect, false)
		} else {
			this.storage.get(effect.id)?.onBeforeReapply()

			this.storage.set(effect.id, effect)
			this.saveEffectInCategory(effect.effectType,effect.id,effect)
			// this.category[effect.effectType].set(effect.id, effect)
		}
	}
	saveEffectInCategory(type:EFFECT_TYPE,id:EFFECT,effect:StatusEffect){
		switch(type){
			case EFFECT_TYPE.NORMAL:
				this.category[type].set(id,effect)
				break
			case EFFECT_TYPE.SHIELD:
				this.category[type].set(id,effect as ShieldEffect)
				break
			case EFFECT_TYPE.ABILITY_CHANGE:
				this.category[type].set(id,effect as AblityChangeEffect)
				break
			case EFFECT_TYPE.ONHIT:
				this.category[type].set(id,effect as OnHitEffect)
				break
			case EFFECT_TYPE.ONDAMAGE:
				this.category[type].set(id,effect as OnDamageEffect)
				break
			case EFFECT_TYPE.TICK:
				this.category[type].set(id,effect as TickEffect)
				break
			case EFFECT_TYPE.ON_FINAL_DAMAGE:
				this.category[type].set(id,effect as OnFinalDamageEffect)
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
		if (dur === 0) return
		if (effect === EFFECT.SLOW && this.owner.inven.haveItem(ITEM.BOOTS_OF_HASTE)) {
			return
			//장화로 둔화 무시
		}

		let num = this.owner.game.onEffectApply()

		//	console.log("giveeffect" + effect)
		this.owner.game.eventEmitter.giveEffect({
			turn: this.owner.turn,
			effect: effect, 
			num:num
		})

		let statusEffect = GeneralEffectFactory.create(effect, dur)
		if(!statusEffect) return
		
		statusEffect.applyTo(this.owner)
		this.storage.get(effect)?.onBeforeReapply()
		

		this.storage.set(effect, statusEffect)
		this.saveEffectInCategory(statusEffect.effectType,effect,statusEffect)

		// this.category[statusEffect.effectType].set(effect, statusEffect)

		
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
			this.owner.game.eventEmitter.update("removeSpecialEffect", this.owner.turn, effect.name)
		}
	}
	private getKeyByName(name: string) {
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
	private setShield(key: EFFECT, effect: ShieldEffect, noindicate: boolean) {
		let change = effect.amount
		let ef=this.storage.get(key)
		if (ef!=null) {
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
			if (!(effect instanceof OnDamageEffect)) continue
			;(effect as OnDamageEffect).onObstacleDamage(dmg)
		}
		return dmg.getTotalDmg()
	}
	onSkillDamage(damage: Damage, source: string) {
		//console.log("onskilldamage"+this.player.turn)
		for (const [name, effect] of this.category[EFFECT_TYPE.ONDAMAGE].entries()) {
			if (!(effect instanceof OnDamageEffect)) continue
			;(effect as OnDamageEffect).onSkillDamage(damage, source)
		}
		return damage
	}
	onBasicAttackDamage(damage: Damage, source: string) {
		//console.log("onBasicAttackDamage"+this.player.turn)
		for (const [name, effect] of this.category[EFFECT_TYPE.ONDAMAGE].entries()) {
			if (!(effect instanceof OnDamageEffect)) continue
			;(effect as OnDamageEffect).onBasicAttackDamage(damage, source)
		}
		return damage
	}

	onSkillHit(damage: Damage, target: Player) {
		for (const [name, effect] of this.category[EFFECT_TYPE.ONHIT].entries()) {
			// console.log("onSkillHit" + effect.name)
			if (!(effect instanceof OnHitEffect)) continue

			damage = (effect as OnHitEffect).onHitWithSkill(target, damage)
		}
		return damage
	}
	onBasicAttackHit(damage: Damage, target: Player) {
		for (const [name, effect] of this.category[EFFECT_TYPE.ONHIT].entries()) {
			//if (!(effect instanceof OnHitEffect)) continue
			damage = effect.onHitWithBasicAttack(target, damage)
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
		let effect = ItemPassiveEffectFactory.create(item)
		if (!effect) return

		this.applySpecial(effect, PlayerInventory.getItemName(item))
	}
	onRemoveItem(item: ITEM) {
		this.removeByKey(this.getKeyByName(PlayerInventory.getItemName(item)))
	}
}
export { PlayerStatusEffects,EntityStatusEffect }
