import { PriorityArray } from "../core/Util"
import { ENTITY_TYPE } from "../data/enum"
import type { Player } from "../player/player"
import type { Entity } from "./Entity"
import type { EntityFilter } from "./EntityFilter"

export class EntityStorage {
	private entities: Map<string, Entity>
	private playerIds: string[]
	private static readonly PLAYER_ID_SUFFIX = "P"
	constructor() {
		this.playerIds = []
		this.entities = new Map<string, Entity>()
	}
	private playerId(turn: number) {
		return String(turn + 1) + EntityStorage.PLAYER_ID_SUFFIX
	}
	addPlayer(id: string, player: Player) {
		// let pid = this.playerId(this.playerIds.length)
		this.playerIds.push(id)
		this.entities.set(id, player)
	}
	addEntity(id: string, entity: Entity) {
		this.entities.set(id, entity)
	}
	/**
	 * get player
	 * @param id
	 * @returns Player
	 */
	getPlayer(id:string): Player|undefined {
		// if (turn >= this.playerIds.length) return null
		if (!this.entities.has(id)) return undefined

		return this.entities.get(id) as Player
	}
	allPlayer():Player[]{
		let list=new Array<Player>()
		for(let id of this.playerIds){
			list.push(this.entities.get(id) as Player)
		}
		return list
	}
	getEntity(id: string): Entity |undefined{
		if (!this.entities.has(id)) return undefined
		return this.entities.get(id)
	}
	removeEntity(id: string) {
		if (!this.entities.has(id)) return
		this.entities.delete(id)
	}

	cleanUpDeadEntity() {
		for (let [id, entity] of this.entities.entries()) {
			if (entity.type!==ENTITY_TYPE.PLAYER && entity.dead) {
		//		console.log("deleted entity " + id)
				this.entities.delete(id)
			}
		}
	}

	all() {
		return this.entities.values()
	}
    

}
