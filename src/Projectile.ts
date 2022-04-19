import { Player } from "./player"
import type { Game } from "./Game";

import { ServerPayloadInterface } from "./PayloadInterface"
import { Damage, decrement } from "./Util"

abstract class Projectile {
	static readonly TYPE_RANGE = 1
	static readonly TYPE_PASS = 2

	static readonly FLAG_IGNORE_OBSTACLE = 3
	static readonly FLAG_NOT_DISAPPER_ON_STEP = 4
	static readonly FLAG_STOP_PLAYER = 5
	
	static readonly TARGET_ENEMY = 6
	static readonly TARGET_ALL = 7
	sourceTurn: number
	size: number
	name: string
	damage: Damage
	pos: number
	activated: boolean
	trajectorySpeed: number
	UPID: string
	action: (this:Player)=>void
	game: Game
	duration: number
	flags: Set<number>
	target: number

	constructor(builder: ProjectileBuilder) {
		this.sourceTurn = builder.sourceTurn
		this.size = builder.size
		this.name = builder.name
		this.action = builder.action
		this.damage = builder.damage
		this.game = builder.game
		this.duration = builder.dur
		this.trajectorySpeed = builder.trajectorySpeed
		this.pos = -1
		this.activated = false
		this.flags = builder.flags
		this.UPID = ""
		this.target = builder.target
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
		if (this.sourceTurn === thisturn || (this.sourceTurn === -1 && thisturn === 0)) {
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
		if (this.sourceTurn === -1 || this.target === Projectile.TARGET_ALL) return true
		if (this.target === Projectile.TARGET_ENEMY && target.isAttackableFrom(this.game.pOfTurn(this.sourceTurn)))
			return true

		return false
	}

	hasFlag(flag: number) {
		return this.flags.has(flag)
	}
	place(pos: number, id: string) {
		console.log("placeproj"+id)
		this.UPID = id
		this.pos = pos
		this.activated = true
	}
	remove() {
		this.pos = -1
		this.activated = false

		this.damage = null
		this.duration = 0
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

	getTransferData() :ServerPayloadInterface.RangeProjectile {
		return {
			scope: this.scope,
			UPID: this.UPID,
			owner: this.sourceTurn,
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

	getTransferData():ServerPayloadInterface.PassProjectile {
		return {
			name: this.name,
			scope: [this.pos],
			UPID: this.UPID,
			stopPlayer: this.hasFlag(Projectile.FLAG_STOP_PLAYER),
			owner: this.sourceTurn,
			trajectorySpeed: this.trajectorySpeed
		}
	}
	place(pos: number, id: string) {
		super.place(pos, id)
		this.pos = this.game.getPlaceableCoordinates(this.pos, 1)[0]
	}
}

// class Pr2ojectile {
// 	static FLAG_IGNORE_OBSTACLE = 1
// 	// id: number
// 	// owner: Player
// 	size: number
// 	type: string
// 	// skillrange: number
// 	// skill: number
// 	action: Function
// 	// owneraction: Function
// 	damage: Damage
// 	pos: number
// 	activated: boolean
// 	scope: number[]
// 	dur: number
// 	UPID: string
// 	disappearWhenStep: boolean
// 	game: Game
// 	trajectorySpeed: number
// 	flags: Set<number>

// 	constructor(builder: ProjectileBuilder) {
// 		// this.id = data.id
// 		// this.owner = builder.owner
// 		this.size = builder.size
// 		this.type = builder.name
// 		// this.skillrange = builder.skillrange
// 		// this.skill = builder.skill
// 		this.action = builder.action
// 		// this.owneraction = builder.owneraction
// 		this.damage = builder.damage
// 		// this.disappearWhenStep = builder.disappearWhenStep
// 		this.game = builder.game
// 		this.dur = builder.dur
// 		this.trajectorySpeed = builder.trajectorySpeed

// 		this.pos = -1
// 		this.activated = false
// 		this.scope = []
// 		this.UPID = "" //unique projectile id:  P1 P2 ..
// 		this.flags = builder.flags
// 	}

// 	/**
// 	 * remove the proj from player`s projectile list
// 	 * @param list player`s projectule list
// 	 * @returns

// removeProjFromList(list: Projectile[]) {
// 	return list.filter((proj) => proj.UPID !== this.UPID)
// }

// place(pos: number, id: string) {
// 	this.UPID = id
// 	this.pos = pos
// 	this.activated = true
// 	let c = 0
// 	let i = 0
// 	while (i < this.size && c < MAP.get(this.owner.mapId).coordinates.length) {
// 		if (this.owner.game.isAttackableCoordinate(pos + c)) {
// 			this.scope.push(pos + c)
// 			i += 1
// 		}
// 		c += 1
// 	}
// 	this.owner.transfer(PlayerClientInterface.placeProj,{
// 		scope: this.scope,
// 		UPID: id,
// 		owner: this.owner.turn,
// 		type: this.type,
// 		trajectorySpeed: this.trajectorySpeed
// 	})
// }
// remove() {
// 	this.owner.projectile = this.removeProjFromList(this.owner.projectile)
// 	this.game.removeProjectile(this.UPID)
// 	this.owner.transfer(PlayerClientInterface.removeProj, this.UPID)
// 	this.pos = -1
// 	this.scope = []
// 	this.activated = false

// 	this.damage = null
// 	this.dur = 0
// }

// projCoolDown():boolean {
// 	if (!this.activated) {
// 		return
// 	}
// 	//console.log("projCoolDown" + this.type + " " + this.dur)
// 	this.dur = Util.decrement(this.dur)
// 	if (this.dur === 0) {
// 		this.remove()
// 		return false
// 	}
// 	return true
// }
// }

class ProjectileBuilder {
	sourceTurn: number
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
		this.sourceTurn = -1
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
	setSource(turn: number) {
		this.sourceTurn = turn
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
		} else if (this.type === Projectile.TYPE_RANGE) {
			return new RangeProjectile(this)
		}
		return null
	}
}
export { Projectile, ProjectileBuilder, PassProjectile, RangeProjectile }
