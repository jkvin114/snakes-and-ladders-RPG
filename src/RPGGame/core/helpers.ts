
import { MAP } from "../MapHandlers/MapStorage"
import {Player} from '../player/player'
import { SkillTargetSelector } from "./skill"
import { EFFECT } from "../StatusEffect/enum"

//depreciated
class PlayerSelector {
	private isTeam: boolean

	private players: Player[]
	constructor(isTeam: boolean) {
		this.isTeam = isTeam

		this.players = []
	}
	addPlayer(player: Player) {
		this.players.push(player)
	}
	get(turn: number) {
		return this.players[turn]
	}
	getAll() {
		return this.players
	}

	/**
	 * 가장 앞에있는 플레이어 반환
	 */
	getFirstPlayer(): Player {
		let first: Player = this.players[0]
		for (let p of this.players) {
			if (p.pos > first.pos) {
				first = p
			}
		}
		return first
	}
	/**
	 * @return 위치가 가장 뒤면 true
	 */
	isLast(me: Player): boolean {
		let pos = me.pos
		return !this.players.some(function (p: Player) {
			return p.pos < pos
		})
	}

	/**
	 * 조건에 맟는 플레이어 플레이어 반환
	 * @param {*} me 호출하는 플레이어
	 * @param {*} range 범위, -1이면 전체범위
	 * @param {*} includeMe 자신 포함 여부
	 * @param {*} includeInvulnerable 무적플레이어 포함 여부 (Invulnerable,invisible)
	 * @param {*} includeDead 죽은플레이어 포함여부
	 * @param {*} includeMyTeam 우리팀 포함여부
	 */
	getPlayersByCondition(
		me: Player,
		range: number,
		includeMe: boolean,
		includeInvulnerable: boolean,
		includeDead: boolean,
		includeMyTeam: boolean
	): Player[] {
		let result: Player[] = this.players
		//범위가 정해져있을시
		if (range > -1) {
			let start = me.pos - range
			let end = me.pos + range

			result = result.filter((a) => a.pos >= start && a.pos <= end)
		}

		if (!includeInvulnerable) {
			result = result.filter(
				(a) => !a.invulnerable && !a.effects.has(EFFECT.INVISIBILITY) && me.mapHandler.isTargetableFrom(a)
			)
		}

		if (!includeMe) {
			result = result.filter((a) => a.turn !== me.turn)
		}
		if (!includeDead) {
			result = result.filter((a) => !a.dead)
		}
		if (!includeMyTeam && me.game.isTeam) {
			result = result.filter((a) => a.team !== me.team)
		}
		return result
	}

	getAlliesOf(turn: number) {
		if (!this.isTeam) {
			return [turn]
		} else {
			return this.players.filter((p) => p.team === this.players[turn].team).map((p) => p.turn)
		}
	}

	getAlliesOfAsPlayer(me: Player) {
		if (!this.isTeam) {
			return [me]
		} else {
			return this.players.filter((p) => p.team === me.team)
		}
		return []
	}
	/**
	 * 공격가능한 플레이어 반환
	 *@param {*} me 호출하는 플레이어
	 * @param {*} range
	 */
	getAllVaildPlayer(me: Player, range: number): Player[] {
		let start = me.pos - range
		let end = me.pos + range
		return this.players.filter(
			(a) =>
				!a.dead &&
				!a.invulnerable &&
				!a.effects.has(EFFECT.INVISIBILITY) &&
				a.pos >= start &&
				a.pos <= end &&
				a.turn !== me.turn
		)
	}
	isOpponent(turn1: number, turn2: number) {
		if (turn1 === turn2) {
			return false
		}
		//팀 없거나 다를시
		if (this.players[turn1].team !== this.players[turn2].team || !this.isTeam) {
			return true
		}
		return false
	}

	//true if it is itself or same team , false if individual game or in different team
	isValidOpponent(me: Player, other: Player) {
		//자기자신
		if (me === other) {
			return false
		}
		//무적이거나 투명화효과나 죽었을경우
		if (other.invulnerable || other.effects.has(EFFECT.INVISIBILITY) || other.dead) {
			return false
		}
		//갈림길에서 다른길
		if (!me.mapHandler.isTargetableFrom(other)) {
			return false
		}

		//팀 없거나 다를시
		if (me.team !== other.team || !me.game.isTeam) {
			return true
		}
		return false
	}

	isValidOpponentInRadius(me: Player, other: Player, rad: number): boolean {
		if (Math.abs(me.pos - other.pos) <= rad && this.isValidOpponent(me, other)) {
			return true
		}
		return false
	}
	getAllValidOpponentInRadius(me: Player, pos: number, rad: number): Player[] {
		let t = []
		for (let p of this.players) {
			if (Math.abs(pos - p.pos) <= rad && this.isValidOpponent(me, p)) {
				t.push(p)
			}
		}
		return t
	}
	/**
	 * 범위내에서 가장가까운 플레이어 반환
	 * @param {} range
	 * @param {*} includeInvulnerable
	 * @param {*} includeDead
	 */
	getNearestPlayer(me: Player, range: number, includeInvulnerable: boolean, includeDead: boolean) {
		let dist = 200
		let target = null
		for (let p of this.players) {
			if (p !== me && me.distance(me, p) < dist && me.distance(me, p) < range) {
				if (includeInvulnerable && !(!includeDead && p.dead)) {
					target = p
					dist = me.distance(me, p)
				} else if (!p.invulnerable && !p.effects.has(EFFECT.INVISIBILITY)) {
					target = p
					dist = me.distance(me, p)
				}
			}
		}
		return target
	}
	/**
	 *
	 * @param {}} start
	 * @param {*} end
	 * @returns turn list of players in range
	 */
	getPlayersIn(me: Player, start: number, end: number): number[] {
		let targets = []

		for (let p of this.getAll()) {
			if (this.isValidOpponent(me, p) && p.pos >= start && p.pos <= end) {
				targets.push(p.turn)
			}
		}
		return targets
	}
	getAlliesIn(me: Player, start: number, end: number) {
		let targets = []

		for (let p of this.getAlliesOfAsPlayer(me)) {
			if (p.pos >= start && p.pos <= end) {
				targets.push(p.turn)
			}
		}
		return targets
	}
	//========================================================================================================

	/**
	 * 스킬 전용
	 * 범위내의 공격 가능한 대상들의 턴 반환
	 * @param {*} me
	 * @param {*} selector SkillTargetSelector
	 * @return array of turns of targets, empy array if none
	 */
	getAvailableTarget(me: Player, selector: SkillTargetSelector): number[] {
		let targets = []
		// console.log(this.distance(this.players[1], this))

		for (let p of this.getAll()) {
			if (this.isValidOpponent(me, p)) {
				if (me.distance(p, me) <= selector.range) {
					targets.push(p.turn)
				} else if (selector.meetsCondition(p) && me.distance(p, me) <= selector.conditionedRange) {
					targets.push(p.turn)
				}
			}
		}

		return targets
		//target choosing
	}
}
//depreciated
class AIHelper {
	static willDiceControl(player: Player) {
		return player.diceControl && player.level < MAP.get(player.mapId).dc_limit_level
	}

	static getDiceControlDice(player: Player) {
		return 6
	}

	/**
	 *  컴퓨터 아이템 구입
	 *
	 */
	static aiStore(player: Player) {
	}

	// static async aiSkill(player: Player) {
	// 	if (player.effects.has(EFFECT.SILENT) || player.dead || player.game.gameover) {
	// 		return
	// 	}

	// 	// p.aiUseSkills()

	// 	//use ult first then w and q
	// 	for (let i = 2; i >= 0; --i) {
	// 		//let slist = ["Q", "W", "ult"]
	// 		let skillresult = player.aiSkillFinalSelection(player.initSkill(i), i)
	// 		if (!skillresult || skillresult.data === -1) {
	// 			continue
	// 		}
	// 		// if (skillresult.data === -1) {
	// 		// 	return
	// 		// }
	// 		if (skillresult.type === ENUM.AI_SKILL_RESULT_TYPE.LOCATION) {
	// 			//	console.log(skillresult)

	// 			player.game.placeSkillProjectile(skillresult.data)
	// 		} else if (skillresult.type === ENUM.AI_SKILL_RESULT_TYPE.AREA_TARGET) {
	// 			player.game.useAreaSkill(skillresult.data)
	// 		} else if (skillresult.type === ENUM.AI_SKILL_RESULT_TYPE.TARGET) {
	// 			player.game.useSkillToTarget(skillresult.data)
	// 		} else if (skillresult.type === ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET) {
	// 		}
	// 		if (!player.game.instant) {
	// 			await Util.sleep(300)
	// 		}
	// 	}
	// }

	/**
	 *  가장 앞에있는 플레이어반환
	 * 거리 5칸 내일시 가장 체력적은 플레이어
	 * @param {} players int[]
	 * return int
	 */
	static getAiTarget(me: Player, players: number[]): number {
		if (players.length === 1) {
			return players[0]
		}
		let ps = me.mediator.allPlayer()
		players.sort(function (b, a) {
			if (Math.abs(ps[a].pos - ps[b].pos) < 8) {
				return ps[b].HP - ps[a].HP
			} else {
				return ps[a].pos - ps[b].pos
			}
		})
		return players[0]


	}
	// //========================================================================================================
	// static getAiProjPos(me: Player, skilldata: any, skill: number): number {
	// 	let goal = null
	// 	let targets=me.mediator.selectAllFrom(EntityFilter.ALL_ENEMY_PLAYER(me).in(me.pos - 3 - Math.floor(skilldata.range / 2),
	// 	me.pos - 3 + Math.floor(skilldata.range / 2))).map((p)=>p.turn)


	// 	//	console.log("getAiProjPos" + targets)
	// 	if (targets.length === 0) {
	// 		return -1
	// 	}
	// 	if (targets.length === 1) {
	// 		//타겟이 1명일경우
	// 		goal = targets[0]
	// 		//속박걸렸으면 플레이어 위치 그대로
	// 		if (me.game.pOfTurn(goal).effects.has(EFFECT.STUN)) {
	// 			return Math.floor(me.game.pOfTurn(goal).pos)
	// 		}
	// 	} else {
	// 		//타겟이 여러명일경우
	// 		let ps = me.mediator.allPlayer()

	// 		//앞에있는플레이어 우선
	// 		targets.sort(function (b: number, a: number): number {
	// 			return ps[a].pos - ps[b].pos
	// 		})

	// 		//속박걸린 플레이어있으면 그 플레이어 위치 그대로
	// 		for (let t in targets) {
	// 			if (ps[t].effects.has(EFFECT.STUN)) {
	// 				return Math.floor(ps[t].pos)
	// 			}
	// 		}

	// 		goal = targets[0]
	// 	}
	// 	return Math.floor(Math.min(me.game.pOfTurn(goal).pos + 7 - skilldata.size, me.pos + skilldata.range / 2))
	// }

	// static getAiAreaPos(me: Player, skilldata: any, skill: number): number {
	// 	let goal = null
	// 	let targets=me.mediator.selectAllFrom(EntityFilter.ALL_PLAYER(me).excludeUntargetable().excludeDead().in(me.pos - 3 - Math.floor(skilldata.range / 2),
	// 	me.pos - 3 + Math.floor(skilldata.range / 2))).map((p)=>p.turn)

	// 	//	console.log("getAiProjPos" + targets)
	// 	if (targets.length === 0) {
	// 		return -1
	// 	}
	// 	if (targets.length === 1) {
	// 		//타겟이 1명일경우
	// 		goal = targets[0]
	// 		return Math.floor(me.game.pOfTurn(goal).pos - skilldata.size + 1)
	// 	} else {
	// 		//타겟이 여러명일경우
	// 		let ps = me.mediator.allPlayer()

	// 		//앞에있는플레이어 우선
	// 		targets.sort(function (b: number, a: number): number {
	// 			return ps[b].pos - ps[a].pos
	// 		})

	// 		return Math.floor(ps[0].pos - skilldata.size + 1)
	// 	}
	// }
}

export {  }
