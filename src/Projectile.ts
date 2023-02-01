import type { Player } from "./player/player"
import type { Game } from "./Game";

import { ServerGameEventFormat } from "./data/EventFormat"
import {  decrement } from "./core/Util"
import { Damage } from "./core/Damage"

abstract class Projectile {
	static readonly TYPE_RANGE = 1
	static readonly TYPE_PASS = 2

	static readonly FLAG_IGNORE_OBSTACLE = 3
	static readonly FLAG_NOT_DISAPPER_ON_STEP = 4
	static readonly FLAG_STOP_PLAYER = 5
	
	static readonly TARGET_ENEMY = 6
	static readonly TARGET_ALL = 7
	// sourceTurn: number
	sourcePlayer:Player|null
	protected size: number
	name: string
	damage: Damage
	pos: number
	activated: boolean
	protected trajectorySpeed: number
	UPID: string
	action: (this:Player)=>void
	protected game: Game
	protected duration: number
	protected flags: Set<number>
	protected targetType: number
	constructor(builder: ProjectileBuilder) {
		// this.sourceTurn = builder.sourceTurn
		this.size = builder.size
		this.name = builder.name
		this.sourcePlayer=builder.sourcePlayer
		this.action = builder.action
		this.damage = builder.damage
		this.game = builder.game
		this.duration = builder.dur
		this.trajectorySpeed = builder.trajectorySpeed
		this.pos = -1
		this.activated = false
		this.flags = builder.flags
		this.UPID = ""
		this.targetType = builder.target
	}
	/**
	 *
	 * @param thisturn
	 * @returns true if duration is over
	 */
	cooldown(thisturn: number): boolean {
		if (!this.activated) {
			return false
		}
		if(!this.sourcePlayer){
			if(thisturn === 0)
			{
				this.duration = decrement(this.duration)
				if (this.duration === 0) {
					this.activated = false
					return true
				}
			}
		}
		else if (this.sourcePlayer.turn === thisturn) {
			this.duration = decrement(this.duration)
			if (this.duration === 0) {
				this.activated = false
				return true
			}
		}
		//console.log("projCoolDown" + this.type + " " + this.dur)

		return false
	}
	canApplyTo(target: Player) {
		if (!this.sourcePlayer || this.targetType === Projectile.TARGET_ALL) return true
		if (this.targetType === Projectile.TARGET_ENEMY && target.isAttackableFrom(this.sourcePlayer))
			return true

		return false
	}

	hasFlag(flag: number) {
		return this.flags.has(flag)
	}
	place(pos: number, id: string) {
		//console.log("placeproj"+id)
		this.UPID = id
		this.pos = pos
		this.activated = true
	}
	remove() {
		this.pos = -1
		this.activated = false

		this.duration = 0
	}
	protected getOwner():number{
		if(!this.sourcePlayer) return -1
		else return this.sourcePlayer.turn
	}
}

class RangeProjectile extends Projectile {
	scope: number[]
	constructor(builder: ProjectileBuilder) {
		super(builder)

		this.scope = []
		this.flags = builder.flags
	}

	place(pos: number, id: string) {
		super.place(pos, id)
		this.scope = this.game.getPlaceableCoordinates(this.pos, this.size)
	}

	getTransferData() :ServerGameEventFormat.RangeProjectile {
		// console.log(this.sourcePlayer)
		return {
			scope: this.scope,
			UPID: this.UPID,
			owner: this.getOwner(),
			name: this.name,
			trajectorySpeed: this.trajectorySpeed
		}
	}
}
class PassProjectile extends Projectile {
	constructor(builder: ProjectileBuilder) {
		super(builder)
		this.size = 1
	}

	getTransferData():ServerGameEventFormat.PassProjectile {
		return {
			name: this.name,
			scope: [this.pos],
			UPID: this.UPID,
			stopPlayer: this.hasFlag(Projectile.FLAG_STOP_PLAYER),
			owner: this.getOwner(),
			trajectorySpeed: this.trajectorySpeed
		}
	}
	place(pos: number, id: string) {
		super.place(pos, id)
		this.pos = this.game.getPlaceableCoordinates(this.pos, 1)[0]
	}
}

class ProjectileBuilder {
	sourcePlayer: Player|null
	size: number
	name: string
	skillrange: number
	skill: number
	action: (this:Player)=>void
	owneraction: Function
	damage: Damage
	dur: number
	game: Game
	trajectorySpeed: number
	flags: Set<number>
	type: number
	target: number
	constructor(game: Game, name: string, type: number) {
		this.sourcePlayer = null
		this.size = 1
		this.name = name
		// this.skillrange = 0
		// this.skill = 0
		this.action = function () {}
		this.owneraction = function () {}
		this.damage = new Damage(0, 0, 0)
		this.dur = Infinity
		this.game = game
		this.trajectorySpeed = 0
		this.flags = new Set<number>()
		this.type = type
		this.target = Projectile.TARGET_ENEMY
	}

	setCanApplyToAlly() {
		this.target = Projectile.TARGET_ALL
		return this
	}
	setSource(sourcePlayer: Player) {
		this.sourcePlayer = sourcePlayer
		return this
	}
	setSize(size: number) {
		this.size = size
		return this
	}

	// setGame(game: Game) {
	// 	this.game = game
	// 	return this
	// }
	setAction(action: (this:Player)=>void) {
		this.action = action
		return this
	}
	setSkillRange(range: number) {
		this.skillrange = range
		return this
	}
	setOwnerAction(action: Function) {
		this.owneraction = action
		return this
	}
	setDamage(damage: Damage) {
		this.damage = damage
		return this
	}
	setDuration(dur: number) {
		this.dur = dur
		return this
	}
	// setNotDisappearWhenStep() {
	// 	this.disappearWhenStep = false
	// 	return this
	// }
	setTrajectorySpeed(speed: number) {
		this.trajectorySpeed = speed
		return this
	}
	addFlag(flag: number) {
		this.flags.add(flag)
		return this
	}
	build() {
		if (this.type === Projectile.TYPE_PASS) {
			return new PassProjectile(this)
		} else {
			return new RangeProjectile(this)
		}
	}
}
export { Projectile, ProjectileBuilder, PassProjectile, RangeProjectile }
