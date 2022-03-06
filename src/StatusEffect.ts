import { Player } from "./player"
import { CALC_TYPE, Damage, decrement, HPChangeData, PercentDamage } from "./Util"
import { EFFECT, ITEM, SKILL } from "./enum"
import Ability from "./PlayerAbility"




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
	TICK = 5
}
enum EFFECT_TIMING {
	TURN_START,
	TURN_END,
	BEFORE_SKILL
}

class EffectFactory {
	static create(effect: EFFECT) {
		switch (effect) {
			case EFFECT.MAGIC_CASTLE_ADAMAGE:
				return new OnHitEffect(1, (owner: Player, t: Player, damage: Damage) => {
					return damage.updateTrueDamage(CALC_TYPE.plus, owner.ability.getMagicCastleDamage())
				})
					.setGood()
					.setId(EFFECT.MAGIC_CASTLE_ADAMAGE)
					.on(OnHitEffect.SKILLATTACK)
		}
	}
}

/**
 * construct effects from items
 *
 */
class ItemEffectFactory {
	static create(item: ITEM) {
		switch (item) {
			case ITEM.EPIC_FRUIT:
				return new TickEffect(StatusEffect.FOREVER, TickEffect.FREQ_EVERY_TURN)
					.setAction(function (owner: Player) {
						owner.changeHP_heal(new HPChangeData().setHpChange(owner.ability.extraHP * 0.15))

						return false
					})
					.setId(EFFECT.ITEM_FRUIT)
					.setGood()
			case ITEM.POWER_OF_MOTHER_NATURE:
				return new OnDamageEffect(StatusEffect.FOREVER, function (Damage: Damage, owner: Player) {

					if (owner.inven.isActiveItemAvaliable(ITEM.POWER_OF_MOTHER_NATURE)) {
						owner.inven.useActiveItem(ITEM.POWER_OF_MOTHER_NATURE)
						owner.effects.applySpecial(
							new AblityChangeEffect(1, new Map().set("moveSpeed", 1))
								.setId(EFFECT.ITEM_POWER_OF_MOTHER_NATURE_ABILITY)
								.setGood(),
							"power_of_mother_nature_speed"
						)
					}

					return Ability.applySkillDmgReduction(Damage, 30)
				}).on([OnDamageEffect.SKILL_DAMAGE])
					.setId(EFFECT.ITEM_POWER_OF_MOTHER_NATURE)
					.setGood()

			case ITEM.POWER_OF_NATURE:
				return new OnDamageEffect(StatusEffect.FOREVER, (Damage: Damage, owner: Player) => {
					return Ability.applySkillDmgReduction(Damage, 10)
				}).on([OnDamageEffect.SKILL_DAMAGE])
					.setId(EFFECT.ITEM_POWER_OF_NATURE)
					.setGood()

			case ITEM.CARD_OF_DECEPTION:
				return new OnHitEffect(StatusEffect.FOREVER, (owner: Player, target: Player, damage: Damage) => {
					if (owner.inven.isActiveItemAvaliable(ITEM.CARD_OF_DECEPTION)) {
						console.log("CARD_OF_DECEPTION")
						damage.updateNormalDamage(CALC_TYPE.multiply, 1.1)
						target.effects.apply(EFFECT.SLOW, 1, EFFECT_TIMING.BEFORE_SKILL)
						owner.effects.apply(EFFECT.SPEED, 1, EFFECT_TIMING.BEFORE_SKILL)
						owner.inven.useActiveItem(ITEM.CARD_OF_DECEPTION)
					}
					return damage
				})
					.on(OnHitEffect.SKILLATTACK)
					.setTargetCondition((owner:Player,target:Player)=>{
						return owner.pos < target.pos
					})
					.setId(EFFECT.ITEM_CARD_OF_DECEPTION)
					.setGood()
			case ITEM.ANCIENT_SPEAR:
				return new OnHitEffect(StatusEffect.FOREVER, (owner: Player, target: Player, damage: Damage) => {
					return damage.updateMagicDamage(CALC_TYPE.plus, target.MaxHP * 0.1)
				})
				.on(OnHitEffect.EVERYATTACK)
				.setId(EFFECT.ITEM_ANCIENT_SPEAR_ADAMAGE)
				.setGood()
			case ITEM.SPEAR:
				return new OnHitEffect(StatusEffect.FOREVER, (owner: Player, target: Player, damage: Damage) => {
					console.log("ITEM_SPEAR_ADAMAGE")
					return damage.updateMagicDamage(CALC_TYPE.plus, target.MaxHP * 0.05)
				})
				.on(OnHitEffect.EVERYATTACK)
				.setId(EFFECT.ITEM_SPEAR_ADAMAGE)
				.setGood()
			case ITEM.CROSSBOW_OF_PIERCING:
				return new OnHitEffect(StatusEffect.FOREVER, (owner: Player, target: Player, damage: Damage) => {
					return damage.updateTrueDamage(CALC_TYPE.plus, target.MaxHP * 0.07)
				})
				.on(OnHitEffect.EVERYATTACK)
				.setId(EFFECT.ITEM_CROSSBOW_ADAMAGE)
				.setGood()
			case ITEM.FULL_DIAMOND_ARMOR:
				return new OnHitEffect(StatusEffect.FOREVER, (owner: Player, target: Player, damage: Damage) => {
					owner.ability.addMaxHP(5)
					console.log("FULL_DIAMOND_ARMOR")
					return damage
				})
				.on(OnHitEffect.EVERYATTACK)
				.setId(EFFECT.ITEM_DIAMOND_ARMOR_MAXHP_GROWTH)
				.setGood()
			case ITEM.BOOTS_OF_PROTECTION:
				return new OnDamageEffect(StatusEffect.FOREVER,(damage:Damage,owner:Player)=>{
					console.log("BOOTS_OF_PROTECTION")
					return damage.updateNormalDamage(CALC_TYPE.multiply,0.8)
				})
				.on([OnDamageEffect.BASICATTACK_DAMAGE])
				.setId(EFFECT.ITEM_BOOTS_OF_ENDURANCE)
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
	static create(id: EFFECT, dur: number, timing: EFFECT_TIMING) {
		switch (id) {
			case EFFECT.SLOW:
			case EFFECT.STUN:
			case EFFECT.SILENT:
			case EFFECT.BACKDICE:
			case EFFECT.BLIND:
			case EFFECT.PRIVATE_LOAN:
			case EFFECT.CURSE:
				return new NormalEffect(dur, timing).setId(id)
			case EFFECT.SPEED:
			case EFFECT.SHIELD:
			case EFFECT.DOUBLEDICE:
			case EFFECT.INVISIBILITY:
			case EFFECT.FARSIGHT:
				return new NormalEffect(dur, timing).setId(id).setGood()
			case EFFECT.POISON: //poison
				return new TickDamageEffect(dur, TickEffect.FREQ_EVERY_TURN, new Damage(0, 0, 30)).setId(id)
			case EFFECT.RADI: //radiation
				return new OnDamageEffect(dur, (damage: Damage, owner: Player) => {
					return damage.updateAllDamage(CALC_TYPE.multiply, 2)
				}).setId(id)
			case EFFECT.ANNUITY: //annuity
				return new TickEffect(dur, TickEffect.FREQ_EVERY_TURN)
					.setAction(function (target: Player) {
						target.inven.giveMoney(20)
						return false
					})
					.setId(id)
					.setGood()
			case EFFECT.SLAVE: //slave
				return new TickDamageEffect(dur, TickEffect.FREQ_EVERY_TURN, new Damage(0, 0, 80)).setId(id)
			case EFFECT.IGNITE: //ignite
				return new TickPercentDamageEffect(
					dur,
					TickEffect.FREQ_EVERY_PLAYER_TURN,
					new PercentDamage(4, PercentDamage.MAX_HP)
				).setId(id)
			case EFFECT.ANNUITY: //annuity lottery
				return new TickEffect(dur, TickEffect.FREQ_EVERY_TURN)
					.setAction(function (target: Player) {
						target.inven.giveMoney(50)
						target.inven.changeToken(1)
						return false
					})
					.setId(id)
					.setGood()
		}
	}
}

abstract class StatusEffect {
	protected duration: number
	public isgood: boolean
	public owner: Player
	public readonly timing: EFFECT_TIMING
	public id: EFFECT
	public name: string
	public sourceTurn: number
	public effectType: EFFECT_TYPE
	static DURATION_UNTIL_LETHAL_DAMAGE = 1000
	static DURATION_UNTIL_DEATH= 2000
	static FOREVER=10000

	constructor(dur: number, timing: EFFECT_TIMING) {
		this.duration = dur
		this.isgood = false
		this.owner = null
		this.timing = timing
		this.id = -1
		this.name = ""
		this.sourceTurn = -1

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
	setId(id: number) {
		this.id = id
		return this
	}
	setGood() {
		this.isgood = true
		return this
	}

	setSourcePlayer(sourceturn: number) {
		this.sourceTurn = sourceturn
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
		console.log(this.duration)
		if(this.duration >= StatusEffect.DURATION_UNTIL_DEATH){
			return false
		}
		return true
	}
	onDeath() {
		if(this.duration >= StatusEffect.FOREVER){
			return false
		}

		return true
	}
}

class NormalEffect extends StatusEffect {
	constructor(dur: number, timing: EFFECT_TIMING) {
		super(dur, timing)
		this.effectType = EFFECT_TYPE.NORMAL
	}
}

class ShieldEffect extends StatusEffect {
	// name:string
	public amount: number
	constructor(duration: number, amount: number) {
		super(duration, EFFECT_TIMING.BEFORE_SKILL)
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
	constructor(dur: number, abilityChanges: Map<string, number>) {
		super(dur, EFFECT_TIMING.TURN_START)
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
	(owner: Player): boolean
}

class TickEffect extends StatusEffect {
	static FREQ_EVERY_TURN = 1
	static FREQ_EVERY_PLAYER_TURN = 2

	protected tickAction: TickActionFunction
	protected frequency: number
	protected sourceSkill: SKILL //스킬 판정인지 여부, null 이면 스킬판정 아님

	constructor(dur: number, frequency: number) {
		super(dur, EFFECT_TIMING.TURN_START)
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

	tick(currentTurn: number): boolean {
		if (currentTurn !== this.owner.turn && this.frequency === TickEffect.FREQ_EVERY_TURN) {
			return false
		}
		if (this.tickAction && !this.owner.dead) return this.tickAction(this.owner)

		return false
	}

	doDamage(damage: Damage): boolean {
		if (this.owner.dead) return false

		if (this.owner.inven.haveItem(ITEM.BOOTS_OF_ENDURANCE)) {
			damage.updateAllDamage(CALC_TYPE.multiply, 0.75)
		}

		if (this.sourceTurn === -1) {
			return this.owner.doObstacleDamage(damage.getTotalDmg(), this.name)
		} else if (this.sourceSkill != null) {
			return this.owner.hitBySkill(damage, this.name, this.sourceTurn)
		} else {
			return this.owner.game.playerSelector.get(this.sourceTurn).dealDamageTo(this.owner, damage, "tick", this.name)
			// return this.owner.dealDamageTo(damage.getTotalDmg(), this.sourceTurn, this.name, false)
		}
	}
}
class TickDamageEffect extends TickEffect {
	protected tickDamage: Damage
	constructor(dur: number, frequency: number, damage: Damage) {
		super(dur, frequency)
		this.tickDamage = damage
	}
	tick(currentTurn: number): boolean {
		if (currentTurn !== this.owner.turn && this.frequency === TickEffect.FREQ_EVERY_TURN) {
			return false
		}
		if (this.tickAction != null) {
			super.tick(currentTurn)
		}
		return this.doDamage(this.tickDamage)
	}
}
class TickPercentDamageEffect extends TickEffect {
	protected tickPercentDamage: PercentDamage

	constructor(dur: number, frequency: number, damage: PercentDamage) {
		super(dur, frequency)
		this.tickPercentDamage = damage
	}

	tick(currentTurn: number): boolean {
		//console.log("tickdamage" + this.owner.turn)
		if (currentTurn !== this.owner.turn && this.frequency === TickEffect.FREQ_EVERY_TURN) {
			return false
		}

		if (this.tickAction != null) {
			super.tick(currentTurn)
		}

		return this.doDamage(this.tickPercentDamage.pack(this.owner))
	}
}

interface onHitFunction {
	(owner: Player, target: Player, damage: Damage): Damage
}
/**
 * called on dealing damage
 */
class OnHitEffect extends StatusEffect {
	protected onHit: onHitFunction
	protected attack: number
	protected validTargets: number[] //only activate when attacking players in the array
	protected targetCondition:Function
	static SKILLATTACK = 0
	static BASICATTACK = 1
	static EVERYATTACK = 2 //skill and basic attack

	constructor(dur: number, onHit: onHitFunction) {
		super(dur, EFFECT_TIMING.BEFORE_SKILL)
		this.onHit = onHit
		this.attack = OnHitEffect.EVERYATTACK
		this.validTargets = [0, 1, 2, 3]
		this.effectType = EFFECT_TYPE.ONHIT
		this.targetCondition=(target:Player,owner:Player)=>true
	}

	on(attack: number) {
		this.attack = attack
		return this
	}

	to(targets: number[]) {
		this.validTargets = targets
		return this
	}
	setTargetCondition(targetCondition:Function){
		this.targetCondition=targetCondition
		return this
	}

	onHitWithSkill(target: Player, damage: Damage) {
		if (
			(this.attack === OnHitEffect.SKILLATTACK || this.attack === OnHitEffect.EVERYATTACK) &&
			this.validTargets.includes(target.turn) && this.targetCondition(this.owner,target)
		) {
			return this.onHit(this.owner, target, damage)
		} else return damage
	}
	onHitWithBasicAttack(target: Player, damage: Damage) {
		if (
			(this.attack === OnHitEffect.BASICATTACK || this.attack === OnHitEffect.EVERYATTACK) &&
			this.validTargets.includes(target.turn) && this.targetCondition(this.owner,target)
		) {
			return this.onHit(this.owner, target, damage)
		} else return damage
	}
}

interface OnDamageFunction {
	(damage: Damage, owner: Player): Damage
}
/**
 * called on taking damage
 */
class OnDamageEffect extends StatusEffect {
	protected sourcePlayerTurns: number[] //only active when receiving damage from these players
	protected onDamage: OnDamageFunction
	protected damages: number[]

	static SKILL_DAMAGE = 0
	static BASICATTACK_DAMAGE = 1
	static OBSTACLE_DAMAGE = 2

	constructor(dur: number, f: OnDamageFunction) {
		super(dur, EFFECT_TIMING.BEFORE_SKILL)
		this.onDamage = f
		this.effectType = EFFECT_TYPE.ONDAMAGE
		this.sourcePlayerTurns = [0, 1, 2, 3]
		this.damages = [OnDamageEffect.SKILL_DAMAGE, OnDamageEffect.BASICATTACK_DAMAGE, OnDamageEffect.OBSTACLE_DAMAGE]
	}

	on(damages: number[]) {
		this.damages = damages
		return this
	}

	from(turns: number[]) {
		this.sourcePlayerTurns = turns
		return this
	}
	/**
	 * called when receiving skill damage
	 * @param damage
	 * @returns modified damage
	 */
	onSkill(damage: Damage, sourceTurn: number) {
		if (this.damages.includes(OnDamageEffect.SKILL_DAMAGE) && this.sourcePlayerTurns.includes(sourceTurn)) {
			return this.onDamage(damage, this.owner)
		}
		return damage
	}
	/**
	 * called when receiving basic attack damage
	 * @param damage
	 * @returns modified damage
	 */
	onBasicAttack(damage: Damage, sourceTurn: number) {
		if (this.damages.includes(OnDamageEffect.BASICATTACK_DAMAGE) && this.sourcePlayerTurns.includes(sourceTurn)) {
			return this.onDamage(damage, this.owner)
		}
		return damage
	}

	/**
	 * called when receiving obstacle damage
	 * @param damage
	 * @returns modified damage
	 */
	onObstacle(damage: Damage) {
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
	TickPercentDamageEffect,
	TickDamageEffect,
	NormalEffect,
	OnDamageFunction,
	GeneralEffectFactory,
	TickEffect,
	ShieldEffect,
	onHitFunction,
	ItemEffectFactory,
	EffectFactory
}
