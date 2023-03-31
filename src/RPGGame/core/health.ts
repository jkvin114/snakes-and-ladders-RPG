import type { Player } from "../player/player"

export class HPChange {
	static readonly FLAG_BLOCKED_BY_SHIELD = 1
	static readonly FLAG_NODMG_HIT = 2
	static readonly FLAG_TICKDMG = 3
	static readonly FLAG_PLAINDMG = 4

	hp: number
	maxHp: number
	type: string
	sourcePlayer: Player|null
	needDelay: boolean
	killedByDamage: boolean
	willRevive: boolean
	skillTrajectorySpeed: number
	flags: Set<number>
	constructor(hp: number) {
		this.hp = Math.floor(hp)
		this.maxHp = 0
		this.type = "noeffect"
		this.sourcePlayer=null
		this.needDelay = false
		this.killedByDamage = false
		this.willRevive = false
		this.skillTrajectorySpeed = 0
		this.flags = new Set<number>()
	}

	getSourceTurn():number{
		if(!this.sourcePlayer) return -1
		else return this.sourcePlayer.turn
	}
	setHpChange(hp: number) {
		this.hp = Math.floor(hp)
		return this
	}
	setMaxHpChange(maxhp: number) {
		this.maxHp = Math.floor(maxhp)
		return this
	}
	setSourcePlayer(sourcePlayer: Player) {
		this.sourcePlayer = sourcePlayer
		return this
	}
	setRespawn() {
		this.type = "respawn"
		return this
	}
	setDelay() {
		this.needDelay = true
		return this
	}
	setType(type: string) {
		this.type = type
		return this
	}
	setKilled() {
		this.killedByDamage = true
		return this
	}
	setWillRevive() {
		this.willRevive = true
		return this
	}
	setSkillTrajectorySpeed(speed: number) {
		this.skillTrajectorySpeed = speed
		return this
	}
	addFlag(flag: number) {
		this.flags.add(flag)
		return this
	}
	hasFlag(flag: number) {
		return this.flags.has(flag)
	}
}