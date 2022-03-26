import { Game } from "./Game"
import { EntityMediator } from "./EntityMediator"
import { Player } from "./player"
import { Damage, decrement } from "./Util"
import { clamp } from "./Util"
import { MAP } from "./Game"
//anything that has its own HP
class Entity {
	game: Game
	mapId: number
	pos: number
	HP: number
	MaxHP: number
	mediator:EntityMediator
	dead:boolean
	constructor(game: Game, health: number, pos: number) {
		this.game = game
		this.mapId = game.mapId
		this.HP = health
		this.MaxHP = health
		this.pos = pos //현재위치
		this.dead=false
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
