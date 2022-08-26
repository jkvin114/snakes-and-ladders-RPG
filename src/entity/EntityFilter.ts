import type { Entity } from "./Entity"
import type { EntityStorage } from "./EntityMediator"
import { ENTITY_TYPE } from "../data/enum"
import { PriorityArray } from "../core/Util"

class EntityFilter {
	private playerOnly: boolean
	private enemyOnly: boolean
    private allyOnly: boolean

	private dead: boolean
	private untargetable: boolean
	private unattackable: boolean
	private excludes: Set<Entity>
	private ranges: { start: number; end: number }[]
	private condition: (this:Entity)=> boolean
	private returnByTurn: boolean
	private me: boolean
	public source: Entity

	static readonly ALL = (source: Entity) => new EntityFilter(false, source)
	static readonly ALL_PLAYER = (source: Entity) => new EntityFilter(true, source)
	static readonly ALL_ENEMY = (source: Entity) => new EntityFilter(false, source).excludeAlly()
	static readonly ALL_ENEMY_PLAYER = (source: Entity) => new EntityFilter(true, source).excludeAlly()
	static readonly ALL_OTHER_PLAYER = (source: Entity) => new EntityFilter(true, source).notMe()
	static readonly ALL_ALIVE_PLAYER = (source: Entity) => new EntityFilter(true, source).excludeDead()
	static readonly ALL_ATTACKABLE_PLAYER = (source: Entity) =>
		new EntityFilter(true, source).excludeDead().excludeAlly().excludeUntargetable().excludeUnattackable()
	static readonly VALID_MOVE_OBSTACLE_TARGET = (source: Entity) => new EntityFilter(true, source).excludeDead().notMe()

	constructor(playeronly: boolean, source: Entity) {
		this.playerOnly = playeronly
		this.ranges = []
		this.enemyOnly = false
		this.dead = true
		this.untargetable = true
		this.unattackable = true
		this.excludes = new Set<Entity>()
		this.condition = () => true
		this.returnByTurn = false
		this.me = true
		this.source = source
        this.allyOnly=false
	}
	notMe() {
		this.me = false
		return this
	}

	byTurn() {
		this.returnByTurn = true
		return this
	}
	onlyIf(cond: (this: Entity)=> boolean) {
		this.condition = cond
		return this
	}
	exclude(ex: Entity) {
		this.excludes.add(ex)
		return this
	}
	in(start: number, end: number) {
		this.ranges.push({ start: start, end: end })
		return this
	}
	at(pos: number) {
		this.ranges.push({ start: pos, end: pos })
		return this
	}
	inRadius(range: number) {
        let center=this.source.pos
		this.ranges.push({ start: center - range, end: center + range })
		return this
	}
	excludeAlly() {
		this.enemyOnly = true
		this.allyOnly=false
		return this
	}
    excludeEnemy() {
		this.allyOnly = true
		this.enemyOnly = false

		return this
	}
	excludeDead() {
		this.dead = false
		return this
	}
	excludeUntargetable() {
		this.untargetable = false
		return this
	}
	excludeUnattackable() {
		this.unattackable = false
		return this
	}
	private isInRange(e: Entity) {
		if (this.ranges.length === 0) return true
		for (let range of this.ranges) {
			if (range.start <= e.pos && range.end >= e.pos) return true
		}
		return false
	}
    
    getFrom(entities: EntityStorage){
		let list: PriorityArray<Entity> = new PriorityArray<Entity>()
        if(this.playerOnly){
            // let list: PriorityArray<Player> = new PriorityArray<Player>()
            for (let entity of entities.all()) {
				if (entity.type!==ENTITY_TYPE.PLAYER) continue
                if (!this.me && this.source === entity) continue
                if (!this.condition.call(entity)) continue
                if (this.excludes.has(entity)) continue
                if (!this.isInRange(entity)) continue
                if (!this.dead && entity.dead) continue
                if (!this.untargetable && !entity.isTargetableFrom(this.source)) continue
                if (!this.unattackable && !entity.isAttackableFrom(this.source)) continue
                if (this.enemyOnly && !entity.isEnemyOf(this.source)) continue
                if (this.allyOnly && entity.isEnemyOf(this.source)) continue
                list.push(entity)
            }
            return list
        }
        else{
            for (let entity of entities.all()) {
                if (!this.me && this.source === entity) continue
                if (!this.condition.call(entity)) continue
                if (this.excludes.has(entity)) continue
                if (!this.isInRange(entity)) continue
                if (!this.dead && entity.dead) continue
                if (!this.untargetable && !entity.isTargetableFrom(this.source)) continue
                if (!this.unattackable && !entity.isAttackableFrom(this.source)) continue
                if (this.enemyOnly && !entity.isEnemyOf(this.source)) continue
                if (this.allyOnly && entity.isEnemyOf(this.source)) continue
                list.push(entity)
            }
            return list
        }
    }


}
export {EntityFilter}