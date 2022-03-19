import { Entity } from "../../Entity"
import { SKILL } from "../../enum"
import { Game } from "../../Game"
import { Player } from "../../player"
import { Damage } from "../../Util"

abstract class SummonedEntity extends Entity {
	summoner: Player
	lifeTime: number
	lifeSpan: number
	entityName: string
	alive: boolean
	UEID: string
	abstract doDamage(source: Entity, damage: Damage): boolean
	constructor(game: Game, health: number, name: string) {
		super(game, health, 0)
		this.entityName = name
		this.alive = true
		this.pos = 0
		this.UEID
	}
	summon(summoner: Player, life: number, pos: number,id:string) {
	//	console.log("summon"+id)

		this.summoner = summoner
		this.lifeSpan = life
		this.lifeTime = 0
		this.pos = pos
		this.UEID = id
		return this
	}

	getTransferData() {
		return {
			sourceTurn: this.summoner.turn,
			pos: this.pos,
			UEID: this.UEID,
			name: this.entityName
		}
	} 
	

	move(pos: number) {
		this.pos=pos
	}
	naturalDeath() {
		console.log("expired plant "+this.UEID)
		this.alive = false
		this.game.removeEntity(this.UEID, false)
	}
	killed() {
		console.log("died plant "+this.UEID)
		this.alive = false
		this.game.removeEntity(this.UEID, true)
	}

	attack(): void {}
	onTurnStart(thisturn: number) {
		if (!this.alive) return

		if (this.summoner.turn === thisturn) {
			this.lifeTime += 1
			if (this.lifeTime > this.lifeSpan) this.naturalDeath()
		}
	}
}

abstract class EntityDecorator extends SummonedEntity {
	entity:SummonedEntity
	constructor(entity: SummonedEntity) {
		super(entity.game, entity.HP, entity.entityName)
		this.entity=entity
	}
	summon(summoner: Player, life: number, pos: number, id: string){
		this.entity.summon(summoner,life,pos,id)
		super.summon(summoner,life,pos,id)
		return this
	}
	killed(): void {
		this.entity.killed()
		super.killed()
	}
	doDamage(source: Entity, damage: Damage): boolean {
		return this.entity.doDamage(source,damage)
	}
	attack(): void {
		this.entity.attack()
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
		this.entity=entity
		this.damage = damage
		this.attackRange = attackRange
		this.skill = -1
		this.attackName = ""
	}
	doDamage(source: Entity, damage: Damage): boolean{
		console.log("dodamage attackable")
		return this.entity.doDamage(source,damage)}
	setAttackName(name: string) {
		this.attackName = name
		return this
	}
	setAttackSkill(skill: SKILL) {
		this.skill = skill
		return this
	}

	attack() {
		for (let target of this.game.playerSelector.getAllValidOpponentInRadius(this.summoner,this.pos, this.attackRange)) {
			console.log("entityattack")

			if (this.skill >=0) {//attack as skill damage
				target.hitBySkill(this.damage, this.attackName, this.summoner.turn)
			} else { //attack as entity damage
				this.summoner.dealDamageTo(target, this.damage, "entity", this.attackName)
			}
		}
	}
}
class Damageable extends EntityDecorator {
	rewardMoney: number
	entity: SummonedEntity
	constructor(entity: SummonedEntity) {
		super(entity)
		this.entity=entity
		this.rewardMoney = 0

	}
	setReward(money: number) {
		this.rewardMoney = money
		return this
	}
	attack(): void {
		this.entity.attack()
	}
	doDamage(source: Player, damage: Damage) {
		console.log("entitydamage"+damage.getTotalDmg())

		let dmg = damage.getTotalDmg()
		this.HP -= dmg
		if (this.HP <= 0) {
			
			super.killed()
			source.inven.giveMoney(this.rewardMoney)
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
