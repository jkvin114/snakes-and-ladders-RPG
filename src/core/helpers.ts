import * as ENUM from "../data/enum"
import * as Util from "./Util"
import SETTINGS = require("../../res/globalsettings.json")
import { MAP } from "../MapHandlers/MapStorage"
import { EffectFactory, StatusEffect } from "../StatusEffect"
import { SpecialEffect } from "../data/SpecialEffectRegistry"
import {statuseffect as statuseffect } from "../../res/string_resource.json"
import {statuseffect as statuseffect_kor } from "../../res/string_resource_kor.json"

import {Player} from '../player/player'
import { EntityFilter } from "../entity/EntityFilter"
class ObstacleHelper {
	static applyObstacle(player: Player, obs: number, isForceMoved: boolean) {
		let others: string[] = []
		const pendingObsList = SETTINGS.pendingObsList
		const perma = StatusEffect.DURATION_UNTIL_LETHAL_DAMAGE
		player.mapHandler.applyObstacle(obs)
		let isGlobalEvent=false
		try {
			switch (obs) {
				case 4:
					player.doObstacleDamage(10,"trap")
					break
				case 5:
					player.inven.takeMoney(30)
					break
				case 6:
					//subway
					break
				case 7:
					player.mapHandler.nextdmg = 30
					break
				case 8:
					player.doObstacleDamage(20,"knifeslash")
					break
				case 9:
					player.heal(50)
					break
				case 10:
					player.effects.apply(ENUM.EFFECT.SILENT, 1)
					break
				case 11:
					player.resetCooltime([ENUM.SKILL.Q, ENUM.SKILL.W])
					player.cooltime[ENUM.SKILL.ULT] = Math.floor(player.cooltime[ENUM.SKILL.ULT] / 2)
					break
				case 12:
					player.effects.apply(ENUM.EFFECT.FARSIGHT, 1)
					player.effects.applySpecial(
						EffectFactory.create(ENUM.EFFECT.MAGIC_CASTLE_ADAMAGE),
						SpecialEffect.OBSTACLE.MAGIC_CASTLE_ADAMAGE.name
					)
					// player.message(player.name + ": skill range x3, additional damage 30")
					break
				case 13:
					player.effects.apply(ENUM.EFFECT.ROOT, 1)
					player.obstacleEffect("web")

					break
				case 14:
					let d = Math.floor(Math.random() * 6) + 1
					player.inven.giveMoney(d * 10)
					break
				case 15:
					let m3 = Math.floor(player.inven.money / 10)
					isGlobalEvent=true
					others=player.mediator.forEachPlayer(EntityFilter.ALL_ENEMY_PLAYER(player))(function(player){
						this.inven.giveMoney(m3)
					})
					player.inven.takeMoney(m3 * others.length)

					break
				case 16:
					player.effects.apply(ENUM.EFFECT.SLOW, 1)
					player.doObstacleDamage(20,'hit')
					break
				case 17:
					others=player.mediator.forEachPlayer(EntityFilter.ALL_ENEMY_PLAYER(player).excludeDead())(function(player){
						this.heal(20)
					})
					isGlobalEvent=true
					player.doObstacleDamage(20 * others.length,'hit')
					
					break
				case 18:

					others=player.mediator.forEachPlayer(EntityFilter.ALL_ENEMY_PLAYER(player))(function(player){
						this.inven.giveMoney(30)
					})
					isGlobalEvent=true
					player.inven.takeMoney(others.length * 30)

					break
				case 19:
					others=player.mediator.forEachPlayer(EntityFilter.VALID_MOVE_OBSTACLE_TARGET(player).inRadius(20))(function(player){
						this.game.playerForceMove(this, player.pos, true, ENUM.FORCEMOVE_TYPE.SIMPLE)
					})
					isGlobalEvent=true

					// others = player.game.playerSelector.getPlayersByCondition(player, 20, false, true, false, true)
					// for (let o of others) {
					// 	player.game.playerForceMove(o, player.pos, true, "simple")
					// }
					break
				case 20:
					let mypos=player.pos
					let target=player.mediator.selectBestOneFrom(EntityFilter.VALID_MOVE_OBSTACLE_TARGET(player).inRadius(40),true)(function(){
						return Math.abs(this.pos-mypos)
					})
					
					//if target is also on change obstacle(causes infinite loop)
					
					if (target != null && target instanceof Player) {
						if(player.game.shuffledObstacles[target.pos].obs===20 || target.pos === player.pos) break

						player.game.playerForceMove(player, target.pos, false, ENUM.FORCEMOVE_TYPE.SIMPLE)
						player.game.playerForceMove(target, mypos, true, ENUM.FORCEMOVE_TYPE.SIMPLE)
						others.push(target.UEID)
						isGlobalEvent=true
					}
					break
				case 21:
					//godhand
					break
				case 22:
					player.effects.apply(ENUM.EFFECT.ANNUITY, perma)
					break
				case 23:
					player.inven.takeMoney(30)
					player.doObstacleDamage(30,"knifeslash")
					break
				case 24:
					player.effects.resetAllHarmful()
					player.effects.apply(ENUM.EFFECT.SHIELD, 99999)
					player.effects.apply(ENUM.EFFECT.INVISIBILITY, 1)
					player.heal(70)
					break
				case 25:
					player.effects.apply(ENUM.EFFECT.SHIELD, perma)
					break
				case 26:
					player.mapHandler.nextdmg = 70
					break
				case 27:
					player.doObstacleDamage(100,"knifeslash")
					break
				case 28:
					player.effects.apply(ENUM.EFFECT.ROOT, 1)
					player.effects.apply(ENUM.EFFECT.SLOW, 2)
					player.obstacleEffect("web")

					break
				case 29:
					player.effects.apply(ENUM.EFFECT.POISON, perma)
					break
				case 30:
					player.doObstacleDamage(new Util.PercentDamage(33, Util.PercentDamage.CURR_HP).getTotal(player),"explode")
					break
				case 31:
					player.doObstacleDamage(new Util.PercentDamage(50, Util.PercentDamage.MISSING_HP).getTotal(player),"explode")
					player.effects.apply(ENUM.EFFECT.RADI, 1)
					break
				case 32:
					player.effects.apply(ENUM.EFFECT.RADI, 1)
					break
				case 33:
					// kidnap
					if (player.AI) {
						if (player.HP > 300) {
							ObstacleHelper.kidnap(player,false)
						} else {
							ObstacleHelper.kidnap(player,true)
						}
					}
					break
				case 34:
					player.effects.apply(ENUM.EFFECT.SLAVE, perma)
					break
				case 35:
					player.effects.apply(ENUM.EFFECT.ROOT, 3)
					player.effects.apply(ENUM.EFFECT.SPEED, 4)
					break
				case 36:
					if (!isForceMoved) {
						player.game.playerForceMove(player, player.lastpos, false,  ENUM.FORCEMOVE_TYPE.LEVITATE)
					}
					break
				case 37:
					//trial
					if (player.AI) {
						let d = Math.floor(Math.random() * 6) + 1
						ObstacleHelper.trial(player, d)
					}
					break
				case 38:
					//casino
					if (player.AI) {
						let d = Math.floor(Math.random() * 6) + 1
						ObstacleHelper.casino(player, d)
					}
					break
				case 39:
					player.effects.apply(ENUM.EFFECT.DOUBLEDICE, 1)
					break
				case 40:
					player.effects.apply(ENUM.EFFECT.BACKDICE, 1)
					break
				case 41:
					player.effects.apply(ENUM.EFFECT.ROOT, 1)
					player.obstacleEffect("web")
					break
				case 42:
					player.heal(50)
					break
				case 43:
					player.effects.apply(ENUM.EFFECT.POISON, 3)
					break
				case 44:
					player.doObstacleDamage(40,"knifeslash")
					break
				case 45:
					player.effects.apply(ENUM.EFFECT.BLIND, 3)
					break
				case 46:
					player.effects.apply(ENUM.EFFECT.SLOW, 1)
					player.doObstacleDamage(30,'hit')
					break
				case 48:
					break
				case 49:
					player.inven.takeMoney(20)
					player.doObstacleDamage(50,"knifeslash")

					break
				case 50:
					player.effects.apply(ENUM.EFFECT.IGNITE, 3)
					player.doObstacleDamage(30,"knifeslash")

					break
				case 51:
					player.effects.apply(ENUM.EFFECT.INVISIBILITY, 1)
					break
				case 52:
					// player.doObstacleDamage(75, "lightning")
					others=player.mediator.forEachPlayer(EntityFilter.ALL_ALIVE_PLAYER(player).excludeUntargetable().inRadius(3))(function(){
						this.doObstacleDamage(75,"lightning")
					})
					isGlobalEvent=true
					break
				case 53:
					others=player.mediator.forEachPlayer(EntityFilter.ALL_ALIVE_PLAYER(player))(function(){
						let died = this.doObstacleDamage(30,"wave")
						if (!died) {
							player.game.playerForceMove(this, this.pos - 3, true, ENUM.FORCEMOVE_TYPE.SIMPLE)
						}
					})
					isGlobalEvent=true
					break
				case 54:
					others=player.mediator.forEachPlayer(EntityFilter.VALID_MOVE_OBSTACLE_TARGET(player).inRadius(30))(function(player){
						this.game.playerForceMove(this, player.pos, true, ENUM.FORCEMOVE_TYPE.SIMPLE)
					})
					isGlobalEvent=true
					break
				case 55:
					let r = Math.floor(Math.random() * 10)
					player.game.playerForceMove(player, player.pos - 3 + r, false, ENUM.FORCEMOVE_TYPE.LEVITATE)
					player.obstacleEffect("wind")

					break
				case 56:

					let allplayers = player.mediator.selectAllFrom(EntityFilter.VALID_MOVE_OBSTACLE_TARGET(player))
					if (allplayers.length !== 0) {
						let r2 = Math.floor(Math.random() * allplayers.length)
						player.game.playerForceMove(player, allplayers[r2].pos, true,  ENUM.FORCEMOVE_TYPE.LEVITATE)
					}
					
					player.obstacleEffect("wind")

					break
				case 57:
					player.mapHandler.nextdmg = 70
					break
				case 58:
					player.doObstacleDamage(120,"explode")
					break
				case 59:
					player.effects.apply(ENUM.EFFECT.SPEED, 3)
					break
				case 60:
					player.effects.apply(ENUM.EFFECT.IGNITE, 3)
					player.doObstacleDamage(new Util.PercentDamage(25, Util.PercentDamage.MAX_HP).getTotal(player),"explode")

					break
				case 61:
					player.doObstacleDamage(175,"explode")

					break
				case 62:
					// player.inven.changeToken(10)
					// player.loanTurnLeft = 5
					break
				case 63:
					//Threaten
					break
				case 64:
					player.effects.apply(ENUM.EFFECT.PRIVATE_LOAN, 2)
					break
				case 65:
					player.inven.takeMoney(Math.floor(player.inven.money / 2))
					player.inven.changeToken(-1 * Math.floor(player.inven.token / 2))
					break
				case 66:
					player.effects.apply(ENUM.EFFECT.ANNUITY_LOTTERY, perma)
					break
				case 67: //coin store
					if (player.effects.has(ENUM.EFFECT.PRIVATE_LOAN)) {
						obs = ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
					}
					break
				case 68:
					// street_vendor
					player.goStore(1.1)
					break
				case 69:
					let m1 = 0
					player.mediator.forAllPlayer()(function(){
						m1+=this.statistics.stats[ENUM.STAT.MONEY_EARNED]
					})
					if (Math.random() > 0.93) {
						player.inven.giveMoney(m1)
						player.message(" won the lottery! earned" + m1 + "$")
					}
					
					break
				case 70:
					let m2 = 0
					others = player.mediator.forEachPlayer(EntityFilter.ALL_ENEMY_PLAYER(player))(function(){
						let m1 = this.inven.token * 2 + Math.floor(this.inven.money * 0.1)
						this.inven.takeMoney(m1)
						m2 += m1
					})
					isGlobalEvent=true
					player.inven.giveMoney(m2)
					break
				case 71:
					player.inven.thief()
					break
				case 72:
					player.effects.apply(ENUM.EFFECT.CURSE, 2)
					break
				case 73:
					player.doObstacleDamage(Math.floor(player.inven.money / 2),'hit')
					break
				case 74:
					if (!player.AI) {
						if (player.inven.money < 150 && player.inven.token < 10) {
							player.killplayer()
							// player.message("can pass only if you have\n more than 150$ or 10 tokens")
						}
					} else if (player.inven.money < 100 && player.inven.token < 10) {
						player.killplayer()
					}
			}
		} catch (e) {
			console.error(e)
			return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
		}
		if(isGlobalEvent){
			player.game.indicateGlobalObstacleEvent(obs)
		}
		//not ai, not pending obs and forcemoved, not arrive at none
		else if (!(pendingObsList.includes(obs) && isForceMoved) && obs != ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE) {
			player.game.indicateSingleObstacle(player.turn,obs)
		}


		return obs
	}


	static kidnap(player: Player, result: boolean) {
		if (result) {
			player.effects.apply(ENUM.EFFECT.ROOT, 2)
		} else {
			player.doObstacleDamage(300,"stab")

		}
	}
	static threaten(player: Player, result: boolean) {
		if (result) {
			player.inven.takeMoney(50)
		} else {
			player.inven.changeToken(-3)
		}
	}
	static trial(player: Player, num: number) {
		//console.log("trial" + num)
		switch (num) {
			case 0:
				player.inven.takeMoney(100)
				player.message(player.name + "fine 100$")
				break
			case 1:
				player.effects.apply(ENUM.EFFECT.SLAVE, StatusEffect.DURATION_UNTIL_LETHAL_DAMAGE)
				break
			case 2:

				let target=player.mediator.selectBestOneFrom(EntityFilter.VALID_MOVE_OBSTACLE_TARGET(player).inRadius(40),true)(function(){
					return Math.abs(this.pos-player.pos)
				})

				if (target !== null && target !== undefined) {
					player.game.playerForceMove(player, target.pos, true,  ENUM.FORCEMOVE_TYPE.LEVITATE)
				}
				break
			case 3:
				player.killplayer()
				player.message(player.name + " has been sentenced to death")
				break
			case 4:
				player.doObstacleDamage(Math.floor(player.HP / 2),"stab")

				player.effects.apply(ENUM.EFFECT.GROUNGING, 1)
				player.message(player.name + " will get retrial")
				break
			case 5:
				for (let p of player.mediator.allPlayer()) {
					let m = Math.random()
					if (m > 0.5) {
						p.killplayer()
					}
				}
				player.game.indicateGlobalObstacleEvent(37,"thanos")
				break
		}
	}
	//========================================================================================================

	static casino(player: Player, num: number) {
		switch (num) {
			case 0:
				player.inven.giveMoney(100)
				break
			case 1:
				player.inven.giveMoney(player.inven.money)
				break
			case 2:
				player.effects.apply(ENUM.EFFECT.SPEED, 2)
				break
			case 3:
				player.doObstacleDamage(Math.floor(player.HP / 2),"stab")

				break
			case 4:
				player.inven.takeMoney(Math.floor(player.inven.money / 2))
				break
			case 5:
				player.doObstacleDamage(50,"stab")

				player.effects.apply(ENUM.EFFECT.GROUNGING, 1)
				break
		}
	}
}

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
				(a) => !a.invulnerable && !a.effects.has(ENUM.EFFECT.INVISIBILITY) && me.mapHandler.isTargetableFrom(a)
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
				!a.effects.has(ENUM.EFFECT.INVISIBILITY) &&
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
		if (other.invulnerable || other.effects.has(ENUM.EFFECT.INVISIBILITY) || other.dead) {
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
				} else if (!p.invulnerable && !p.effects.has(ENUM.EFFECT.INVISIBILITY)) {
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
	getAvailableTarget(me: Player, selector: Util.SkillTargetSelector): number[] {
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
	// 	if (player.effects.has(ENUM.EFFECT.SILENT) || player.dead || player.game.gameover) {
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
	// 		if (me.game.pOfTurn(goal).effects.has(ENUM.EFFECT.STUN)) {
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
	// 			if (ps[t].effects.has(ENUM.EFFECT.STUN)) {
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



class SkillInfoFactory {
	static readonly LANG_ENG = 0
	static readonly LANG_KOR = 1
	private char: number
	private plyr: Player
	private names: string[]
	private lang: number
	static readonly SKILL_NAME = [
		["Scythe Strike", "Reaping Wind", "Grave Delivery"],
		["Mace Attack", "Tanut", "Strengthen"],
		["Blind Curse", "Phantom Menace", "Poison Bomb"],
		["Claw Strike", "Regeneration", "Burning at the Stake"],
		["Gunfire", "Net Trap", "Target Locked"],
		["Chain Lightning", "Burning Spellbook", "Dark Magic Circle"],
		["Tenacle Strike", "Protective Water", "Predation"],
		["Beak Attack", "Baby Birds", "Phenix Transform"],
		["Sweet Fruit", "Vine Trap", "Root Prison"]
	]
	static readonly SKILL_NAME_KOR = [
		["절단", "바람 가르기", "태풍"],
		["암흑의 철퇴", "도발", "실버의 갑옷"],
		["실명", "재빠른 이동", "죽음의 독버섯"],
		["양이의 손톱", "양이의 고민", "양이의 불"],
		["원거리 소총", "덫 함정", "저격수의 극장"],
		["직선 번개", "몸체 고정", "마법진 파티"],
		["촉수 채찍", "보호의 물", "블랙홀"],
		["날렵한 부리", "아기새 소환", "불사조 소환"],
		["달콤한 열매", "덩굴 함정", "뿌리 감옥"]
	]
	static readonly HOTKEY = ["Q", "W", "R"]

	constructor(char: number, plyr: Player, lang: number) {
		this.plyr = plyr
		this.char = char
		this.names = SkillInfoFactory.SKILL_NAME[char]
		this.lang = lang
		if (lang === SkillInfoFactory.LANG_KOR) {
			this.names = SkillInfoFactory.SKILL_NAME_KOR[char]
		}
	}
	get(){
		return [this.getQ(),this.getW(),this.getUlt()]
	}
	private hotkey(s: number) {
		return SkillInfoFactory.HOTKEY[s]
	}
	private active() {
		return "<br>" + this.chooseLang("[Active]", "[사용시]") + ": "
	}
	private passive() {
		return this.chooseLang("[Passive]", "[기본 지속 효과]") + ": "
	}
	private chooseLang<T>(eng: T, kor: T): T {
		return this.lang === SkillInfoFactory.LANG_KOR ? kor : eng
	}

	private nameTitle(s: number) {
		return `[${this.hotkey(s)}] {${this.names[s]}}  <cool>
		${this.plyr.cooltime_list[s]}${this.chooseLang(" turns", "턴")}</>${this.range(s)}<br>`
	}
	private cooltime() {
		return `<cool>${this.chooseLang("cooltime", "쿨타임")}</>`
	}
	private nameDesc(s: number) {
		return `<skill><skillimg${this.char + 1}-${s + 1}>${this.names[s]}</>`
	}
	private lowerbound(str: string) {
		return `<lowerbound>${str}</>`
	}
	private upperbound(str: string) {
		return `<upperbound>${str}</>`
	}
	private up(str: string) {
		return `<up>${str}</>`
	}
	private down(str: string) {
		return `<down>${str}</>`
	}
	private stat(str: string) {
		return `<stat>${str}</>`
	}
	private range(s: number) {
		if (this.plyr.skill_ranges[s] === 0) return ""
		return this.rangeNum(this.plyr.skill_ranges[s])
	}
	private currHp() {
		return `<currHP>${this.chooseLang(" current HP", " 현재체력")}</>`
	}
	private maxHP() {
		return `<maxHP>${this.chooseLang(" maximum HP", " 최대체력")}</>`
	}
	private missingHp() {
		return `<missingHP>${this.chooseLang(" missing HP", " 잃은체력")}</>`
	}
	private rangeNum(r: number) {
		return `<range>${this.chooseLang("Range: ", "사정거리: ")}${r} ${this.chooseLang("", "칸 ")}</>`
	}
	private rangeStr() {
		return `<range>${this.chooseLang("Range", "사정거리")}</>`
	}
	private area(s: number) {
		return `<area>${this.chooseLang(`Select ${s} Squares`, s + "칸 범위를 선택")}</>`
	}
	private mDmg(d: number | string, scaleType?: string) {
		if (scaleType == null) {
			return `<mdmg>${d}${this.chooseLang(" magic damage", "의 마법 피해")}</>`
		}
		return `<mdmg>${this.scaledValue(d,scaleType)}${this.chooseLang(" magic damage", "의 마법 피해")}</>`
	}
	private scaledValue(d: number | string,scale:string){
		return `<scale${scale}>${d}</>`
	}
	private pDmg(d: number | string, scaleType?: string) {
		if (scaleType == null) {
			return `<pdmg>${d}${this.chooseLang(" attack damage", "의 물리 피해")}</>`
		}
		return `<pdmg>${this.scaledValue(d,scaleType)}${this.chooseLang(" attack damage", "의 물리 피해")}</>`
	}
	private tDmg(d: number | string, scaleType?: string) {
		if (scaleType == null) {
			return `<tdmg>${d}${this.chooseLang(" fixed damage", "의 고정 피해")}</>`
		}
		return `<tdmg>${this.scaledValue(d,scaleType)}${this.chooseLang(" fixed damage", "의 고정 피해")}</>`
	}

	private baseDmg(s: number) {
		return this.plyr.getSkillBaseDamage(s)
	}
	private heal(amt: number, scaleType?: string) {
		if (scaleType == null) {
			let txt = `<heal>${amt}</>`
			return this.chooseLang("heals " + txt + " HP", txt + "의 체력을 회복")
		}

		let txt = `<heal>${this.scaledValue(amt,scaleType)}</>`
		return this.chooseLang(`heals ${txt} HP`, `${txt}의 체력을 회복`)
	}
	private money(amt: number) {
		return `<money>${amt + this.chooseLang("$", "원")}</>`
	}
	private shield(amt: number, scaleType?: string) {
		if (scaleType == null) {
			let txt = `<shield>${amt}</>`
			return this.chooseLang("gains " + txt + " shield", txt + "의 보호막 획득")
		}
		let txt = `<shield>${this.scaledValue(amt,scaleType)}</>`

		return this.chooseLang(`gains ${txt} shield`, `${txt}의 보호막 획득`)
	}
	private skillAmt(key: string): number {
		return this.plyr.getSkillAmount(key)
	}
	private proj(name: string) {
		return this.chooseLang(`<proj>Places </> a ${name}`, `${name} <proj>설치</>`)
	}
	private projsize(size: number) {
		return `<projsize>${this.chooseLang(` size ${size}`, `${size}칸 크기 `)}</>`
	}
	// projsizeStr(size:number){
	// 	return `<projsize>${this.chooseLang("Size of","")}${size}${this.chooseLang("","칸 크기")} </>`
	// }
	private getEffectHeader(e: number) {
		let str = this.chooseLang(statuseffect[e], statuseffect_kor[e])
		try {
			if (str[0] === "{") {
				let name = str.match(/\{(.+)\}/)
				return `<badeffect${e}>` + name[1]
			} else {
				let name = str.match(/\[(.+)\]/)

				return `<goodeffect${e}>` + name[1]
			}
		} catch (e) {
			console.error(e)
			return ""
		}
	}
	private effectNoDur(e: number) {
		return this.getEffectHeader(e) + "</>"
	}
	private effect(e: number, dur: number) {
		return this.chooseLang(this.effectEng(e, dur), this.effectKor(e, dur))
	}
	private effectEng(e: number, dur: number) {
		return `${this.getEffectHeader(e)} ${dur} ${dur > 1 ? "turns" : "turn"} </>`
	}
	private effectKor(e: number, dur: number) {
		return `${this.getEffectHeader(e)} ${dur} 턴</>`
	}
	private duration(d: number) {
		return `<duration>${d}${this.chooseLang(d > 1 ? " turns" : " turn", "턴")}</>`
	}
	private radius(r: number) {
		return `<radius>${this.chooseLang(`within ${r} squares`, `반경 ${r}칸 이내`)}</>`
	}
	private radiusStr(r: string) {
		return `<radius>${this.chooseLang(`within ${r} squares`, `반경 ${r}칸 이내`)}</>`
	}
	private basicattack() {
		return `<basicattack>${this.chooseLang(`basic attack`, `기본 공격`)}</>`
	}
	private target() {
		return `<target>${this.chooseLang(`target`, `대상`)}</>`
	}
	private emp(s: string) {
		return `<emp>` + s + "</>"
	}
	private getQ() {
		if (this.lang === SkillInfoFactory.LANG_KOR) return this.getQKor()

		let str
		const s = 0
		const hotkey = this.hotkey(s)
		switch (this.char) {
			case 1:
				str =
					this.nameTitle(s) +
					`
				Deals ${this.mDmg(this.baseDmg(s), hotkey)} to a ${this.target()} and ${this.heal(this.skillAmt("qheal"))}
				, If the target has ${this.emp("mark")} of ${this.nameDesc(ENUM.SKILL.W)}, ${this.rangeNum(this.skillAmt("w_qrange"))}
				and deals additional ${this.tDmg(this.skillAmt("w_qdamage"), "w_qdamage")}`
				break
			case 0:
				str =
					this.nameTitle(s) +
					`Deals ${this.pDmg(this.baseDmg(s), hotkey)} to a ${this.target()}.  
				.Can use ${this.emp("two times")}, On second use, deals ${this.down("half")} of the damage`
				break
			case 2:
				str =
					this.nameTitle(s) +
					`Deals ${this.mDmg(this.baseDmg(s), hotkey)} to a ${this.target()} , applies ${this.effect(ENUM.EFFECT.BLIND, 1)}`
				break
			case 3:
				str =
					this.nameTitle(s) +
					`deals ${this.pDmg(this.baseDmg(s), hotkey)} to enemies ${this.radius(4)}.
				( Damage decreases if there are multiple targets. You ${this.down("spend 5%")} of ${this.currHp()},`
				break
			case 4:
				str =
					this.nameTitle(s) +
				`Fires a gun and deals ${this.pDmg(this.baseDmg(s), hotkey)} to a ${this.target()},If the target has ${this.effectNoDur(ENUM.EFFECT.ROOT)} or ${this.effectNoDur(ENUM.EFFECT.GROUNGING)}
				effect, gets back ${ this.emp("2 turns of ")+"" + this.cooltime()+" for "+this.nameDesc(s)}`
				break
			case 5:
				str =
					this.nameTitle(s) +
					`Deals ${this.mDmg(this.baseDmg(s), hotkey)} to all players ${this.radiusStr(`front ${this.skillAmt("qrange_start")}~${this.skillAmt("qrange_end_front")},
				back ${this.skillAmt("qrange_start")}~${this.skillAmt("qrange_end_back")}`)} 
				`
				break
			case 6:
				str =
					this.nameTitle(s) +
					`${this.proj("tenacle")} of ${this.projsize(2)},
				 deals ${this.mDmg(this.baseDmg(s), hotkey)} to enemy who step on it`
				break
			case 7:
				str =
					this.nameTitle(s) +`Deals 
				${this.mDmg(this.baseDmg(s), hotkey)} to a ${this.target() } and take away ${this.money(20)}.`
				break
			case 8:
				str =
					this.nameTitle(s) +
					this.passive() +
					`If HP is ${this.lowerbound("lower than 40%")}, transforms to ${this.emp("Withered Tree")}, 
				On ${this.emp("Withered Tree")} state, you can\`t heal ally with ${this.nameDesc(s)}, but 
				 ${this.stat("damage absorbtion")} ${this.up("35% increases")} ` +
					this.active() +
					this.area(3) +
					`.  Deals ${this.mDmg(this.baseDmg(s), hotkey)} to enemies inside. For allies, ${this.heal(this.skillAmt("qheal"), "qheal")}
					and ${this.shield(this.skillAmt("qshield"), "qshield")}`
				break
			default:
				str = ""
		}
		return str
	}
	private getQKor() {
		let str
		const s = 0
		const hotkey = this.hotkey(s)
		switch (this.char) {
			case 1:
				str =
					this.nameTitle(s) +
					`
				사용시 ${this.target()}에게 ${this.mDmg(this.baseDmg(s), hotkey)}를 입힌 후 ${this.heal(this.skillAmt("qheal"))}
				, <br>${this.nameDesc(1)} ${this.emp("표식")}이 있는 상대에게는 ${this.rangeNum(this.skillAmt("w_qrange"))}
				${this.tDmg(this.skillAmt("w_qdamage"), "w_qdamage")}를 추가로 입힘`
				break
			case 0:
				str =
					this.nameTitle(s) +
					`${this.target()}에게 ${this.pDmg(this.baseDmg(s), hotkey)}를 입힘
				.${this.emp("두 번")} 시전 가능, 두번째 사용시 ${this.down("50%의 피해")}를 입힘`
				break
			case 2:
				str =
					this.nameTitle(s) +
					this.target() +
					`에게 ${this.mDmg(this.baseDmg(s), hotkey)}를 입히고 ${this.effect(ENUM.EFFECT.BLIND, 1)} 부여`
				break
			case 3:
				str =
					this.nameTitle(s) +
					this.radius(4) +
					`의 적에게 ${this.pDmg(this.baseDmg(s), hotkey)}를 입힘
				(${this.currHp()}의 ${this.down("5% 소모")},
				대상이 2명 이상이면 피해량 감소`
				break
			case 4:
				str =
					this.nameTitle(s) +
					this.target() +
					`에게 총을 발사해 
				${this.pDmg(this.baseDmg(s), hotkey)}를 입힘, ${this.effectNoDur(ENUM.EFFECT.ROOT)} 혹은 ${this.effectNoDur(ENUM.EFFECT.GROUNGING)}
				상태인 대상 적중 시 ${this.nameDesc(s) + "" + this.cooltime() + this.emp(" 2턴")}을 돌려받음`
				break
			case 5:
				str =
					this.nameTitle(s) +
					`사용시 ${this.radiusStr(`앞 ${this.skillAmt("qrange_start")}~${this.skillAmt("qrange_end_front")},
				뒤 ${this.skillAmt("qrange_start")}~${this.skillAmt("qrange_end_back")}`)} 
				대상들에게 ${this.mDmg(this.baseDmg(s), hotkey)}를 입힘"`
				break
			case 6:
				str =
					this.nameTitle(s) +
					this.projsize(2) +
					`의 ${this.proj("촉수")}해
				 밟은 적에게 ${this.mDmg(this.baseDmg(s), hotkey)}를 입힘`
				break
			case 7:
				str =
					this.nameTitle(s) +
					this.target() +
					`을 공격해
				${this.mDmg(this.baseDmg(s), hotkey)}를 입히고 ${this.money(20)}을 빼앗음.`
				break
			case 8:
				str =
					this.nameTitle(s) +
					this.passive() +
					`체력이 ${this.lowerbound("40% 미만")}이면 ${this.emp("시든 나무")} 상태 돌입, 
				${this.emp("시든 나무")} 상태에선 ${this.nameDesc(s)} 로 아군 회복이 불가하지만
				 ${this.stat("모든 피해 흡혈")}이 ${this.up("35% 증가")}함` +
					this.active() +
					this.area(3) +
					`해 그 안에 있는 적들에게 
				${this.mDmg(this.baseDmg(s), hotkey)}를 입히고
				 아군은 ${this.heal(this.skillAmt("qheal"), "qheal")}시키고 ${this.shield(this.skillAmt("qshield"), "qshield")}`
				break
			default:
				str = ""
		}
		return str
	}
	private getW() {
		if (this.lang === SkillInfoFactory.LANG_KOR) return this.getWKor()
		let str
		const s = 1
		const hotkey = this.hotkey(s)

		switch (this.char) {
			case 0:
				str =
					this.nameTitle(s) +
					`${this.proj("Wind")} with ${this.projsize(3)} that blows away enemies who step on it by ${this.down("4 squares backwards")}`
				break
			case 1:
				str =
					this.nameTitle(s) +
					`Leaves a ${this.emp("mark")} to a ${this.target()} and applies ${this.effect(ENUM.EFFECT.CURSE, 1)}`
				break
			case 2:
				str =
					this.nameTitle(s) +
					this.passive() +`If you have`+
					this.effectNoDur(ENUM.EFFECT.INVISIBILITY) +
					` effect, deals additional (30% of target\`s ${this.missingHp()}) ${this.mDmg("")} for ${this.nameDesc(ENUM.SKILL.Q)}.
				 ${this.active()} Receives ${this.effect(
						ENUM.EFFECT.INVISIBILITY,
						1
					)}.`
				break
			case 3:
				str =
					this.nameTitle(s) +
					this.passive() +
					` ${this.up("Movement speed +1")} if you are in behind of all players
				${this.active()}${this.heal(this.skillAmt("wheal")*3, "wheal")} total for ${this.duration(3)} ,
				 receives ${this.effectNoDur(ENUM.EFFECT.SLOW)} effect while healing.`
				break
			case 4:
				str =
					this.nameTitle(s) +
					` ${this.proj("trap")} of ${this.projsize(3) } that applies ${this.effect(ENUM.EFFECT.GROUNGING, 1)}
					 to the enemy who steps on it`
				break
			case 5:
				str =
					this.nameTitle(s) +
					` ${this.rangeStr()} of ${
						this.nameDesc(0) + " and " + this.nameDesc(2)
					} ${this.up("doubles")}, after gaining ${this.effect(ENUM.EFFECT.ROOT, 1)}.
				 Applies ${this.effect(
						ENUM.EFFECT.IGNITE,
						2
					)} if you use ${this.nameDesc(0)}. It damages targets by ${this.scaledValue(this.emp(String(this.baseDmg(1)))+"%",hotkey)} of ${this.maxHP()} as ${this.tDmg("")} for every player turn,`
				break
			case 6:
				str =
					this.nameTitle(s) +
					`Deals ${this.mDmg(this.baseDmg(s), hotkey)} and applies ${this.effect(ENUM.EFFECT.SLOW,1)} to enemies ${this.radius(3)}.
				 and you ${this.shield(this.skillAmt("wshield"), "wshield")}`
				break
			case 7:
				str =
					this.nameTitle(s) +
					`${this.emp("Duration")}: ${this.duration(2)}, Receives ${this.effect(
						ENUM.EFFECT.SPEED,
						1
					)} on use. 
				 ${this.basicattack()} deals additional ${this.mDmg(this.skillAmt("w_aa_adamage"), "w_aa_adamage")}, 
				 ${this.nameDesc(0)} deals additional ${this.mDmg(this.skillAmt("w_q_adamage"), "w_q_adamage")}
				 and applies ${this.effect(ENUM.EFFECT.ROOT, 1)} `
				break
			case 8:
				str =
					this.nameTitle(s) +
					`${this.proj("vine")} of ${this.projsize(1)} that ${this.emp("stops")} player who passes it,
				  allies will receive ${this.effect(ENUM.EFFECT.SPEED, 1)}`
				break
			default:
				return ""
		}
		return str
	}
	private getWKor() {
		let str
		const s = 1
		const hotkey = this.hotkey(s)
		switch (this.char) {
			case 0:
				str =
					this.nameTitle(s) +
					`,맞은 적을 ${this.down("4칸 뒤로")} 이동시키는 ${this.projsize(3)}의 ${this.proj("토네이도")}`
				break
			case 1:
				str =
					this.nameTitle(s) +
					`사용시 ${this.target()}에게 ${this.emp("표식")}을 남기고 ${this.effect(ENUM.EFFECT.CURSE, 1)} 부여`
				break
			case 2:
				str =
					this.nameTitle(s) +
					this.passive() +
					this.effectNoDur(ENUM.EFFECT.INVISIBILITY) +
					` 상태에서 ${this.nameDesc(ENUM.SKILL.Q)}사용시 
				대상의 ${this.missingHp()}의 ${this.mDmg("30%")}를 추가로 입힘 ${this.active()}${this.effect(
						ENUM.EFFECT.INVISIBILITY,
						1
					)}.`
				break
			case 3:
				str =
					this.nameTitle(s) +
					this.passive() +
					`모든 상대보다 뒤쳐져 있으면 ${this.up("이동 속도 +1")}
				${this.active()}${this.duration(3)}에 걸쳐 ${this.heal(this.skillAmt("wheal")*3, "wheal")},
				 회복 중엔 ${this.effectNoDur(ENUM.EFFECT.SLOW)}에 걸림.`
				break
			case 4:
				str =
					this.nameTitle(s) +
					this.projsize(3) +
					`의 ${this.proj("덫")}해
				 밟은 적에게 ${this.effect(ENUM.EFFECT.GROUNGING, 1)} 부여`
				break
			case 5:
				str =
					this.nameTitle(s) +
					`사용시 ${this.effect(ENUM.EFFECT.ROOT, 1)} 후 ${
						this.nameDesc(0) + " 와 " + this.nameDesc(2)
					}의 ${this.rangeStr()}  ${this.up("2배 증가")},
				${this.nameDesc(0)} 사용시 적중한 적에게 ${this.effect(
						ENUM.EFFECT.IGNITE,
						2
					)}을 부여해 매 플레이어 턴마다 ${this.maxHP()}의 ${this.tDmg(this.scaledValue(this.baseDmg(1),hotkey)+"%")} 를 입힘`
				break
			case 6:
				str =
					this.nameTitle(s) +
					this.radius(3) +
					`의 적에게 ${this.mDmg(this.baseDmg(s), hotkey)}를
				 입히고 ${this.effect(ENUM.EFFECT.SLOW,1)} 부여. 자신은 ${this.shield(this.skillAmt("wshield"), "wshield")}`
				break
			case 7:
				str =
					this.nameTitle(s) +
					`${this.emp("지속시간")}: ${this.duration(2)}, 사용시 ${this.effect(
						ENUM.EFFECT.SPEED,
						1
					)}을 받고, 지속시간 중에 
				${this.basicattack()}시 ${this.mDmg(this.skillAmt("w_aa_adamage"), "w_aa_adamage")},
				 ${this.nameDesc(0)} 사용시 ${this.mDmg(this.skillAmt("w_q_adamage"), "w_q_adamage")}
				 를 추가로 입히고 ${this.effect(ENUM.EFFECT.ROOT, 1)} `
				break
			case 8:
				str =
					this.nameTitle(s) +
					`지나가는 플레이어를 ${this.emp("멈추는")} ${this.projsize(1)}의 ${this.proj("덩굴")},
				 덩굴에 걸린 플레이어는 해당 칸의 효과를 받음, 아군은 ${this.effect(ENUM.EFFECT.SPEED, 1)} 부여`
				break
			default:
				return ""
		}
		return str
	}
	private getUlt() {
		if (this.lang === SkillInfoFactory.LANG_KOR) return this.getUltKor()
		let str
		const s = 2
		const hotkey = this.hotkey(s)

		switch (this.char) {
			case 0:
				str =
					this.nameTitle(s) +
					`${this.emp("Teleports")} to a  ${this.target()} and deals ${this.pDmg(this.baseDmg(s), hotkey)}.
				Damage decreases by 30% if the target is ${this.emp("in front")} of you.`
				break
			case 1:
				str =
					this.nameTitle(s) +
					this.passive() +
					`${this.stat("Attack and magic resistance")} ${this.up("increases by 0~60")} based on your ${this.missingHp()} 
				${this.active()} For ${this.duration(4)},  ${this.stat("Attack and magic resistance")} ${this.up(
						"increases by " + this.skillAmt("r_resistance")
					)}, ${this.shield(this.skillAmt("rshield"),"rshield")},and heal amount of ${this.nameDesc(ENUM.SKILL.Q)} ${this.up("doubles")}`
				break
			case 2:
				str =
					this.nameTitle(s) +
					`${this.proj("Poison bomb")} of ${this.projsize(4)}. Enemy who step on it gets
				${this.effectNoDur(ENUM.EFFECT.SLOW)} and receives ${this.mDmg(this.baseDmg(s) * 3,hotkey)} for ${this.duration(3)}. `
				break
			case 3:
				str =
					this.nameTitle(s) +
					`Deals ${this.pDmg(this.baseDmg(s) + `(+ 50% of target\s ${this.missingHp()})`, hotkey)} to a ${this.target()}.
					${this.cooltime()} of ${this.nameDesc(s)} ${this.emp("resets")} if you killed the enemy.`
				break
			case 4:
				str =
					this.nameTitle(s) +
					
					` Selects a ${this.target()}, Automatically attacks the target ${this.emp("3 times")} for ${this.duration(3)}, 
					dealing ${this.pDmg(this.baseDmg(s), hotkey)} each 
				(Deals ${this.tDmg(this.baseDmg(s))} for 3rd attack, can\`t move while shooting)<br>
				After use, you gains ${this.effect(ENUM.EFFECT.DOUBLEDICE, 1)}.`
				break
			case 5:
				str =
					this.nameTitle(s) +
					`${this.proj("Magic circle")} of ${this.projsize(3)} that deals ${this.mDmg(this.baseDmg(s), hotkey)} and applies 
				${this.effect(ENUM.EFFECT.SILENT, 1)} to enemy who step on it. Can use ${this.emp("3 times")}.`
				break
			case 6:
				str =
					this.nameTitle(s) +
					`Deals ${this.tDmg(this.baseDmg(s), hotkey)} to a ${this.target()},
				Your ${this.maxHP() + this.up("increases by 50")} if you killed the target.`
				break
			case 7:
				str =
					this.nameTitle(s) +
					`${this.emp("Duration")}: ${this.duration(4)}, ${this.stat("Basic attack range")} ${this.up("+2")}, 
				${this.basicattack()} deals additional ${this.pDmg(this.skillAmt("r_aa_adamage"), "r_aa_adamage")}.
				 Additional damage of ${this.nameDesc(1)} ${this.up("doubles")}, and 
				 ${this.nameDesc(0)} creates an area of ${this.projsize(3)}. If enemy step on it,
				  they receive ${this.effect(ENUM.EFFECT.IGNITE, 2)}`
				break
			case 8:
				str =
					this.nameTitle(s) +
					this.passive() +
					`Summons ${this.emp("Plant monster")} on every skill use.
				${this.emp("Plant monster")} lives for ${this.duration(this.skillAmt("plant_lifespan"))} and deals 
				${this.mDmg(this.skillAmt("plantdamage"), "plantdamage")} to enemies ${this.radius(
						1
					)}. Enemy ${this.basicattack()} will kill the ${this.emp("Plant monster")}s.` +
					this.active() +
					` Deals ${this.mDmg(this.baseDmg(s), hotkey)} to a ${this.target()} and applies 
				 ${this.effect(ENUM.EFFECT.ROOT, 1)}.(2 turns if you are ${this.emp("Withered Tree")} state)
				,and increases all incoming damage by ${this.up("20%")},
				 Also, all ${this.emp("Plant monster")}s move toward a target.`
				break
			default:
				return ""
		}
		return str
	}
	private getUltKor() {
		let str
		const s = 2
		const hotkey = this.hotkey(s)
		switch (this.char) {
			case 0:
				str =
					this.nameTitle(s) +
					`사용시 ${this.target()}에게 ${this.emp("즉시 이동")}해 ${this.pDmg(this.baseDmg(s), hotkey)}를 입힘.
				자신보다 ${this.emp("앞에 있는 상대")}에게는 70%의 피해를 입힘`
				break
			case 1:
				str =
					this.nameTitle(s) +
					this.passive() +
					this.missingHp() +
					`에 비례해 ${this.stat("방어력과 마법저항력")} ${this.up("0~60 증가")} 
				${this.active()} ${this.duration(4)}간  ${this.stat("방어력과 마법저항력")}이 ${this.up(
						"+" + this.skillAmt("r_resistance")
					)},
				${this.shield(this.skillAmt("rshield"),"rshield")}, ${this.nameDesc(ENUM.SKILL.Q)} ${this.up("회복량 2배")}`
				break
			case 2:
				str =
					this.nameTitle(s) +
					this.projsize(4) +
					`의 ${this.proj("독버섯")}. 밟은 적은 ${this.duration(3)}에 걸쳐 
				${this.effectNoDur(ENUM.EFFECT.SLOW)}에 걸리고 ${this.mDmg(this.baseDmg(s) * 3, hotkey)}를 받음`
				break
			case 3:
				str =
					this.nameTitle(s) +
					this.target() +
					`에게 ${this.pDmg(this.baseDmg(s) + `+ 대상 ${this.missingHp()}의 50%`, hotkey)}를 입힘,
				대상 처치시${this.nameDesc(s)} ${this.cooltime()} ${this.emp("초기화")}`
				break
			case 4:
				str =
					this.nameTitle(s) +
					this.target() +
					` 고정 후 ${this.duration(3)} 동안 ${this.emp("최대 3번")}
				 발사해 각각${this.pDmg(this.baseDmg(s), hotkey)}를 입힘
				(3번째에는 ${this.tDmg(this.baseDmg(s))}를 입힘, 사용중에는 움직일 수 없음)<br>
				발사 후에는 ${this.effect(ENUM.EFFECT.DOUBLEDICE, 1)}을 받음`
				break
			case 5:
				str =
					this.nameTitle(s) +
					this.projsize(3) +
					`의 ${this.proj("번개")}, 밟은 적은 ${this.mDmg(this.baseDmg(s), hotkey)}를 받고
				${this.effect(ENUM.EFFECT.SILENT, 1)} 부여. ${this.emp("총 3번")} 시전할 수 있음`
				break
			case 6:
				str =
					this.nameTitle(s) +
					this.target() +
					`에게 ${this.tDmg(this.baseDmg(s), hotkey)}를 입힘,
				대상 처치시 ${this.maxHP() + this.up("50 증가")}`
				break
			case 7:
				str =
					this.nameTitle(s) +
					`${this.emp("지속시간")}: ${this.duration(4)}, 지속시간 중에 
					${this.stat("기본공격 사거리")}가 ${this.up("2 증가")}하고 ${this.basicattack()}시 
				${this.pDmg(this.skillAmt("r_aa_adamage"), "r_aa_adamage")}를 추가로 입힘.
				 또한 ${this.nameDesc(1)}의 추가 피해가 ${this.up("2 배 증가")}하고
				 ${this.nameDesc(0)} 적중 시 밟은 적에게 ${this.effect(ENUM.EFFECT.IGNITE, 2)}
				 을 주는 ${this.projsize(3)}의 영역을 그 자리에 생성함`
				break
			case 8:
				str =
					this.nameTitle(s) +
					this.passive() +
					`스킬 사용시 사용한 자리에 ${this.emp("식충식물")} 소환, <br>
				${this.emp("식충식물")}은 ${this.duration(this.skillAmt("plant_lifespan"))}간 유지되며 매 턴마다 ${this.radius(
						1
					)}의 적에게
				 ${this.mDmg(this.skillAmt("plantdamage"), "plantdamage")}를 입히고 적이 ${this.basicattack()}시 사라짐` +
					this.active() +
					`${this.target()}에게 ${this.mDmg(this.baseDmg(s), hotkey)}를 입히고
				 ${this.effect(ENUM.EFFECT.ROOT, 1)}.(${this.emp("시든 나무")} 상태이면 2턴)
				,또한 이 상태에서 아군이 가하는 피해 ${this.up("20% 증가")},
				 이때 맵에 있는 모든 ${this.emp("식충식물")}이 대상 주변으로 이동됨`
				break
			default:
				return ""
		}
		return str
	}
}

export { ObstacleHelper,   SkillInfoFactory }
