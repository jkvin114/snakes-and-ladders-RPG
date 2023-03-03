import { Player } from "./player/player"
import { CALC_TYPE, decrement } from "./core/Util"
import { EFFECT, ITEM, SKILL } from "./data/enum"
import { PlayerAbility } from "./player/PlayerAbility"
import { SpecialEffect } from "./data/SpecialEffectRegistry"
import { Entity } from "./entity/Entity"
import { Damage, PercentDamage } from "./core/Damage"
import { HPChange } from "./core/health"
import { SkillAttack } from "./core/skill"

enum EFFECT_SOURCE {
	ENEMY,
	ALLY,
	OBSTACLE,
	ITEM,
}
enum EFFECT_TYPE {
	NORMAL = 0,
	SHIELD = 1,
	ABILITY_CHANGE = 2,
	ONHIT = 3,
	ONDAMAGE = 4,
	TICK = 5,
	ON_HP_BELOW_THRESHOLD = 6,
}
enum EFFECT_TIMING {
	TURN_START,
	TURN_END,
	BEFORE_SKILL,
	BEFORE_OBS,
}
const SHIELD_EFFECT_TIMING = EFFECT_TIMING.BEFORE_SKILL
const ABILITY_CHANGE_EFFECT_TIMING = EFFECT_TIMING.TURN_START
const TICK_EFFECT_TIMING = EFFECT_TIMING.TURN_END
const ONHIT_EFFECT_TIMING = EFFECT_TIMING.BEFORE_OBS
const ONHPBELOWTHRESHOLD_EFFECT_TIMING = EFFECT_TIMING.BEFORE_OBS
const ON_DAMAGE_EFFECT_TIMING = EFFECT_TIMING.BEFORE_OBS

class EffectFactory {
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
			case EFFECT.ITEM_ABILITY_SHIELDSWORD_ABSORB:
				return new AblityChangeEffect(effect_id, 2, new Map().set("absorb", 30), EFFECT_TIMING.TURN_END).setGood()
		}
	}
}

/**
 * construct effects from items
 *invoked when buying item
 */
class ItemPassiveEffectFactory {
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

/**
 * construct general effect(effects that can be applied from anywhere)
 *
 */
class GeneralEffectFactory {
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

abstract class StatusEffect {
	protected duration: number
	public isgood: boolean
	public owner: Player
	public readonly timing: EFFECT_TIMING
	public readonly id: EFFECT
	public namespace: string
	public source: string | null
	public effectType: EFFECT_TYPE
	public data: number[]
	static readonly DURATION_UNTIL_LETHAL_DAMAGE = 1000
	static readonly DURATION_UNTIL_DEATH = 2000
	static readonly DURATION_PERMANENT = 10000

	constructor(id: EFFECT, dur: number, timing: EFFECT_TIMING) {
		this.id = id
		this.duration = dur
		this.isgood = false
		this.owner = null
		this.timing = timing
		this.namespace = ""
		this.source = null
		this.data = []
		// if (timing === EFFECT_TIMING.BEFORE_SKILL || timing === EFFECT_TIMING.TURN_END) {
		// 	this.duration += 1
		// }
	}
	applyTo(owner: Player) {
		this.owner = owner
		//	if(!owner.isMyTurn()) this.duration+=1

		return this
	}
	setNamespace(name: string) {
		this.namespace = name
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
	addData(d: number) {
		this.data.push(d)
		return this
	}
	setData(d: number[]) {
		this.data = d
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
	shouldResetOnLethalDamage() {
		if (this.duration >= StatusEffect.DURATION_UNTIL_DEATH) {
			return false
		}
		return true
	}
	shouldResetOnDeath() {
		if (this.duration >= StatusEffect.DURATION_PERMANENT) {
			return false
		}

		return true
	}
	tick(currentTurn: number): boolean {
		return false
	}
	onHitWithSkill(target: Player, damage: Damage): Damage | null {
		return null
	}
	onHitWithBasicAttack(target: Player, damage: Damage): Damage | null {
		return null
	}
	onFinalDamage(damage: number) {}
	onSkillDamage(damage: Damage, source: string): Damage | null {
		return null
	}
	onBasicAttackDamage(damage: Damage, source: string): Damage | null {
		return null
	}
	onObstacleDamage(damage: Damage): Damage | null {
		return null
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
class AblityChangeEffect extends StatusEffect {
	protected abilityChanges: Map<string, number>
	protected remainingChanges: Map<string, number>
	protected decay: boolean
	constructor(id: EFFECT, dur: number, abilityChanges: Map<string, number>, timing?: EFFECT_TIMING) {
		if (!timing) timing = ABILITY_CHANGE_EFFECT_TIMING
		super(id, dur, timing)
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
			this.owner?.ability.update(name, val)

			this.remainingChanges.set(name, val)
		}
		this.owner?.ability.flushChange()

		return this
	}
	cooldown(): boolean {
		if (this.decay) {
			for (const [name, val] of this.remainingChanges.entries()) {
				if (this.abilityChanges.has(name)) {
					let decayamt = Math.floor((-1 * this.abilityChanges.get(name)) / this.duration)

					this.owner?.ability.update(name, decayamt)

					this.remainingChanges.set(name, val + decayamt)
				}
			}
			this.owner?.ability.flushChange()
		}

		return super.cooldown()
	}
	onBeforeReapply(): number {
		for (const [name, val] of this.remainingChanges.entries()) {
			this.owner?.ability.update(name, -1 * val)

			this.remainingChanges.set(name, 0)
		}

		return 0
	}
	onBeforeRemove(): void {
		//	console.log(this.owner.ability.MR)
		for (const [name, val] of this.remainingChanges.entries()) {
			this.owner?.ability.update(name, -1 * val)
			//	console.log("removeabilitychange"+name+" "+val)
			this.remainingChanges.set(name, 0)
		}

		this.owner?.ability.flushChange()
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
	protected sourceSkill: SKILL | number //스킬 판정인지 여부, -1 이면 스킬판정 아님

	constructor(id: EFFECT, dur: number, frequency: number) {
		super(id, dur, TICK_EFFECT_TIMING)
		this.frequency = frequency
		this.effectType = EFFECT_TYPE.TICK
		this.sourceSkill = -1
		this.tickAction = function (this: Player) {
			return false
		}
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
			return this.owner.doObstacleDamage(damage.getTotalDmg(), this.namespace)
		} else if (this.sourceSkill !== -1) {
			return this.owner.mediator.skillAttackAuto(
				this.owner.mediator.getPlayer(this.source),
				this.owner.UEID,
				new SkillAttack(damage, this.namespace, this.sourceSkill, this.owner.mediator.getPlayer(this.source))
			)
			// return this.owner.hitBySkill(damage, this.name, this.sourceTurn)
		} else {
			return this.owner.mediator.attackSingle(this.owner.mediator.getPlayer(this.source), this.owner, damage, this.namespace)
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
interface ConditionFunction {
	(owner: Player, target: Player): boolean
}

class OnConditionEffect extends StatusEffect {
	private conditionActiveItem: ITEM
	constructor(id: number, dur: number, timing: EFFECT_TIMING) {
		super(id, dur, timing)
		this.conditionActiveItem = ITEM.EMPTY
	}
	setConditionActiveItem(item: ITEM) {
		this.conditionActiveItem = item
		return this
	}
	protected checkSecondaryCondition() {
		if (this.conditionActiveItem === ITEM.EMPTY) return true

		return this.owner && this.owner.inven.isActiveItemAvailable(this.conditionActiveItem)
	}
	protected onAfterInvoke() {
		if (this.conditionActiveItem !== ITEM.EMPTY) this.owner?.inven.useActiveItem(this.conditionActiveItem)
	}
}

interface onHitFunction {
	(this: Player, target: Player, damage: Damage, data: number[]): Damage
}
/**
 * called on dealing damage
 */
class OnHitEffect extends OnConditionEffect {
	protected onHit: onHitFunction
	protected attack: number
	protected validTargets: string[] //only activate when attacking players in the array
	protected targetCondition: ConditionFunction
	static readonly SKILLATTACK = 0
	static readonly BASICATTACK = 1
	static readonly EVERYATTACK = 2 //skill and basic attack

	constructor(id: EFFECT, dur: number, onHit: onHitFunction) {
		super(id, dur, ONHIT_EFFECT_TIMING)
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
	private isValidTarget(target: Entity) {
		if (this.validTargets.length === 0) return true
		return this.validTargets.includes(target.UEID)
	}

	onHitWithSkill(target: Player, damage: Damage): Damage | null {
		if (
			(this.attack === OnHitEffect.SKILLATTACK || this.attack === OnHitEffect.EVERYATTACK) &&
			this.isValidTarget(target) &&
			this.targetCondition(this.owner, target) &&
			this.checkSecondaryCondition()
		) {
			
			damage = this.onHit.call(this.owner, target, damage, this.data)
			this.onAfterInvoke()
			
		}
		return damage
	}
	onHitWithBasicAttack(target: Player, damage: Damage): Damage | null {
		if (
			(this.attack === OnHitEffect.BASICATTACK || this.attack === OnHitEffect.EVERYATTACK) &&
			this.isValidTarget(target) &&
			this.targetCondition(this.owner, target) &&
			this.checkSecondaryCondition()
		) {
			damage = this.onHit.call(this.owner, target, damage, this.data)
			this.onAfterInvoke()
		} 
		 return damage
	}
}

interface OnHPBelowThresholdFunction {
	(damage: number, owner: Player, data: number[]): void
}

class OnHPBelowThresholdEffect extends OnConditionEffect {
	protected onHPBelowThreshold: OnHPBelowThresholdFunction
	private thresholdHpPercent: number

	constructor(id: EFFECT, dur: number, f: OnHPBelowThresholdFunction) {
		super(id, dur, ONHPBELOWTHRESHOLD_EFFECT_TIMING)
		this.onHPBelowThreshold = f
		this.thresholdHpPercent = 100
		this.effectType = EFFECT_TYPE.ON_HP_BELOW_THRESHOLD
	}

	/**
	 * set effect to invoke when hp is lower than ?% of max hp
	 * @param percent
	 */
	setInvokeConditionHpPercent(percent: number) {
		this.thresholdHpPercent = percent
		return this
	}

	/**
	 * called right before taking damage after applying resistance and other effects
	 * @param damage
	 */
	onFinalDamage(damage: number) {
		let predictedHP = this.owner.HP - damage
		if (
			predictedHP > 0 &&
			predictedHP < (this.thresholdHpPercent / 100) * this.owner.MaxHP &&
			this.checkSecondaryCondition()
		) {
			this.onHPBelowThreshold(damage, this.owner, this.data)
			this.onAfterInvoke()
		}
	}
}

interface OnDamageFunction {
	(damage: Damage, owner: Player, data: number[]): Damage
}

/**
 * called on taking damage
 */
class OnDamageEffect extends OnConditionEffect {
	protected sourceIds: string[] //only active when receiving damage from these players
	protected onDamage: OnDamageFunction
	protected damages: number[]

	static readonly SKILL_DAMAGE = 0
	static readonly BASICATTACK_DAMAGE = 1
	static readonly OBSTACLE_DAMAGE = 2

	constructor(id: EFFECT, dur: number, f: OnDamageFunction) {
		super(id, dur, ON_DAMAGE_EFFECT_TIMING)
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
	private isValidSource(source: string) {
		if (this.sourceIds.length === 0) return true
		return this.sourceIds.includes(source)
	}
	/**
	 * called when receiving skill damage
	 * @param damage
	 * @returns modified damage
	 */
	onSkillDamage(damage: Damage, source: string): Damage | null {
		if (
			this.damages.includes(OnDamageEffect.SKILL_DAMAGE) &&
			this.isValidSource(source) &&
			this.checkSecondaryCondition()
		) {
			damage = this.onDamage(damage, this.owner, this.data)
			this.onAfterInvoke()
		}
		return damage
	}
	/**
	 * called when receiving basic attack damage
	 * @param damage
	 * @returns modified damage
	 */
	onBasicAttackDamage(damage: Damage, source: string): Damage | null {
		if (
			this.damages.includes(OnDamageEffect.BASICATTACK_DAMAGE) &&
			this.isValidSource(this.source) &&
			this.checkSecondaryCondition()
		) {
			damage = this.onDamage(damage, this.owner, this.data)
			this.onAfterInvoke()
		}
		return damage
	}

	/**
	 * called when receiving obstacle damage
	 * @param damage
	 * @returns modified damage
	 */
	onObstacleDamage(damage: Damage): Damage | null {
		if (this.damages.includes(OnDamageEffect.OBSTACLE_DAMAGE) && this.checkSecondaryCondition()) {
			damage = this.onDamage(damage, this.owner, this.data)
			this.onAfterInvoke()
		}
		return damage
	}
}

export {
	StatusEffect,
	EFFECT_TYPE,
	EFFECT_TIMING,
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
	ItemPassiveEffectFactory,
	EffectFactory,
	OnHPBelowThresholdEffect,
}
