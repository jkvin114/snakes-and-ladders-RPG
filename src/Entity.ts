import { Game } from "./Game"
import { Player } from "./player"
import { Damage, decrement } from "./Util"

//anything that has its own HP
abstract class Entity {
	game: Game
	mapId: number
	pos: number
	HP: number
	MaxHP: number
	constructor(game: Game, health: number, pos: number) {
		this.game = game
		this.mapId = game.mapId
		this.HP = health
		this.MaxHP = health
		this.pos = pos //현재위치
	}

	hitBySkill(skilldmg: Damage, effectname: string, source: number, onHit?: Function): boolean {
		return false
	}
}

export { Entity }
