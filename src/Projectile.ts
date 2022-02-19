import {PlayerClientInterface} from "./app"
import { Game,MAP } from "./Game"
import { Player } from "./player"
import * as Util from "./Util"

class Projectile {
	static FLAG_IGNORE_OBSTACLE=1
	// id: number
	owner: Player
	size: number
	type: string
	skillrange: number
	skill: number
	action: Function
	owneraction: Function
	damage: Util.Damage
	pos: number
	activated: boolean
	scope: number[]
	dur: number
	UPID: string
	disappearWhenStep: boolean
	game: Game
	trajectorySpeed: number
	flags:Set<number>

	constructor(builder: ProjectileBuilder) {
		// this.id = data.id
		this.owner = builder.owner
		this.size = builder.size
		this.type = builder.type
		this.skillrange = builder.skillrange
		this.skill = builder.skill
		this.action = builder.action
		this.owneraction = builder.owneraction
		this.damage = builder.damage
		this.disappearWhenStep = builder.disappearWhenStep
		this.game = builder.game
		this.dur = builder.dur
		this.trajectorySpeed = builder.trajectorySpeed

		this.pos = -1
		this.activated = false
		this.scope = []
		this.UPID = "" //unique projectile id:  P1 P2 ..
		this.flags=builder.flags
	}

	hasFlag(flag:number){
		return this.flags.has(flag)
	}
	/**
	 * remove the proj from player`s projectile list
	 * @param list player`s projectule list
	 * @returns
	 */
	removeProjFromList(list: Projectile[]) {
		return list.filter((proj) => proj.UPID !== this.UPID)
	}

	place(pos: number, id: string) {
		this.UPID = id
		this.pos = pos
		this.activated = true
		let c = 0
		let i = 0
		while (i < this.size && c < MAP.get(this.owner.mapId).coordinates.length) {
			if (this.owner.game.isAttackableCoordinate(pos + c)) {
				this.scope.push(pos + c)
				i += 1
			}
			c += 1
		}
		this.owner.transfer(PlayerClientInterface.placeProj,{
			scope: this.scope,
			UPID: id,
			owner: this.owner.turn,
			type: this.type,
			trajectorySpeed: this.trajectorySpeed
		})
	}
	remove() {
		this.owner.projectile = this.removeProjFromList(this.owner.projectile)
		this.game.removeProjectile(this.UPID)
		this.owner.transfer(PlayerClientInterface.removeProj, this.UPID)
		this.pos = -1
		this.scope = []
		this.activated = false

		this.damage = null
		this.dur = 0
	}

	projCoolDown() {
		if (!this.activated) {
			return
		}
		//console.log("projCoolDown" + this.type + " " + this.dur)

		if (this.dur === 1) {
			this.remove()
		}
		this.dur = Util.decrement(this.dur)
	}

}

class ProjectileBuilder {
	owner: Player
	size: number
	type: string
	skillrange: number
	skill: number
	action: Function
	owneraction: Function
	damage: Util.Damage
	dur: number
	disappearWhenStep: boolean
	game: Game
	trajectorySpeed: number
	flags:Set<number>

	constructor(data: { owner: Player; size: number; type: string; skill: number }) {
		this.owner = data.owner
		this.size = data.size
		this.type = data.type
		this.skillrange = 0
		this.skill = data.skill
		this.action = function () {}
		this.owneraction = function () {}
		this.damage = new Util.Damage(0, 0, 0)
		this.dur = 0
		this.disappearWhenStep = true
		this.game
		this.trajectorySpeed = 0
		this.flags=new Set<number>()

	}
	setGame(game: Game) {
		this.game = game
		return this
	}
	setAction(action: Function) {
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
	setDamage(damage: Util.Damage) {
		this.damage = damage
		return this
	}
	setDuration(dur: number) {
		this.dur = dur
		return this
	}
	setNotDisappearWhenStep() {
		this.disappearWhenStep = false
		return this
	}
	setTrajectorySpeed(speed: number) {
		this.trajectorySpeed = speed
		return this
	}
	addFlag(flag:number){
		this.flags.add(flag)
		return this
	}
	build() {
		return new Projectile(this)
	}
}
export {Projectile,ProjectileBuilder}