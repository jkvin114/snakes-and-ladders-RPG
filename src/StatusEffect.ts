import { Player } from "./player"
import { CALC_TYPE, Damage, decrement, HPChangeData, PercentDamage, SkillAttack } from "./Util"
import { EFFECT, ITEM, SKILL } from "./enum"
import {PlayerAbility} from "./PlayerAbility"
import { SpecialEffect } from "./SpecialEffect"
import { Entity } from "./Entity"

enum EFFECT_SOURCE {
	ENEMY,
	ALLY,
	OBSTACLE,
	ITEM
}
enum EFFECT_TYPE {
	NORMAL = 0,
	SHIELD = 1,
	ABILITY_CHANGE = 2,
	ONHIT = 3,
	ONDAMAGE = 4,
	TICK = 5,
	ON_FINAL_DAMAGE=6
}
enum EFFECT_TIMING {
	TURN_START,
	TURN_END,
	BEFORE_SKILL
}

class EffectFactory {
	

	static create(effect_id: EFFECT) {
		switch (effect_id) {
			case EFFECT.MAGIC_CASTLE_ADAMAGE:
				return new OnHitEffect(effect_id, 1, function(this: Player, t: Player, damage: Damage){
					return damage.updateTrueDamage(CALC_TYPE.plus, this.ability.getMagicCastleDamage())
				})
					.setGood()
					.on(OnHitEffect.SKILLATTACK)
			case EFFECT.ITEM_POWER_OF_MOTHER_NATURE_ABILITY:
					return new AblityChangeEffect(
						effect_id,
						1,
						new Map().set("moveSpeed", 1)
					).setGood()
			case EFFECT.ITEM_SHIELDSWORD_ABSORB:
				return new AblityChangeEffect(effect_id, 2, new Map().set("absorb", 30)).setGood()
		}
	}
}

/**
 * construct effects from items
 *invoked when buying item
 */
class ItemEffectFactory {
	static create(item: ITEM) {
		switch (item) {
			case ITEM.EPIC_FRUIT:
				return new TickEffect(EFFECT.ITEM_FRUIT, StatusEffect.FOREVER, TickEffect.FREQ_EVERY_TURN)
					.setAction(function (this: Player) {
						this.changeHP_heal(new HPChangeData().setHpChange(this.ability.extraHP * 0.15))

						return false
					})
					.setGood()
			case ITEM.POWER_OF_MOTHER_NATURE:
				return new OnDamageEffect(EFFECT.ITEM_POWER_OF_MOTHER_NATURE, StatusEffect.FOREVER, function (
					Damage: Damage,
					owner: Player
				) {
					if (owner.inven.isActiveItemAvailable(ITEM.POWER_OF_MOTHER_NATURE)) {
						owner.inven.useActiveItem(ITEM.POWER_OF_MOTHER_NATURE)
						owner.effects.applySpecial(
							EffectFactory.create(EFFECT.ITEM_POWER_OF_MOTHER_NATURE_ABILITY),
							SpecialEffect.ITEM.POWER_OF_MOTHER_NATURE_ABILITY.name
						)
					}

					return PlayerAbility.applySkillDmgReduction(Damage, 30)
				})
					.on([OnDamageEffect.SKILL_DAMAGE])
					.setGood()

			case ITEM.POWER_OF_NATURE:
				return new OnDamageEffect(
					EFFECT.ITEM_POWER_OF_NATURE,
					StatusEffect.FOREVER,
					(Damage: Damage, owner: Player) => {
						return PlayerAbility.applySkillDmgReduction(Damage, 10)
					}
				)
					.on([OnDamageEffect.SKILL_DAMAGE])
					.setGood()

			case ITEM.CARD_OF_DECEPTION:
				return new OnHitEffect(
					EFFECT.ITEM_CARD_OF_DECEPTION,
					StatusEffect.FOREVER,
					function(this: Player, target: Player, damage: Damage){
						if (this.inven.isActiveItemAvailable(ITEM.CARD_OF_DECEPTION)) {
							//	console.log("CARD_OF_DECEPTION")
							damage.updateNormalDamage(CALC_TYPE.multiply, 1.1)
							target.effects.apply(EFFECT.SLOW, 1, EFFECT_TIMING.BEFORE_SKILL)
							this.effects.apply(EFFECT.SPEED, 1, EFFECT_TIMING.BEFORE_SKILL)
							this.inven.useActiveItem(ITEM.CARD_OF_DECEPTION)
						}
						return damage
					}
				)
					.on(OnHitEffect.SKILLATTACK)
					.setTargetCondition((owner: Player, target: Player) => {
						return owner.pos < target.pos
					})
					.setGood()
			case ITEM.ANCIENT_SPEAR:
				return new OnHitEffect(
					EFFECT.ITEM_ANCIENT_SPEAR_ADAMAGE,
					StatusEffect.FOREVER,
					function(this: Player, target: Player, damage: Damage){
						return damage.updateMagicDamage(CALC_TYPE.plus, target.MaxHP * 0.1)
					}
				)
					.on(OnHitEffect.EVERYATTACK)
					.setGood()
			case ITEM.SPEAR:
				return new OnHitEffect(
					EFFECT.ITEM_SPEAR_ADAMAGE,
					StatusEffect.FOREVER,
					function(this: Player, target: Player, damage: Damage){
						//	console.log("ITEM_SPEAR_ADAMAGE")
						return damage.updateMagicDamage(CALC_TYPE.plus, target.MaxHP * 0.05)
					}
				)
					.on(OnHitEffect.EVERYATTACK)
					.setGood()
			case ITEM.CROSSBOW_OF_PIERCING:
				return new OnHitEffect(
					EFFECT.ITEM_CROSSBOW_ADAMAGE,
					StatusEffect.FOREVER,
					function(this: Player, target: Player, damage: Damage){
						return damage.updateTrueDamage(CALC_TYPE.plus, target.MaxHP * 0.07)
					}
				)
					.on(OnHitEffect.EVERYATTACK)
					.setGood()
			case ITEM.FULL_DIAMOND_ARMOR:
				return new OnHitEffect(
					EFFECT.ITEM_DIAMOND_ARMOR_MAXHP_GROWTH,
					StatusEffect.FOREVER,
					function(this: Player, target: Player, damage: Damage){
						this.ability.addMaxHP(5)
						//	console.log("FULL_DIAMOND_ARMOR")
						return damage
					}
				)
					.on(OnHitEffect.EVERYATTACK)
					.setGood()
			case ITEM.BOOTS_OF_PROTECTION:
				return new OnDamageEffect(
					EFFECT.ITEM_BOOTS_OF_ENDURANCE,
					StatusEffect.FOREVER,
					(damage: Damage, owner: Player) => {
						//	console.log("BOOTS_OF_PROTECTION")
						return damage.updateNormalDamage(CALC_TYPE.multiply, 0.8)
					}
				)
					.on([OnDamageEffect.BASICATTACK_DAMAGE])
					.setGood()
			case ITEM.WARRIORS_SHIELDSWORD:
				return new OnFinalDamageEffect(
					EFFECT.ITEM_SHIELDSWORD,
					StatusEffect.FOREVER,
					(damage: number, owner: Player) => {
						if (owner.inven.isActiveItemAvailable(ITEM.WARRIORS_SHIELDSWORD)) {
							console.log("WARRIORS_SHIELDSWORD")

							owner.effects.applySpecial(
								new ShieldEffect(EFFECT.ITEM_SHIELDSWORD_SHIELD, 2, Math.floor(0.7 * owner.ability.AD.get())).setGood(),
								SpecialEffect.ITEM.WARRIOR_SHIELDSWORD_SHIELD.name
							)

							owner.effects.applySpecial(
								EffectFactory.create(EFFECT.ITEM_SHIELDSWORD_ABSORB),
								SpecialEffect.ITEM.WARRIOR_SHIELDSWORD_ABSORB.name
							)

							owner.inven.useActiveItem(ITEM.WARRIORS_SHIELDSWORD)
						}
					}
				)
					.setInvokeConditionHpPercent(30)
					.setGood()
			case ITEM.INVISIBILITY_CLOAK:
				return new OnFinalDamageEffect(
					EFFECT.ITEM_INVISIBILITY_CLOAK,
					StatusEffect.FOREVER,
					(damage: number, owner: Player) => {
						if (owner.inven.isActiveItemAvailable(ITEM.INVISIBILITY_CLOAK)) {
							console.log("invisibility cloak")
							owner.effects.apply(EFFECT.INVISIBILITY, 1, EFFECT_TIMING.TURN_END)

							owner.inven.useActiveItem(ITEM.INVISIBILITY_CLOAK)
						}
					}
				)
					.setInvokeConditionHpPercent(30)
					.setGood()

			default:
				return null
		}
	}
}

/**
 * construct general effect(effects that can be applied from anywhere)
 *
 */
class GeneralEffectFactory {
	static create(id: EFFECT, dur: number, timing: EFFECT_TIMING):StatusEffect {
		switch (id) {
			case EFFECT.SLOW:
			case EFFECT.STUN:
			case EFFECT.SILENT:
			case EFFECT.BACKDICE:
			case EFFECT.BLIND:
			case EFFECT.PRIVATE_LOAN:
			case EFFECT.CURSE:
				return new NormalEffect(id, dur, timing)
			case EFFECT.SPEED:
			case EFFECT.SHIELD:
			case EFFECT.DOUBLEDICE:
			case EFFECT.INVISIBILITY:
			case EFFECT.FARSIGHT:
				return new NormalEffect(id, dur, timing).setGood()
			case EFFECT.POISON: //poison
				return new TickDamageEffect(id, dur, TickEffect.FREQ_EVERY_TURN, new Damage(0, 0, 30))
			case EFFECT.RADI: //radiation
				return new OnDamageEffect(id, dur, (damage: Damage, owner: Player) => {
					return damage.updateAllDamage(CALC_TYPE.multiply, 2)
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
			default:return null
		}
	}
}

abstract class StatusEffect {
	protected duration: number
	public isgood: boolean
	public owner: Player
	public readonly timing: EFFECT_TIMING
	public readonly id: EFFECT
	public name: string
	public source: string
	public effectType: EFFECT_TYPE
	static readonly DURATION_UNTIL_LETHAL_DAMAGE = 1000
	static readonly DURATION_UNTIL_DEATH = 2000
	static readonly FOREVER = 10000

	constructor(id: EFFECT, dur: number, timing: EFFECT_TIMING) {
		this.id = id
		this.duration = dur
		this.isgood = false
		this.owner = null
		this.timing = timing
		this.name = ""
		this.source =null

		if (timing === EFFECT_TIMING.BEFORE_SKILL || timing === EFFECT_TIMING.TURN_END) {
			this.duration += 1
		}
	}
	applyTo(owner: Player) {
		this.owner = owner
		return this
	}
	setName(name: string) {
		this.name = name
		return this
	}
	setGood() {
		this.isgood = true
		return this
	}
	setSourceId(source: string) {
		this.source = source
		return this
	}
	onBeforeReapply() {
		return 0
	}
	onBeforeRemove() {}

	/**
	 *
	 * @returns false if duration is over
	 */
	cooldown() {
		if (this.duration >= StatusEffect.DURATION_UNTIL_LETHAL_DAMAGE) return true

		this.duration = decrement(this.duration)
		return this.duration > 0
	}
	onLethalDamage() {
		if (this.duration >= StatusEffect.DURATION_UNTIL_DEATH) {
			return false
		}
		return true
	}
	onDeath() {
		if (this.duration >= StatusEffect.FOREVER) {
			return false
		}

		return true
	}
}

class NormalEffect extends StatusEffect {
	constructor(id: EFFECT, dur: number, timing: EFFECT_TIMING) {
		super(id, dur, timing)
		this.effectType = EFFECT_TYPE.NORMAL
	}
}

class ShieldEffect extends StatusEffect {
	// name:string
	public amount: number
	constructor(id: EFFECT, duration: number, amount: number) {
		super(id, duration, EFFECT_TIMING.BEFORE_SKILL)
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
		this.owner.updateTotalShield(-this.amount, true)
	}
}
class AblityChangeEffect extends StatusEffect {
	protected abilityChanges: Map<string, number>
	protected remainingChanges: Map<string, number>
	protected decay: boolean
	constructor(id: EFFECT, dur: number, abilityChanges: Map<string, number>) {
		super(id, dur, EFFECT_TIMING.TURN_START)
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
			this.owner.ability.update(name, val)

			this.remainingChanges.set(name, val)
		}
		this.owner.ability.flushChange()

		return this
	}
	cooldown(): boolean {
		if (this.decay) {
			for (const [name, val] of this.remainingChanges.entries()) {
				let decayamt = Math.floor((-1 * this.abilityChanges.get(name)) / this.duration)

				this.owner.ability.update(name, decayamt)

				this.remainingChanges.set(name, val + decayamt)
			}
			this.owner.ability.flushChange()
		}

		return super.cooldown()
	}
	onBeforeReapply(): number {
		for (const [name, val] of this.remainingChanges.entries()) {
			this.owner.ability.update(name, -1 * val)

			this.remainingChanges.set(name, 0)
		}

		return 0
	}
	onBeforeRemove(): void {
		//	console.log(this.owner.ability.MR)
		for (const [name, val] of this.remainingChanges.entries()) {
			this.owner.ability.update(name, -1 * val)
			//	console.log("removeabilitychange"+name+" "+val)
			this.remainingChanges.set(name, 0)
		}

		this.owner.ability.flushChange()
	}
}

interface TickActionFunction {
	(this: Player): boolean
}

class TickEffect extends StatusEffect {
	static readonly FREQ_EVERY_TURN = 1
	static readonly FREQ_EVERY_PLAYER_TURN = 2

	protected tickAction: TickActionFunction
	protected frequency: number
	protected sourceSkill: SKILL //스킬 판정인지 여부, null 이면 스킬판정 아님

	constructor(id: EFFECT, dur: number, frequency: number) {
		super(id, dur, EFFECT_TIMING.TURN_START)
		this.frequency = frequency
		this.effectType = EFFECT_TYPE.TICK
		this.sourceSkill = null
		this.tickAction = null
	}

	setAction(tickAction: TickActionFunction) {
		this.tickAction = tickAction
		return this
	}
	//make tick damage to be treated as skill hit
	setSourceSkill(skill: SKILL) {
		this.sourceSkill = skill
		return this
	}
/**
 * 
 * @param currentTurn current turn of player at the point tick is called
 * @returns true if the owner died
 */
	tick(currentTurn: number): boolean {
		if (currentTurn !== this.owner.turn && this.frequency === TickEffect.FREQ_EVERY_TURN) {
			return false
		}
		if (this.tickAction && !this.owner.dead) return this.tickAction.call(this.owner)

		return false
	}

	protected doDamage(damage: Damage): boolean {
		if (this.owner.dead) return false

		if (this.owner.inven.haveItem(ITEM.BOOTS_OF_ENDURANCE)) {
			damage.updateAllDamage(CALC_TYPE.multiply, 0.75)
		}

		if (!this.source) {
			return this.owner.doObstacleDamage(damage.getTotalDmg(), this.name)
		} else if (this.sourceSkill != null) {
			return this.owner.mediator.skillAttackAuto(this.owner.mediator.getPlayer(this.source),this.owner.UEID)
			(new SkillAttack(damage,this.name))
			// return this.owner.hitBySkill(damage, this.name, this.sourceTurn)
		} else {
			return this.owner.mediator.attackSingle(this.owner.mediator.getPlayer(this.source),this.owner)
			(damage,this.name)
			// return this.owner.game.playerSelector.get(this.sourceTurn).dealDamageTo(this.owner, damage, "tick", this.name)
			// return this.owner.dealDamageTo(damage.getTotalDmg(), this.sourceTurn, this.name, false)
		}
	}
}
class TickDamageEffect extends TickEffect {
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
			if(super.tick(currentTurn)) return true
		}

		if (this.tickDamage instanceof Damage) {
			return this.doDamage(this.tickDamage)
		} else if (this.tickDamage instanceof PercentDamage) {
			return this.doDamage(this.tickDamage.pack(this.owner))
		}

		return false
	}
}
interface ConditionFunction{
	(owner: Player, target: Player):boolean
}

class OnConditionEffect extends StatusEffect{
	ownerCondition:ConditionFunction
	constructor(id:number,dur:number,timing:EFFECT_TIMING){
		super(id, dur, timing)
	}
}


interface onHitFunction {
	(this: Player, target: Player, damage: Damage): Damage
}
/**
 * called on dealing damage
 */
class OnHitEffect extends StatusEffect {
	protected onHit: onHitFunction
	protected attack: number
	protected validTargets: string[] //only activate when attacking players in the array
	protected targetCondition: ConditionFunction
	static readonly SKILLATTACK = 0
	static readonly BASICATTACK = 1
	static readonly EVERYATTACK = 2 //skill and basic attack

	constructor(id: EFFECT, dur: number, onHit: onHitFunction) {
		super(id, dur, EFFECT_TIMING.BEFORE_SKILL)
		this.onHit = onHit
		this.attack = OnHitEffect.EVERYATTACK
		this.validTargets = []
		this.effectType = EFFECT_TYPE.ONHIT
		this.targetCondition = (target: Player, owner: Player) => true
	}

	on(attack: number) {
		this.attack = attack
		return this
	}

	to(targets: string[]) {
		this.validTargets = targets
		return this
	}
	setTargetCondition(targetCondition: ConditionFunction) {
		this.targetCondition = targetCondition
		return this
	}
	isValidTarget(target:Entity){
		if(this.validTargets.length===0) return true
		return this.validTargets.includes(target.UEID)
	}

	onHitWithSkill(target: Player, damage: Damage) {
		if (
			(this.attack === OnHitEffect.SKILLATTACK || this.attack === OnHitEffect.EVERYATTACK) &&
			this.isValidTarget(target) &&
			this.targetCondition(this.owner, target)
		) {
			return this.onHit.call(this.owner, target, damage)
		} else return damage
	}
	onHitWithBasicAttack(target: Player, damage: Damage) {
		if (
			(this.attack === OnHitEffect.BASICATTACK || this.attack === OnHitEffect.EVERYATTACK) &&
			this.isValidTarget(target)  &&
			this.targetCondition(this.owner, target)
		) {
			return this.onHit.call(this.owner, target, damage)
		} else return damage
	}
}

interface OnFinalDamageFunction {
	(damage: number, owner: Player): void
}

class OnFinalDamageEffect extends StatusEffect {
	protected onDamage: OnFinalDamageFunction
	private conditionHpPercent: number

	constructor(id: EFFECT, dur: number, f: OnFinalDamageFunction) {
		super(id, dur, EFFECT_TIMING.BEFORE_SKILL)
		this.onDamage = f
		this.conditionHpPercent = 100
		this.effectType=EFFECT_TYPE.ON_FINAL_DAMAGE
	}

	/**
	 * set effect to invoke when hp is lower than ?% of max hp
	 * @param percent
	 */
	setInvokeConditionHpPercent(percent: number) {
		this.conditionHpPercent = percent
		return this
	}

	/**
	 * called right before taking damage after applying resistance and other effects
	 * @param damage
	 */
	onFinalDamage(damage: number) {
		let predictedHP = this.owner.HP - damage
		if (predictedHP > 0 && predictedHP < (this.conditionHpPercent / 100) * this.owner.MaxHP) {
			this.onDamage(damage, this.owner)
		}
	}
}

interface OnDamageFunction {
	(damage: Damage, owner: Player): Damage
}

/**
 * called on taking damage
 */
class OnDamageEffect extends StatusEffect {
	protected sourceIds: string[] //only active when receiving damage from these players
	protected onDamage: OnDamageFunction
	protected damages: number[]

	static readonly SKILL_DAMAGE = 0
	static readonly BASICATTACK_DAMAGE = 1
	static readonly OBSTACLE_DAMAGE = 2

	constructor(id: EFFECT, dur: number, f: OnDamageFunction) {
		super(id, dur, EFFECT_TIMING.BEFORE_SKILL)
		this.onDamage = f
		this.effectType = EFFECT_TYPE.ONDAMAGE
		this.sourceIds = []
		this.damages = [OnDamageEffect.SKILL_DAMAGE, OnDamageEffect.BASICATTACK_DAMAGE, OnDamageEffect.OBSTACLE_DAMAGE]
	}

	on(damages: number[]) {
		this.damages = damages
		return this
	}

	from(ids: string[]) {
		this.sourceIds = ids
		return this
	}
	private isValidSource(source:string){
		if(this.sourceIds.length===0) return true
		return this.sourceIds.includes(source)
	}
	/**
	 * called when receiving skill damage
	 * @param damage
	 * @returns modified damage
	 */
	onSkillDamage(damage: Damage, source: string) {
		if (this.damages.includes(OnDamageEffect.SKILL_DAMAGE) && this.isValidSource(source)) {
			return this.onDamage(damage, this.owner)
		}
		return damage
	}
	/**
	 * called when receiving basic attack damage
	 * @param damage
	 * @returns modified damage
	 */
	onBasicAttackDamage(damage: Damage, source: string) {
		if (this.damages.includes(OnDamageEffect.BASICATTACK_DAMAGE) && this.isValidSource(this.source)) {
			return this.onDamage(damage, this.owner)
		}
		return damage
	}

	/**
	 * called when receiving obstacle damage
	 * @param damage
	 * @returns modified damage
	 */
	onObstacleDamage(damage: Damage) {
		if (this.damages.includes(OnDamageEffect.OBSTACLE_DAMAGE)) {
			return this.onDamage(damage, this.owner)
		}
		return damage
	}
}

export {
	StatusEffect,
	EFFECT_TYPE,
	EFFECT_SOURCE,
	TickActionFunction,
	AblityChangeEffect,
	OnDamageEffect,
	OnHitEffect,
	TickDamageEffect,
	NormalEffect,
	OnDamageFunction,
	GeneralEffectFactory,
	TickEffect,
	ShieldEffect,
	onHitFunction,
	ItemEffectFactory,
	EffectFactory,
	OnFinalDamageEffect
}
