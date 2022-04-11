import { EntityMediator} from "./EntityMediator"
import type { Game } from "./Game"
import { Damage, decrement } from "./Util"
import { EntityStatusEffect } from "./PlayerStatusEffect"
import { clamp } from "./Util"
import { MAP } from "./MapHandlers/MapStorage"
import { ENTITY_TYPE } from "./enum"
//anything that has its own HP
class Entity {
	game: Game
	mapId: number
	pos: number
	HP: number
	MaxHP: number
	mediator:EntityMediator
	dead:boolean
	type:ENTITY_TYPE
	UEID:string	
	effects: EntityStatusEffect
	level:number

	constructor(game: Game, health: number, pos: number,type:ENTITY_TYPE) {
		this.game = game
		this.level=1
		this.mapId = game.mapId
		this.HP = health
		this.MaxHP = health
		this.pos = pos //현재위치
		this.dead=false
		this.type=type
		this.effects=new EntityStatusEffect(this)
	}

	hitBySkill(skilldmg: Damage, effectname: string, source: number, onHit?: Function): boolean {
		return false
	}
	setMediator(m:EntityMediator){
		this.mediator=m
	}
	onTurnStart(thisturn:number){}
	onTurnEnd(thisturn:number){}
	forceMove(pos:number){
		this.pos=clamp(pos,0,MAP.getLimit(this.mapId))
	}
	basicAttack(){}
	isTargetableFrom(e:Entity){
		return true
	}
	isAttackableFrom(e:Entity){
		return true
	}
	isEnemyOf(e:Entity){
		return true
	}
}


export { Entity }
