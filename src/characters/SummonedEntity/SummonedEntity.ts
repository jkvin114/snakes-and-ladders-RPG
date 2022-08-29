import { Entity } from "../../entity/Entity"
import { Player} from "../../player/player"
import type {Game } from "../../Game"
import { EntityFilter } from "../../entity/EntityFilter"
import { ENTITY_TYPE, SKILL } from "../../data/enum"
import { ServerGameEventInterface } from "../../data/PayloadInterface"
import {  SkillAttack }  from "../../core/Util"
import type {Damage} from "../../core/Util"
abstract class SummonedEntity extends Entity {
	summoner: Player
	lifeTime: number
	lifeSpan: number
	entityName: string
	UEID: string
	skillTargetable: boolean
	abstract doDamage(source: Entity, damage: Damage): boolean
	constructor(game: Game, health: number, name: string) {
		super(game, health, 0,ENTITY_TYPE.SUMMONED_ENTITY)
		this.entityName = name
		this.pos = 0
		this.UEID
		this.skillTargetable = false
	}
	summon(summoner: Player, life: number, pos: number, id: string) {
		//	console.log("summon"+id)

		this.summoner = summoner
		this.lifeSpan = life
		this.lifeTime = 0
		this.pos = pos
		this.UEID = id
		return this
	}

	getTransferData():ServerGameEventInterface.SummonedEntity {
		return {
			sourceTurn: this.summoner.turn,
			pos: this.pos,
			UEID: this.UEID,
			name: this.entityName
		}
	}
	isTargetableFrom(e: Entity) {
		return this.skillTargetable
	}

	isAttackableFrom(e: Entity) {
		return this.isEnemyOf(e)
	}

	isEnemyOf(e: Entity) {
		if (!e) return true

		if (e instanceof Player) {
			if (this.summoner === e) return false
			if (this.game.isTeam && this.summoner.team === e.team) return false
		} else if (e instanceof SummonedEntity) {
			if (this.summoner === e.summoner) return false
			if (this.game.isTeam && this.summoner.team === e.summoner.team) return false
		}
		return true
	}

	naturalDeath() {
		//console.log("expired plant " + this.UEID)
		this.dead = true
		this.game.removeEntity(this.UEID, false)
	}
	killed() {
	//	console.log("died plant " + this.UEID)
		this.dead = true
		this.game.removeEntity(this.UEID, true)
	}

	basicAttack(): void {}
	onTurnStart(thisturn: number) {
		if (this.dead) return

		if (this.summoner.turn === thisturn) {
			this.lifeTime += 1
			if (this.lifeTime > this.lifeSpan) this.naturalDeath()
		}
	}
}

abstract class EntityDecorator extends SummonedEntity {
	entity: SummonedEntity
	constructor(entity: SummonedEntity) {
		super(entity.game, entity.HP, entity.entityName)
		this.entity = entity
	}
	summon(summoner: Player, life: number, pos: number, id: string) {
		this.entity.summon(summoner, life, pos, id)
		super.summon(summoner, life, pos, id)

		return this
	}
	killed(): void {
		this.entity.killed()
		super.killed()
	}
	doDamage(source: Entity, damage: Damage): boolean {
		return this.entity.doDamage(source, damage)
	}
	basicAttack(): void {
		this.entity.basicAttack()
	}
}

class Attackable extends EntityDecorator {
	damage: Damage
	attackRange: number
	skill: number
	attackName: string
	entity: SummonedEntity
	constructor(entity: SummonedEntity, damage: Damage, attackRange: number) {
		super(entity)
		this.entity = entity
		this.damage = damage
		this.attackRange = attackRange
		this.skill = -1
		this.attackName = ""
	}
	doDamage(source: Entity, damage: Damage): boolean {
//		console.log("dodamage attackable")
		return this.entity.doDamage(source, damage)
	}
	setAttackName(name: string) {
		this.attackName = name
		return this
	}
	setAttackSkill(skill: SKILL) {
		this.skill = skill
		return this
	}

	basicAttack() {
		if (this.skill >= 0) {
			//attack as skill damage
			this.mediator.skillAttack(
				this.summoner,
				EntityFilter.ALL_ATTACKABLE_PLAYER(this).inRadius(this.attackRange)
			,new SkillAttack(this.damage, this.attackName))
		} else {
			//attack as entity damage
			this.mediator.attack(this.summoner, EntityFilter.ALL_ATTACKABLE_PLAYER(this).inRadius(this.attackRange),
				this.damage,
				this.attackName
			)
		}
	}
}
class Damageable extends EntityDecorator {
	rewardMoney: number
	entity: SummonedEntity
	constructor(entity: SummonedEntity) {
		super(entity)
		this.entity = entity
		this.rewardMoney = 0
	}
	setReward(money: number) {
		this.rewardMoney = money
		return this
	}
	basicAttack(): void {
		this.entity.basicAttack()
	}
	doDamage(source: Entity, damage: Damage) {
	//	console.log("entitydamage" + damage.getTotalDmg())

		let dmg = damage.getTotalDmg()
		this.HP -= dmg
		if (this.HP <= 0) {
			super.killed()
			if (source instanceof Player) source.inven.giveMoney(this.rewardMoney)
			return true
		}
		return false
	}
}

class EntityBuilder {
	game: Game
	HP: number
	name: string
	damage: Damage
	attackRange: number
	damageAble: boolean
	attackAble: boolean

	constructor(game: Game, name: string) {
		this.game = game
		this.HP = 0
		this.name = name
		this.damageAble = false
		this.attackAble = true
	}
	setHP(hp: number) {
		this.HP = hp
		return this
	}

	setAttackable(damage: Damage, attackRange: number) {
		this.attackAble = true
		this.damage = damage
		this.attackRange = attackRange
		return this
	}
	setUndamageable() {
		this.damageAble = false
		return this
	}

	// build(): SummonedEntity {
	// 	// let e = new SummonedEntity(this.game, this.HP, this.name)
	// 	// if (this.damageAble) {
	// 	// 	e = new Damageable(e)
	// 	// }
	// 	// if (this.attackAble) {
	// 	// 	e = new Attackable(e, this.damage, this.attackRange)
	// 	// }
	// 	// return e
	// }
}

export { SummonedEntity, Attackable, Damageable }
