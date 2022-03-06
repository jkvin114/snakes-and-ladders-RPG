import * as Util from "./Util"
import { EFFECT, EFFECT_TIMING, SKILL, ITEM } from "./enum"
import { Player } from "./player"
import { PlayerClientInterface } from "./app"
import {
	StatusEffect,
	EFFECT_TYPE,
	GeneralEffectFactory,
	TickEffect,
	ShieldEffect,
	AblityChangeEffect,
	OnHitEffect,
	OnDamageEffect,
	ItemEffectFactory
} from "./StatusEffect"
import PlayerInventory from "./PlayerInventory"
// class SkillEffect {
// 	type: string
// 	owner_turn: number
// 	dur: number
// 	name: string
// 	skillattr: Util.Damage

// 	constructor(type: string, owner_turn: number, dur: number, name: string, skillattr: Util.Damage) {
// 		this.type = type
// 		this.owner_turn = owner_turn
// 		this.dur = dur
// 		this.name = name
// 		this.skillattr = skillattr
// 	}
// }

class PlayerStatusEffects {
	// skilleffects: SkillEffect[]
	player: Player
	//shieldEffects: Map<string, ShieldEffect>
	//	signs: object[]
	// igniteSource: number
	// effects: {
	// 	obs: number[]
	// 	skill: number[]
	// }

	category: Map<number, StatusEffect>[]
	storage: Map<number, StatusEffect>

	constructor(player: Player) {
		this.player = player
		//this.signs = []
		//	this.igniteSource = -1 //점화효과를 누구에게 받았는지

		//two lists of effects have different cooldown timing
		// this.effects = {
		// 	skill: Util.makeArrayOf(0, 20), //턴 끝날때 쿨다운
		// 	obs: Util.makeArrayOf(0, 20) //장애물 끝날때 쿨다운
		// }
		//0.slow 1.speed 2.stun 3.silent 4. shield  5.poison  6.radi  7.annuity 8.slave
		//
		//this.skilleffects = []

		//	this.shieldEffects = new Map<string, ShieldEffect>()
		this.initCategory()
		this.storage = new Map<number, StatusEffect>()
	}
	initCategory() {
		this.category = []
		this.category.push(new Map<number, StatusEffect>())
		this.category.push(new Map<number, ShieldEffect>())
		this.category.push(new Map<number, AblityChangeEffect>())
		this.category.push(new Map<number, OnHitEffect>())
		this.category.push(new Map<number, OnDamageEffect>())
		this.category.push(new Map<number, TickEffect>())
	}

	transfer(func: Function, ...args: any[]) {
		this.player.game.sendToClient(func, ...args)
	}
	onLethalDamage() {
		for (const [key,effect] of this.storage.entries()) {
			if(effect.onLethalDamage())
				this.removeByKey(key)
		}
	}

	onDeath() {
		for (const [key,effect] of this.storage.entries()) {
			if(effect.onDeath())
				this.removeByKey(key)
		}
		//this.signs = []
		//this.skilleffects = []
	}
	onBeforeObs() {
		this.cooldownEffectTurnStart()
		let died = false
		//독
		// if (this.has(EFFECT.POISON)) {
		// 	let damage=30
		// 	if(this.player.inven.haveItem(ITEM.BOOTS_OF_ENDURANCE)){
		// 		damage=Math.floor(damage*0.75)
		// 	}
		// 	died = this.player.doObstacleDamage(30, "simple")
		// }
		// //연금
		// if (this.has(EFFECT.ANNUITY)) {
		// 	this.player.inven.giveMoney(20)
		// }
		// //연금복권
		// if (this.has(EFFECT.ANNUITY_LOTTERY)) {
		// 	this.player.inven.giveMoney(50)
		// 	this.player.inven.changeToken(1)
		// }

		// //노예계약
		// if (this.has(EFFECT.SLAVE)) {
		// 	let damage=80
		// 	if(this.player.inven.haveItem(ITEM.BOOTS_OF_ENDURANCE)){
		// 		damage=Math.floor(damage*0.75)
		// 	}
		// 	died = this.player.doObstacleDamage(damage, "simple")
		// }

		if (died) {
			this.apply(EFFECT.SILENT, 1, EFFECT_TIMING.BEFORE_SKILL)
		}
	}

	onAfterObs() {
		// this.decrementShieldEffectDuration()
		this.cooldownEffectsBeforeSkill()
	}
	onTurnEnd() {
		//    this.signCoolDown()
		//	this.skillEffectCoolDown()
		this.cooldownEffectsAfterSkill()
	}

	giveIgniteEffect(dur: number, source: number) {
		return
		/*
		this.apply(EFFECT.IGNITE, dur,EFFECT_TIMING.BEFORE_SKILL)
		this.igniteSource = source*/
	}
	applyIgnite() {
		return /*
        let died=false
        if (this.has(EFFECT.IGNITE)) {
			let damage=Math.floor(0.04 * this.player.MaxHP)
			if(this.player.inven.haveItem(ITEM.BOOTS_OF_ENDURANCE)){
				damage=Math.floor(damage*0.75)
			}
            if (this.igniteSource === -1) {
                died = this.player.doObstacleDamage(damage, "fire")
            } else {
                died = this.player.doPlayerDamage(damage, this.igniteSource, "fire", false)
            }
        }
        return died*/
	}

	constDamage() {
		return false
		// if (this.haveSkillEffect("timo_u")) {
		// 	let skeffect = this.getSkillEffect("timo_u")

		// 	this.apply(EFFECT.SLOW, 1, EFFECT_TIMING.BEFORE_SKILL)

		// if(this.player.inven.haveItem(ITEM.BOOTS_OF_ENDURANCE)){
		// 	skeffect.skillattr.updateNormalDamage(Util.CALC_TYPE.multiply,0.75)
		// }

		// let died = this.player.hitBySkill({
		// 	damage:skeffect.skillattr,
		// 	skill:SKILL.ULT
		// }, skeffect.owner_turn)

		// return died
		// }
		// return false
	}
	// haveEffect(effect: number) {
	// 	return this.effects[effect] > 0
	// }
	/**
	 * reset general effect
	 * @param effect
	 */
	reset(effect: number) {
		this.removeByKey(effect)
		// this.effects.obs[effect] = 0
		// this.effects.skill[effect] = 0
		//	this.transfer(PlayerClientInterface.update, "removeEffect", this.player.turn, effect)
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

	applySpecial(effect: StatusEffect, name: string) {
		this.transfer(PlayerClientInterface.giveEffect, this.player.turn, effect.id, 0)

		effect.setName(name).applyTo(this.player)
		//console.log("effect type"+effect.effectType)

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
		this.transfer(PlayerClientInterface.giveEffect, this.player.turn, effect, num)

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
		this.transfer(PlayerClientInterface.update, "removeEffect", this.player.turn, key)
		let effect = this.storage.get(key)
		if (!effect) return
		console.log("removeeffect"+effect.name+" "+this.player.turn)
		let effectType = effect.effectType
		effect.onBeforeRemove()

		this.category[effectType].delete(key)
		this.storage.delete(key)
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

		// for (let i = 0; i < this.effects.obs.length; ++i) {
		// 	if (this.effects.obs[i] === 1 && this.effects.skill[i] === 0) {
		// 		this.transfer(PlayerClientInterface.update, "removeEffect", this.player.turn, i)
		// 	}
		// }
		// this.effects.obs = this.effects.obs.map(Util.decrement)
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
		//return this.effects.obs[effect] > 0 || this.effects.skill[effect] > 0
	}
	hasEffectFrom(effect: number, source: number) {
		let ef = this.storage.get(effect)

		if (ef && ef.sourceTurn === source) return true

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

	// giveSign(sign: any) {
	// 	//this.message(this.name + " got hit by" + sign.name)
	// 	this.signs.push(sign)
	// }
	// //========================================================================================================

	// haveSign(type: string, owner: number) {
	// 	let o = this.signs.some((sign: any) => sign.type === type && sign.owner_turn === owner)
	// 	return o
	// }
	// //========================================================================================================

	// removeSign(type: string, owner: number) {
	// 	this.signs = this.signs.filter((sign: any) => !(sign.type === type && sign.owner_turn === owner))
	// }

	/*giveSkillEffect(effect: SkillEffect) {
		//this.message(this.name + " got " + effect.name + " effect")
		this.skilleffects.push(effect)
	}
	//========================================================================================================

	haveSkillEffectAndSource(type: string, owner: number) {
		return this.skilleffects.some((ef: SkillEffect) => ef.type === type && ef.owner_turn === owner)
	}
	//========================================================================================================

	haveSkillEffect(type: string) {
		return this.skilleffects.some((ef) => ef.type === type)
	}
    getSkillEffect(type: string) {
		return this.skilleffects.filter((ef) => ef.type === type)[0]
	}
	//========================================================================================================

	removeSkillEffect(type: string, owner: number) {
		this.skilleffects = this.skilleffects.filter((ef) => !(ef.type === type && ef.owner_turn === owner))
	}*/
	//========================================================================================================

	// signCoolDown() {
	// 	this.signs = this.signs.map(function (s: any) {
	// 		s.dur = Util.decrement(s.dur)
	// 		return s
	// 	})
	// 	this.signs = this.signs.filter((s: any) => s.dur > 0)
	// 	console.log(this.signs)
	// }
	//========================================================================================================

	/*	skillEffectCoolDown() {
		this.skilleffects = this.skilleffects.map(function (s: SkillEffect) {
			s.dur = Util.decrement(s.dur)
			return s
		})
		this.skilleffects = this.skilleffects.filter((s: SkillEffect) => s.dur > 0)
		console.log(this.skilleffects)
	}*/
	canBasicAttack() {
		return !this.has(EFFECT.BLIND)
	}
	/**
	 *
	 * @param {*} shield 변화량 + or -
	 * @param {*} noindicate 글자 표시할지 여부
	 */
	setShield(name: EFFECT, effect: ShieldEffect, noindicate: boolean) {
		let change = effect.amount
		if (this.storage.has(name)) {
			change = effect.amount - this.storage.get(name).onBeforeReapply()
		}

		this.storage.set(name, effect)
		this.category[EFFECT_TYPE.SHIELD].set(name, effect)

		// if (this.shieldEffects.has(name)) {
		// 	change = this.shieldEffects.get(name).reApply(shield.amount)
		// } else {
		// 	this.shieldEffects.set(name, shield)
		// 	change = shield.amount
		// }

		this.player.updateTotalShield(change, noindicate)
	}

	applyShield(damage: number) {
		let damageLeft = damage

		//	console.log(this.category[EFFECT_TYPE.SHIELD].keys())
		for (const [name, s] of this.category[EFFECT_TYPE.SHIELD].entries()) {
			if (!(s instanceof ShieldEffect)) continue

			let shieldleft = (s as ShieldEffect).absorbDamage(damageLeft)
			//	console.log(shieldleft + "shieldapply" + name)
			if (shieldleft < 0) {
				damageLeft = -shieldleft
				this.removeByKey(name)
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
			if (!(effect instanceof OnDamageEffect))  continue
			(effect as OnDamageEffect).onObstacle(dmg)
		}
		return dmg.getTotalDmg()
	}
	onSkillDamage(damage: Util.Damage, sourceTurn: number) {
		//console.log("onskilldamage"+this.player.turn)
		for (const [name, effect] of this.category[EFFECT_TYPE.ONDAMAGE].entries()) {
			if (!(effect instanceof OnDamageEffect)) continue
			(effect as OnDamageEffect).onSkill(damage, sourceTurn)
		}
		return damage
	}
	onBasicAttackDamage(damage: Util.Damage, sourceTurn: number) {
		//console.log("onBasicAttackDamage"+this.player.turn)
		for (const [name, effect] of this.category[EFFECT_TYPE.ONDAMAGE].entries()) {
			if (!(effect instanceof OnDamageEffect))  continue
			(effect as OnDamageEffect).onBasicAttack(damage, sourceTurn)
		}
		return damage
	}

	onSkillHit(damage: Util.Damage, target: Player) {
		

		for (const [name, effect] of this.category[EFFECT_TYPE.ONHIT].entries()) {
			console.log("onSkillHit"+effect.name)
			if (!(effect instanceof OnHitEffect)) continue
			
			damage = (effect as OnHitEffect).onHitWithSkill(target, damage)
		}
		return damage
	}
	onBasicAttackHit(damage: Util.Damage, target: Player) {
		for (const [name, effect] of this.category[EFFECT_TYPE.ONHIT].entries()) {
			if (!(effect instanceof OnHitEffect))  continue
			damage = (effect as OnHitEffect).onHitWithBasicAttack(target, damage)
		}
		return damage
	}
	onAddItem(item: ITEM) {
		let effect = ItemEffectFactory.create(item)
		if (!effect) return

		this.applySpecial(effect, PlayerInventory.getItemName(item))
	}
	onRemoveItem(item: ITEM) {
		this.removeByKey(this.getKeyByName(PlayerInventory.getItemName(item)))
	}

	// decrementShieldEffectDuration() {
	// 	for (const [name, s] of this.shieldEffects) {
	// 		if (!s.cooldown()) {
	// 			this.player.updateTotalShield(-s.amount, true)
	// 			this.shieldEffects.delete(name)
	// 		}
	// 	}
	// }
}
export { PlayerStatusEffects, ShieldEffect }
