import { Player } from "./player"
import * as ENUM from "./enum"
import * as Util from "./Util"
import SETTINGS = require("../res/globalsettings.json")
import { PlayerClientInterface } from "./app"
import { MAP } from "./Game"
import { items as ItemList } from "../res/item.json"
import PlayerInventory from "./PlayerInventory"
import { EffectFactory, StatusEffect } from "./StatusEffect"
import { SpecialEffect } from "./SpecialEffect"
import { Entity } from "./Entity"
import { statuseffect_kor,statuseffect} from "../res/string_resource.json"


class ObstacleHelper {
	static applyObstacle(player: Player, obs: number, isForceMoved: boolean) {
		let others: Player[] = []
		const pendingObsList = SETTINGS.pendingObsList
		const perma = StatusEffect.DURATION_UNTIL_LETHAL_DAMAGE
		try {
			switch (obs) {
				case 4:
					player.doObstacleDamage(10, "trap")
					break
				case 5:
					player.inven.takeMoney(30)
					break
				case 6:
					player.mapdata.enterSubwayNormal()
					//subway
					break
				case 7:
					player.mapdata.nextdmg = 30
					break
				case 8:
					player.doObstacleDamage(20, "knifeslash")
					break
				case 9:
					player.heal(50)
					break
				case 10:
					player.effects.apply(ENUM.EFFECT.SILENT, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 11:
					player.resetCooltime([ENUM.SKILL.Q, ENUM.SKILL.W])
					player.cooltime[ENUM.SKILL.ULT] = Math.floor(player.cooltime[ENUM.SKILL.ULT] / 2)
					break
				case 12:
					player.effects.apply(ENUM.EFFECT.FARSIGHT, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					player.effects.applySpecial(
						EffectFactory.create(ENUM.EFFECT.MAGIC_CASTLE_ADAMAGE),
						SpecialEffect.OBSTACLE.MAGIC_CASTLE_ADAMAGE.name
					)
					// player.message(player.name + ": skill range x3, additional damage 30")
					break
				case 13:
					player.effects.apply(ENUM.EFFECT.STUN, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 14:
					let d = Math.floor(Math.random() * 6) + 1
					player.inven.giveMoney(d * 10)
					break
				case 15:
					let m3 = Math.floor(player.inven.money / 10)
					others = player.game.playerSelector.getPlayersByCondition(player, -1, false, true, true, false)
					player.inven.takeMoney(m3 * others.length)
					for (let o of others) {
						o.inven.giveMoney(m3)
					}

					break
				case 16:
					player.effects.apply(ENUM.EFFECT.SLOW, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					player.doObstacleDamage(20, "hit")
					break
				case 17:
					others = player.game.playerSelector.getPlayersByCondition(player, -1, false, true, false, false)
					player.doObstacleDamage(20 * others.length, "hit")
					for (let o of others) {
						o.heal(20)
					}
					break
				case 18:
					others = player.game.playerSelector.getPlayersByCondition(player, -1, false, true, true, false)
					player.inven.takeMoney(30 * others.length)
					for (let o of others) {
						o.inven.giveMoney(30)
					}
					break
				case 19:
					others = player.game.playerSelector.getPlayersByCondition(player, 20, false, true, false, true)
					for (let o of others) {
						player.game.playerForceMove(o, player.pos, true, "simple")
					}
					break
				case 20:
					// if (isForceMoved) {
					// 	return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
					// }
					let target = player.game.playerSelector.getNearestPlayer(player, 40, true, false)
					if (target != null && target.pos != player.pos) {
						let pos = player.pos
						player.game.playerForceMove(player, target.pos, false, "simple")
						player.game.playerForceMove(target, pos, true, "simple")
						others.push(target)
					}
					break
				case 21:
					//godhand
					break
				case 22:
					player.effects.apply(ENUM.EFFECT.ANNUITY, perma, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 23:
					player.inven.takeMoney(30)
					player.doObstacleDamage(30, "knifeslash")
					break
				case 24:
					player.effects.resetAllHarmful()
					player.effects.apply(ENUM.EFFECT.SHIELD, 99999, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					player.effects.apply(ENUM.EFFECT.INVISIBILITY, 1, ENUM.EFFECT_TIMING.TURN_START)
					player.heal(70)
					break
				case 25:
					player.effects.apply(ENUM.EFFECT.SHIELD, perma, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 26:
					player.mapdata.nextdmg = 70
					break
				case 27:
					player.doObstacleDamage(100, "knifeslash")
					break
				case 28:
					player.effects.apply(ENUM.EFFECT.STUN, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					player.effects.apply(ENUM.EFFECT.SLOW, 2, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 29:
					player.effects.apply(ENUM.EFFECT.POISON, perma, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 30:
					player.doObstacleDamage(new Util.PercentDamage(33, Util.PercentDamage.CURR_HP).getTotal(player), "explode")
					break
				case 31:
					player.doObstacleDamage(new Util.PercentDamage(50, Util.PercentDamage.MISSING_HP).getTotal(player), "explode")
					player.effects.apply(ENUM.EFFECT.RADI, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 32:
					player.effects.apply(ENUM.EFFECT.RADI, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 33:
					// kidnap
					if (player.AI) {
						if (player.HP > 300) {
							player.doObstacleDamage(300, "stab")
						} else {
							player.effects.apply(ENUM.EFFECT.STUN, 2, ENUM.EFFECT_TIMING.BEFORE_SKILL)
						}
					}
					break
				case 34:
					player.effects.apply(ENUM.EFFECT.SLAVE, perma, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 35:
					player.effects.apply(ENUM.EFFECT.STUN, 3, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					player.effects.apply(ENUM.EFFECT.SPEED, 4, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 36:
					if (!isForceMoved) {
						player.game.playerForceMove(player, player.lastpos, false, "levitate")
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
					player.effects.apply(ENUM.EFFECT.DOUBLEDICE, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 40:
					player.effects.apply(ENUM.EFFECT.BACKDICE, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 41:
					player.effects.apply(ENUM.EFFECT.STUN, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 42:
					player.heal(50)
					break
				case 43:
					player.effects.apply(ENUM.EFFECT.POISON, 3, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 44:
					player.doObstacleDamage(40, "knifeslash")
					break
				case 45:
					player.effects.apply(ENUM.EFFECT.BLIND, 3, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 46:
					player.effects.apply(ENUM.EFFECT.SLOW, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					player.doObstacleDamage(30, "hit")
					break
				case 48:
					break
				case 49:
					player.inven.takeMoney(20)
					player.doObstacleDamage(50, "knifeslash")
					break
				case 50:
					player.effects.apply(ENUM.EFFECT.IGNITE, 3, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					player.doObstacleDamage(30, "knifeslash")
					break
				case 51:
					player.effects.apply(ENUM.EFFECT.INVISIBILITY, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 52:
					player.doObstacleDamage(75, "lightning")
					others = player.game.playerSelector.getPlayersByCondition(player, 3, false, false, false, true)
					for (let p of others) {
						p.doObstacleDamage(75, "lightning")
					}
					break
				case 53:
					let died = player.doObstacleDamage(30, "wave")
					if (!died) {
						player.game.playerForceMove(player, player.pos - 3, false, "simple")
					}

					others = player.game.playerSelector.getPlayersByCondition(player, -1, false, false, false, true)
					for (let p of others) {
						let died = p.doObstacleDamage(30, "wave")
						if (!died) {
							player.game.playerForceMove(p, p.pos - 3, false, "simple")
						}
					}
					break
				case 54:
					others = player.game.playerSelector.getPlayersByCondition(player, 20, false, false, false, true)

					for (let o of others) {
						player.game.playerForceMove(o, player.pos, true, "simple")
					}
					break
				case 55:
					let r = Math.floor(Math.random() * 10)
					player.game.playerForceMove(player, player.pos - 3 + r, false, "levitate")
					break
				case 56:
					let allplayers = player.game.playerSelector.getPlayersByCondition(player, 30, false, true, false, true)
					if (allplayers.length !== 0) {
						let r2 = Math.floor(Math.random() * allplayers.length)
						player.game.playerForceMove(player, allplayers[r2].pos, true, "levitate")
					}
					break
				case 57:
					player.mapdata.nextdmg = 70
					break
				case 58:
					player.doObstacleDamage(120, "explode")
					break
				case 59:
					player.effects.apply(ENUM.EFFECT.SPEED, 3, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 60:
					player.effects.apply(ENUM.EFFECT.IGNITE, 3, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					player.doObstacleDamage(new Util.PercentDamage(25, Util.PercentDamage.MAX_HP).getTotal(player), "explode")
					break
				case 61:
					player.doObstacleDamage(175, "explode")
					break
				case 62:
					// player.inven.changeToken(10)
					// player.loanTurnLeft = 5
					break
				case 63:
					//Threaten
					break
				case 64:
					player.effects.apply(ENUM.EFFECT.PRIVATE_LOAN, 2, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 65:
					player.inven.takeMoney(Math.floor(player.inven.money / 2))
					player.inven.changeToken(-1 * Math.floor(player.inven.token / 2))
					break
				case 66:
					player.effects.apply(ENUM.EFFECT.ANNUITY_LOTTERY, perma, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 67: //coin store
					if (player.effects.has(ENUM.EFFECT.PRIVATE_LOAN)) {
						obs = ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
					}
					break
				case 68:
					// street_vendor
					if (player.AI) {
						AIHelper.aiStore(player)
					} else {
						player.goStore(true)
					}

					break
				case 69:
					let m1 = 0
					for (let p of player.game.playerSelector.getAll()) {
						m1 += p.statistics.stats[ENUM.STAT.MONEY_EARNED]
					}
					if (Math.random() > 0.93) {
						player.inven.giveMoney(m1)
						player.message(" won the lottery! earned" + m1 + "$")
					}

					break
				case 70:
					let m2 = 0
					others = player.game.playerSelector.getPlayersByCondition(player, -1, false, true, true, false)
					for (let p of others) {
						let m1 = p.inven.token * 2 + Math.floor(p.inven.money * 0.1)
						p.inven.takeMoney(m1)
						m2 += m1
					}
					player.inven.giveMoney(m2)
					break
				case 71:
					ObstacleHelper.thief(player)
					break
				case 72:
					player.effects.apply(ENUM.EFFECT.CURSE, 2, ENUM.EFFECT_TIMING.BEFORE_SKILL)
					break
				case 73:
					player.doObstacleDamage(Math.floor(player.inven.money / 2), "hit")
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

		//not ai, not pending obs and forcemoved, not arrive at none
		if (!player.AI && !(pendingObsList.includes(obs) && isForceMoved) && obs != ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE) {
			player.transfer(PlayerClientInterface.indicateObstacle, player.turn, obs)
		}

		for (let p of others) {
			player.transfer(PlayerClientInterface.indicateObstacle, p.turn, obs)
		}

		return obs
	}

	static thief(player: Player) {
		let itemhave = []
		for (let i of ItemList) {
			if (player.inven.haveItem(i.id) && i.itemlevel === 1) {
				itemhave.push(i.id)
			}
		}

		if (itemhave.length === 0) {
			return
		}
		let thiefitem = itemhave[Math.floor(Math.random() * itemhave.length)]
		player.message(player.name + "`s` " + ItemList[thiefitem].name + " got stolen!")
		//	this.item[thiefitem] -= 1
		player.inven.changeOneItem(thiefitem, -1)
		player.inven.itemSlots = player.inven.convertCountToItemSlots(player.inven.item)
		player.transfer(PlayerClientInterface.update, "item", player.turn, player.inven.itemSlots)
	}

	static kidnap(player: Player, result: boolean) {
		if (result) {
			player.effects.apply(ENUM.EFFECT.STUN, 2, ENUM.EFFECT_TIMING.BEFORE_SKILL)
		} else {
			player.doObstacleDamage(300, "stab")
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
		console.log("trial" + num)
		switch (num) {
			case 0:
				player.inven.takeMoney(100)
				player.message(player.name + "fine 100$")
				break
			case 1:
				player.effects.apply(ENUM.EFFECT.SLAVE, 99999, ENUM.EFFECT_TIMING.BEFORE_SKILL)
				break
			case 2:
				let target = player.game.playerSelector.getNearestPlayer(player, 40, true, false)
				if (target !== null && target !== undefined) {
					player.game.playerForceMove(player, target.pos, true, "levitate")
				}
				break
			case 3:
				player.killplayer()
				player.message(player.name + " has been sentenced to death")
				break
			case 4:
				player.doObstacleDamage(Math.floor(player.HP / 2), "stab")
				player.effects.apply(ENUM.EFFECT.STUN, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
				player.message(player.name + " will get retrial")
				break
			case 5:
				for (let p of player.game.playerSelector.getAll()) {
					let m = Math.random()
					if (m > 0.5) {
						p.killplayer()
					}
				}
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
				player.effects.apply(ENUM.EFFECT.SPEED, 2, ENUM.EFFECT_TIMING.BEFORE_SKILL)
				break
			case 3:
				player.doObstacleDamage(Math.floor(player.HP / 2), "stab")
				break
			case 4:
				player.inven.takeMoney(Math.floor(player.inven.money / 2))
				break
			case 5:
				player.doObstacleDamage(50, "stab")
				player.effects.apply(ENUM.EFFECT.STUN, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
				break
		}
	}
}

class PlayerFilter {
	private players: Player[]
	constructor() {
		this.players = []
		//all,enemy,ally
		//me,dead,invulnerable,team
		//range-around,absolute
		//sort -count   by-position,HP,HP+shield,kda
	}
	addPlayer(player: Player) {
		this.players.push(player)
	}
}

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
				(a) => !a.invulnerable && !a.effects.has(ENUM.EFFECT.INVISIBILITY) && me.mapdata.inSameWayWith(a)
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
		if (!me.mapdata.inSameWayWith(other)) {
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
		new AIStoreInstance(player.inven, player.itemtree).setItemLimit(player.game.itemLimit).run()
	}

	static async aiSkill(player: Player) {
		if (player.effects.has(ENUM.EFFECT.SILENT) || player.dead || player.game.gameover) {
			return
		}

		// p.aiUseSkills()

		//use ult first then w and q
		for (let i = 2; i >= 0; --i) {
			//let slist = ["Q", "W", "ult"]
			let skillresult = player.aiSkillFinalSelection(player.game.initSkill(i), i)
			if (!skillresult || skillresult.data === -1) {
				continue
			}
			// if (skillresult.data === -1) {
			// 	return
			// }
			if (skillresult.type === ENUM.AI_SKILL_RESULT_TYPE.LOCATION) {
				//	console.log(skillresult)

				player.game.placePendingSkillProj(skillresult.data)
			} else if (skillresult.type === ENUM.AI_SKILL_RESULT_TYPE.AREA_TARGET) {
				player.game.usePendingAreaSkill(skillresult.data)
			} else if (skillresult.type === ENUM.AI_SKILL_RESULT_TYPE.TARGET) {
				player.game.useSkillToTarget(skillresult.data)
			} else if (skillresult.type === ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET) {
			}
			if (!player.game.instant) {
				await Util.sleep(150)
			}
		}
	}

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
		let ps = me.game.playerSelector.getAll()
		players.sort(function (b, a) {
			if (Math.abs(ps[a].pos - ps[b].pos) < 8) {
				return ps[b].HP - ps[a].HP
			} else {
				return ps[a].pos - ps[b].pos
			}
		})
		return players[0]
	}
	//========================================================================================================
	static getAiProjPos(me: Player, skilldata: any, skill: number): number {
		let goal = null
		let targets = me.game.playerSelector.getPlayersIn(
			me,
			me.pos - 3 - Math.floor(skilldata.range / 2),
			me.pos - 3 + Math.floor(skilldata.range / 2)
		)
		//	console.log("getAiProjPos" + targets)
		if (targets.length === 0) {
			return -1
		}
		if (targets.length === 1) {
			//타겟이 1명일경우
			goal = targets[0]
			//속박걸렸으면 플레이어 위치 그대로
			if (me.game.playerSelector.get(goal).effects.has(ENUM.EFFECT.STUN)) {
				return Math.floor(me.game.playerSelector.get(goal).pos)
			}
		} else {
			//타겟이 여러명일경우
			let ps = me.game.playerSelector.getAll()

			//앞에있는플레이어 우선
			targets.sort(function (b: number, a: number): number {
				return ps[a].pos - ps[b].pos
			})

			//속박걸린 플레이어있으면 그 플레이어 위치 그대로
			for (let t in targets) {
				if (ps[t].effects.has(ENUM.EFFECT.STUN)) {
					return Math.floor(ps[t].pos)
				}
			}

			goal = targets[0]
		}
		return Math.floor(Math.min(me.game.playerSelector.get(goal).pos + 7 - skilldata.size, me.pos + skilldata.range / 2))
	}

	static getAiAreaPos(me: Player, skilldata: any, skill: number): number {
		let goal = null
		let targets = me.game.playerSelector.getPlayersIn(
			me,
			me.pos - 3 - Math.floor(skilldata.range / 2),
			me.pos - 3 + Math.floor(skilldata.range / 2)
		)
		//	console.log("getAiProjPos" + targets)
		if (targets.length === 0) {
			return -1
		}
		if (targets.length === 1) {
			//타겟이 1명일경우
			goal = targets[0]
			return Math.floor(me.game.playerSelector.get(goal).pos - skilldata.size + 1)
		} else {
			//타겟이 여러명일경우
			let ps = me.game.playerSelector.getAll()

			//앞에있는플레이어 우선
			targets.sort(function (b: number, a: number): number {
				return ps[a].pos - ps[b].pos
			})

			return Math.floor(ps[0].pos - skilldata.size + 1)
		}
	}
}

class AIStoreInstance {
	build: {
		level: number
		items: number[]
		final: number
	}
	resultItems: number[]
	inven: PlayerInventory
	totalMoneySpend: number
	itemLimit: number
	constructor(inven: PlayerInventory, build: { level: number; items: number[]; final: number }) {
		this.inven = inven
		this.build = build
		this.totalMoneySpend = 0
		this.resultItems = inven.item.map((x) => x)
	}
	setItemLimit(limit: number) {
		this.itemLimit = limit
		return this
	}
	hasEnoughMoney() {
		return this.inven.money - this.totalMoneySpend >= 30
	}

	run() {
		while (this.hasEnoughMoney()) {
			if (this.build.level >= this.itemLimit) {
				this.buyLife()
				break
			}

			//console.log("aistore",this.inven.money - this.totalMoneySpend)
			let tobuy = 0
			if (this.build.level >= this.build.items.length) {
				tobuy = this.build.final
			} else {
				tobuy = this.build.items[this.build.level]
			}

			if (this.aiAttemptItemBuy(tobuy) == 0) break
		}

		this.inven.aiUpdateItem(this.resultItems, this.totalMoneySpend)
	}
	buyLife() {
		let lifeprice = 150 * Math.pow(2, this.inven.lifeBought)

		while (this.inven.money >= lifeprice) {
			lifeprice = 150 * Math.pow(2, this.inven.lifeBought)
			this.inven.changeLife(1)
			this.inven.lifeBought += 1
			this.inven.changemoney(-lifeprice, ENUM.CHANGE_MONEY_TYPE.SPEND)
		}
	}

	isItemLimitExceeded(temp_itemlist: number[]) {
		let count = temp_itemlist.reduce((total, curr) => total + curr, 0)

		return count >= this.itemLimit
	}
	//========================================================================================================

	/**
	 *
	 * @param {*} tobuy index of item 0~
	 *@returns money spent by trying to buy this item
	 */
	aiAttemptItemBuy(tobuy: number): number {
		let item = ItemList[tobuy]
		let temp_itemlist = this.resultItems.map((x) => x) //이 아이템을 샀을 경우의 아이템리스트
		let price = item.price - this.calcDiscount(tobuy, temp_itemlist)

		//구매가능
		if (this.canbuy(price) && !this.isItemLimitExceeded(temp_itemlist) && this.inven.checkStoreLevel(item)) {
			this.totalMoneySpend += price
			Util.copyElementsOnly(this.resultItems, temp_itemlist)
			this.resultItems[tobuy] += 1
			if (item.itemlevel === 3) {
				this.build.level += 1
			}
			return price

			//불가
		} else {
			if (item.children.length === 0) {
				return 0
			}

			temp_itemlist = this.resultItems.map((x) => x)

			let moneyspent = 0
			for (let i = 0; i < item.children.length; ++i) {
				let child = item.children[i]

				//이미 보유중인 하위템은 또 안사도록
				if (temp_itemlist[child] > 0) {
					temp_itemlist[child] -= 1
					continue
				}

				moneyspent += this.aiAttemptItemBuy(child)
			}
			return moneyspent
		}
	}

	//========================================================================================================

	/**
	 * 아이템 구매가능여부
	 * @param {*} price
	 */
	canbuy(price: number): boolean {
		return price <= this.inven.money - this.totalMoneySpend
	}
	//========================================================================================================

	/**
	 * 아이템 구입시 할인될 가격 반환
	 * @param {*} tobuy int
	 * @param {*} temp_itemlist copy of player`s item list
	 */
	calcDiscount(tobuy: number, temp_itemlist: number[]): number {
		let thisitem = ItemList[tobuy]

		if (thisitem.children.length === 0) {
			return 0
		}
		let discount = 0
		//c:number   start with 1
		for (let c of thisitem.children) {
			if (temp_itemlist[c] === 0) {
				discount += this.calcDiscount(c, temp_itemlist)
			} else {
				discount += ItemList[c].price
				temp_itemlist[c] -= 1
			}
		}
		return discount
	}
	//========================================================================================================

	getItemNames(): string[] {
		return ItemList.map((i: any) => i.name)
	}
}

class EntityMediator {}

interface PriorityWeightFunction {
	(p: Entity): number
}
interface FilterConditionFunction {
	(p: Entity): boolean
}

class WeightedOnePlayerFilter {
	constructor(strategy: PriorityWeightFunction) {}
}

class EntityFilter {
	public playerOnly: boolean
	public enemyOnly: boolean
	public dead: boolean
	public invulnerable: boolean
	public excludes: Set<Entity>
	public ranges: { start: number; end: number }[]
	public condition: FilterConditionFunction
	public maxcount: number
	public returnByTurn: boolean

	static ALL = new EntityFilter(false)
	static ALLPLAYER = new EntityFilter(true)
	static ALLENEMY = new EntityFilter(true).excludeAlly()

	constructor(playeronly: boolean) {
		this.maxcount = Infinity
		this.playerOnly = playeronly
		this.ranges = []
		this.enemyOnly = false
		this.dead = false
		this.invulnerable = false
		this.excludes = new Set<Entity>()
		this.condition = () => true
		this.returnByTurn = false
	}

	count(c: number) {
		this.maxcount = c
		return this
	}
	byTurn() {
		this.returnByTurn = true
		return this
	}
	onlyIf(cond: FilterConditionFunction) {
		this.condition = cond
		return this
	}
	exclude(ex: Entity) {
		this.excludes.add(ex)
		return this
	}
	within(start: number, end: number) {
		this.ranges.push({ start: start, end: end })
		return this
	}
	withinRadius(center: number, range: number) {
		this.ranges.push({ start: center - range, end: center + range })
		return this
	}
	excludeAlly() {
		this.enemyOnly = true
		return this
	}
	includeDead() {
		this.dead = true
		return this
	}
	includeInvulnerable() {
		this.invulnerable = true
		return this
	}
}

class SkillInfoFactory {
	static LANG_KOR = 1
	static LANG_ENG = 0
	char: number
	plyr: Player
	names: string[]
	lang: number
	static SKILL_NAME = [
		["Scythe Strike", "Reaping Wind", "Grave Delivery"],
		["Tusk Attack", "Curse of Ivory", "Strengthen"],
		["Blind Curse", "Phantom Menace", "Poison Bomb"],
		["Claw Strike", "Regeneration", "Burning at the Stake"],
		["Gunfire", "Net Trap", "Target Locked"],
		["Chain Lightning", "Burning Spellbook", "Dark Magic Circle"],
		["Tenacle Strike", "Protective Water", "Predation"],
		["Beak Attack", "Baby Birds", "Phenix Transform"],
		["Sweet Fruit", "Vine Trap", "Root Prison"]
	]
	static SKILL_NAME_KOR = [
		["절단", "바람 가르기", "태풍"],
		["암흑의 표창", "도발", "실버의 갑옷"],
		["실명", "재빠른 이동", "죽음의 독버섯"],
		["양이의 손톱", "양이의 고민", "양이의 불"],
		["원거리 소총", "덫 함정", "저격수의 극장"],
		["직선 번개", "몸체 고정", "마법진 파티"],
		["촉수 채찍", "보호의 물", "블랙홀"],
		["날렵한 부리", "아기새 소환", "불사조 소환"],
		["달콤한 열매", "덩굴 함정", "뿌리 감옥"]
	]
	constructor(char: number, plyr: Player, lang: number) {
		this.plyr = plyr
		this.char = char
		this.names = SkillInfoFactory.SKILL_NAME[char]
		this.lang = lang
		if (lang === SkillInfoFactory.LANG_KOR) {
			this.names = SkillInfoFactory.SKILL_NAME_KOR[char]
		}
	}
	hotkey(s: number) {
		return ["Q", "W", "R"][s]
	}
	active(){
		return "<br>"+this.chooseLang("[Active]","[사용시]")+": "
	}
	passive(){
		return this.chooseLang("[Passive]","[기본 지속 효과]")+": "
	}
	chooseLang<T>(eng:T,kor:T):T{
		return this.lang===SkillInfoFactory.LANG_KOR?kor:eng
	}

	nameTitle(s: number) {
		return `[${this.hotkey(s)}] {${this.names[s]}}  <cool>
		${this.plyr.cooltime_list[s]}${this.chooseLang("turns","턴")}</><br>`
	}
	cooltime(){
		return `<cool>${this.chooseLang("cooltime","쿨타임")}</>`
	}
	nameDesc(s: number) {
		return `<skill><skillimg${this.char + 1}-${s+1}>${this.names[s]}</>`
	}
	lowerbound(str:string){
		return `<lowerbound>${str}</>`
	}
	upperbound(str:string){
		return `<upperbound>${str}</>`
	}
	up(str:string){
		return `<up>${str}</>`
	}
	down(str:string){
		return `<down>${str}</>`
	}
	stat(str:string){
		return `<stat>${str}</>`
	}
	range(s:number){
		return this.rangeNum(this.plyr.skill_ranges[s])
	}
	currHp(){
		return `<currHP>${this.chooseLang(" current HP"," 현재체력")}</>`
	}
	maxHP(){
		return `<maxHP>${this.chooseLang(" maximum HP"," 최대체력")}</>`
	}
	missingHp(){
		return `<missingHP>${this.chooseLang(" missing HP"," 잃은체력")}</>`
	}
	rangeNum(r:number){
		return `<range>${this.chooseLang("Range: ","사정거리: ")}${r}, </>`
	}
	rangeStr(){
		return `<range>${this.chooseLang("Range","사정거리")}</>`
	}
	area(s:number){
		return `<area>${this.chooseLang(`Select ${s} Squares`,s+"칸 범위를 선택")}</>`
	}
	mDmg(d:number|string,scale?:string){
		if(scale==null){
			return `<mdmg>${d}${this.chooseLang(" magic damage","의 마법 피해")}</>`
		}
		return `<mdmg><scale${scale}>${d}</>${this.chooseLang(" magic damage","의 마법 피해")}</>`
	}
	pDmg(d:number|string,scale?:string){
		if(scale==null){
			return `<pdmg>${d}${this.chooseLang(" attack damage","의 물리 피해")}</>`
		}
		return `<pdmg><scale${scale}>${d}</>${this.chooseLang(" attack damage","의 물리 피해")}</>`
	}
	tDmg(d:number|string,scale?:string){
		if(scale==null){
			return `<tdmg>${d}${this.chooseLang(" fixed damage","의 고정 피해")}</>`
		}
		return `<tdmg><scale${scale}>${d}</>${this.chooseLang(" fixed damage","의 고정 피해")}</>`
	}

	baseDmg(s:number){
		return this.plyr.getSkillBaseDamage(s)
	}
	heal(amt:number,scaleCode?:string){
		if(scaleCode==null){
			let txt=`<heal>${amt}</>`
			return this.chooseLang("heals "+txt+" HP",txt+"의 체력을 회복")
		}

		let txt=`<heal><scale${scaleCode}>${amt}</></>`
		return this.chooseLang(`heals ${txt} HP`,`${txt}의 체력을 회복`)
	}
	money(amt:number){
		return `<money>${amt+this.chooseLang("$","원")}</>`
	}
	shield(amt:number,scale?:string){
		if(scale==null){
			let txt=`<shield>${amt}</>`
			return this.chooseLang("gains "+txt+" shield",txt+"의 보호막 획득")
		}
		let txt=`<shield><scale${scale}>${amt}</></>`

		return this.chooseLang(`gains ${txt} shield`,`${txt}의 보호막 획득`)
	}
	skillAmt(key:string):number{
		return this.plyr.getSkillAmount(key)
	}
	proj(name:string){
		return `<proj>${this.chooseLang(`place a ${name}`,`${name} 설치`)}</>`
	}
	projsize(size:number){
		return `<projsize>${this.chooseLang("Size:","크기:")}${size} </>,`
	}
	projsizeStr(size:number){
		return `<projsize>${this.chooseLang("Size of","")}${size}${this.chooseLang("","칸 크기")} </>`
	}
	getEffectHeader(e:number){
		let str=this.chooseLang(statuseffect[e],statuseffect_kor[e])
		try{
			if(str[0]==="{")
			{
				let name=str.match(/\{(.+)\}/)
				return `<badeffect${e}>`+name[1]
			}
			else{
				let name=str.match(/\[(.+)\]/)

				return `<goodeffect${e}>`+name[1]
			}
		}
		catch(e){
			console.error(e)
			return ""
		}
	}
	effectNoDur(e:number){
		return this.getEffectHeader(e)+ '</>'
	}
	effect(e:number,dur:number){
		return this.chooseLang(this.effectEng(e,dur),this.effectKor(e,dur))
	}
	effectEng(e:number,dur:number){
		return `${this.getEffectHeader(e)} ${dur} ${dur>1?"turns":"turn"} </>`
	}
	effectKor(e:number,dur:number){
		return `${this.getEffectHeader(e)} ${dur} 턴</>`
	}
	duration(d:number){
		return `<duration>${d}${this.chooseLang(d>1?"turns":"turn","턴")}</>`
	}
	radius(r:number){
		return `<radius>${this.chooseLang(`within ${r} squares`,`반경 ${r}칸 이내`)}</>`
	}
	radiusStr(r:string){
		return `<radius>${this.chooseLang(`within ${r} squares`,`반경 ${r}칸 이내`)}</>`
	}
	basicattack(){
		return `<basicattack>${this.chooseLang(`basic attack`,`기본 공격`)}</>`
	}
	target(){
		return `<target>${this.chooseLang(`targer`,`대상`)}</>`
	}
	getQ() {
		if(this.lang===SkillInfoFactory.LANG_KOR)
			return this.getQKor()

		let str
		const s = 0
		const hotkey=this.hotkey(s)
		switch (this.char) {
			case 0:
				str=this.nameTitle(s)+this.range(s)+`${this.target()}에게 ${this.pDmg(this.baseDmg(s),hotkey)}를 입힘
				.두번 시전 가능, 두번째 사용시 50%의 피해를 입힘`
				break
			case 8:
				str = this.nameTitle(s)+this.passive()+`체력이 ${this.lowerbound("40% 미만")}이면 '시든 나무' 상태 돌입, 
				'시든 나무' 상태에선 ${this.nameDesc(s)} 으로 아군 회복이 불가하지만
				 ${this.stat("모든 피해 흡혈")}이 ${this.up("15% 증가")}함`+
				this.active()+this.range(s)+this.area(s)+`해 그 안에 있는 적들에게 
				${this.mDmg(this.baseDmg(s))}를 입히고
				 아군은 ${this.heal(this.skillAmt("qheal"))}시키고 ${this.heal(this.skillAmt("qshield"))}`
				break
			
			default:
				str = ""
		}
		return str
	}
	getQKor() {
		let str
		const s = 0
		const hotkey=this.hotkey(s)
		switch (this.char) {
			case 1:
				str=this.nameTitle(s)+this.range(s)+`
				사용시 ${this.target()}에게 ${this.mDmg(this.baseDmg(s),hotkey)}를 입힌 후 ${this.heal(this.skillAmt("qheal"))}
				, <br>${this.nameDesc(1)}표식이 있는 상대에게는 ${this.rangeNum(7)}
				${this.tDmg(this.skillAmt('w_qdamage'),"w_qdamage")}를 추가로 입힘`
				break
			case 0:
				str=this.nameTitle(s)+this.range(s)+`${this.target()}에게 ${this.pDmg(this.baseDmg(s),hotkey)}를 입힘
				.두번 시전 가능, 두번째 사용시 ${this.down("50%의 피해")}를 입힘`
				break
			case 2:
				str=this.nameTitle(s)+this.range(s)+this.target()+`에게 ${this.mDmg(this.baseDmg(s),hotkey)}를 입히고 ${this.effect(ENUM.EFFECT.BLIND,2)} 부여`
				break
			case 3:
				str=this.nameTitle(s)+this.radius(4)+`의 적에게 ${this.pDmg(this.baseDmg(s),hotkey)}를 입힘
				(${this.currHp()}의 ${this.down("5% 소모")},
				대상이 ${this.upperbound("2명 이상")}이면 ${this.down("피해량 감소")})"`
				break
			case 4:
				str=this.nameTitle(s)+this.range(s)+this.target()+`에게 총을 발사해 
				${this.pDmg(this.baseDmg(s),hotkey)}를 입힘, ${this.effectNoDur(ENUM.EFFECT.STUN)}
				상태인 대상 적중 시 ${this.nameDesc(s)+ ""+this.cooltime()} 2턴을 돌려받음`
				break
			case 5:
				str=this.nameTitle(s)+`사용시 ${this.radiusStr(`앞 ${this.skillAmt("qrange_start")}~${this.skillAmt("qrange_end_front")},
				뒤 ${this.skillAmt("qrange_start")}~${this.skillAmt("qrange_end_back")}`)} 
				대상들에게 ${this.mDmg(this.baseDmg(s),hotkey)}를 입힘"`
				break
			case 6:
				str=this.nameTitle(s)+this.range(s)+this.projsize(2)+`${this.proj("촉수")}해
				 밟은 적에게 ${this.mDmg(this.baseDmg(s),hotkey)}를 입힘`
				break
			case 7:
				str=this.nameTitle(s)+this.range(s)+this.target()+`을 공격해
				${this.mDmg(this.baseDmg(s),hotkey)}를 입히고 ${this.money(20)}을 빼앗음.`
				break
			case 8:
				str = this.nameTitle(s)+this.passive()+`체력이 ${this.lowerbound("40% 미만")}이면 '시든 나무' 상태 돌입, 
				'시든 나무' 상태에선 ${this.nameDesc(s)} 로 아군 회복이 불가하지만
				 ${this.stat("모든 피해 흡혈")}이 ${this.up("15% 증가")}함`+
				this.active()+this.range(s)+this.area(3)+`해 그 안에 있는 적들에게 
				${this.mDmg(this.baseDmg(s),hotkey)}를 입히고
				 아군은 ${this.heal(this.skillAmt("qheal"),"qheal")}시키고 ${this.shield(this.skillAmt("qshield"),"qshield")}`
				break
			default:
				str = ""
		}
		return str
	}
	getW() {
		if(this.lang===SkillInfoFactory.LANG_KOR)
			return this.getWKor()
		let str
		const s = 1
		const hotkey=this.hotkey(s)

		switch (this.char) {
			case 0:
				str=this.nameTitle(s)+this.range(s)+this.projsize(3)+`,맞은 적을 ${this.down("4칸 뒤로")} 이동시키는 ${this.proj("뿌리")}`
				break
			case 8:
				str = this.nameTitle(s)+this.range(s)+this.projsize(1)+`지나가는 플레이어를 멈추는 ${this.proj("뿌리")},
				 뿌리에 걸린 플레이어는 해당 칸의 효과를 받음, 아군은 ${this.effect(ENUM.EFFECT.SPEED,1)} 부여`
				break
			default:
				str = ""
		}
		return str
	}
	getWKor() {
		let str
		const s = 1
		const hotkey=this.hotkey(s)
		switch (this.char) {
			case 0:
				str=this.nameTitle(s)+this.range(s)+this.projsize(3)+`,맞은 적을 ${this.down("4칸 뒤로")} 이동시키는 ${this.proj("토네이도")}`
				break
			case 1:
				str=this.nameTitle(s)+this.range(s)+`사용시 ${this.target()}에게 표식을 남기고 ${this.effect(ENUM.EFFECT.CURSE,1)} 부여`
				break
			case 2:
				str=this.nameTitle(s)+this.passive()+this.effectNoDur(ENUM.EFFECT.INVISIBILITY)+` 상태에서 ${this.nameDesc(ENUM.SKILL.Q)}사용시 
				대상의 ${this.missingHp()}의 ${this.mDmg("30%")}를 입힘 ${this.active()}${this.effect(ENUM.EFFECT.INVISIBILITY,1)}.`
				break
			case 3:
				str=this.nameTitle(s)+this.passive()+`모든 상대보다 뒤쳐져 있으면 ${this.up("이동 속도 +1")}
				${this.active()}${this.duration(3)}에 걸쳐 체력 ${this.heal(this.skillAmt("wheal"),"wheal")},
				 회복 중엔 ${this.effectNoDur(ENUM.EFFECT.SLOW)}에 걸림.`
				break
			case 4:
				str=this.nameTitle(s)+this.range(s)+this.projsize(3)+`${this.proj("덫")}해
				 밟은 적에게 ${this.effect(ENUM.EFFECT.STUN,1)} 부여`
				break
			case 5:
				str=this.nameTitle(s)+`사용시 ${this.effect(ENUM.EFFECT.STUN,1)} 후 ${this.nameDesc(0)+" 와 "+this.nameDesc(2)}의 ${this.rangeStr()}  ${this.up("2배 증가")},
				${this.nameDesc(0)} 사용시 적중한 적에게 ${this.effect(ENUM.EFFECT.IGNITE,2)}을 부여해 매 플레이 턴마다 ${this.maxHP()}의 ${this.tDmg("3%")} 를 입힘`
				break
			case 6:
				str=this.nameTitle(s)+this.radius(3)+`의 적에게 ${this.mDmg(this.baseDmg(s),hotkey)}를
				 입히고 자신은 ${this.shield(this.skillAmt("wshield"),"wshield")}`
				break
			case 7:
				str=this.nameTitle(s)+`지속시간: ${this.duration(2)}, 사용시 ${this.effect(ENUM.EFFECT.SPEED,1)}을 받고, 지속시간 중에 
				${this.basicattack()}시 ${this.mDmg(this.skillAmt("w_aa_adamage"),"w_aa_adamage")},
				 ${this.nameDesc(0)} 사용시 ${this.mDmg(this.skillAmt("w_aa_adamage"),"w_aa_adamage")}
				 를 추가로 입히고 ${this.effect(ENUM.EFFECT.STUN,1)} `
				break
			case 8:
				str = this.nameTitle(s)+this.range(s)+this.projsize(1)+`지나가는 플레이어를 멈추는 ${this.proj("뿌리")},
				 뿌리에 걸린 플레이어는 해당 칸의 효과를 받음, 아군은 ${this.effect(ENUM.EFFECT.SPEED,1)} 부여`
				 break
			default:
				return ""
		}
		return str
	}
	getUlt() {
		if(this.lang===SkillInfoFactory.LANG_KOR)
			return this.getUltKor()
		let str
		const s = 2
		const hotkey=this.hotkey(s)

		switch (this.char) {
			case 8:
				break
			default:
				str = ""
		}
		return str
	}
	getUltKor() {
		let str
		const s = 2
		const hotkey=this.hotkey(s)
		switch (this.char) {
			case 0:
				str=this.nameTitle(s)+this.range(s)+`사용시 ${this.target()}에게 순간이동해 ${this.pDmg(this.baseDmg(s),hotkey)}를 입힘.
				자신보다 ${this.up("앞에 있는 상대")}에게는 ${this.down("70%의 피해")}를 입힘`
				break
			case 1:
				str=this.nameTitle(s)+this.passive()+this.missingHp()+`에 비례해 ${this.stat("방어력과 마법저항력")} ${this.up("0~60 증가")} 
				${this.active()} ${this.duration(4)}간  ${this.stat("방어력과 마법저항력")}이 ${this.up("+"+this.skillAmt("r_resistance"))},
				${this.shield(this.skillAmt("rshield"))}, ${this.nameDesc(ENUM.SKILL.Q)} ${this.up("회복량 2배")}`
				break
			case 2:
				str=this.nameTitle(s)+this.range(s)+this.projsize(4)+`의 ${this.proj("독버섯")}. 밟은 적은 ${this.duration(3)}에 걸쳐 
				${this.effectNoDur(ENUM.EFFECT.SLOW)}에 걸리고 ${this.mDmg(this.baseDmg(s)*3)}를 받음`
				break
			case 3:
				str=this.nameTitle(s)+this.range(s)+this.target()+`에게 ${this.pDmg(this.baseDmg(s)+`+ 대상 ${this.missingHp()}의 50%`,hotkey)}를 입힘,
				대상 처치시${this.nameDesc(s)} ${this.cooltime()} 초기화`
				break
			case 4:
				str=this.nameTitle(s)+this.range(s)+this.target()+` 고정 후 ${this.duration(3)} 동안 최대 3번
				 발사해 각각${this.pDmg(this.baseDmg(s),hotkey)}를 입힘
				(3번째에는 ${this.tDmg(this.baseDmg(s))}를 입힘, 사용중에는 움직일 수 없음)<br>
				발사 후에는 ${this.effect(ENUM.EFFECT.DOUBLEDICE,1)}을 받음`
				break
			case 5:
				str=this.nameTitle(s)+this.range(s)+this.projsize(3)+` ${this.proj("번개")}, 밟은 적은 ${this.mDmg(this.baseDmg(s),hotkey)}를 받고
				${this.effect(ENUM.EFFECT.SILENT,1)} 부여. 총 3번 시전할 수 있음`
				break
			case 6:
				str=this.nameTitle(s)+this.range(s)+this.target()+`에게 ${this.tDmg(this.baseDmg(s),hotkey)}를 입힘,
				대상 처치시 ${this.maxHP()+this.up("50 증가")}`
				break
			case 7:
				str=this.nameTitle(s)+`지속시간: ${this.duration(4)}, 지속시간 중에 
				${this.basicattack()}시 ${this.stat("기본공격 사거리")}가 ${this.up("2 증가")}하고 
				${this.pDmg(this.skillAmt("r_aa_adamage"),"r_aa_adamage")}를 추가로 입힘.
				 또한 ${this.nameDesc(1)}의 추가 피해가 ${this.up("2 배 증가")}하고
				 ${this.nameDesc(0)} 적중 시 밟은 적에게 ${this.effect(ENUM.EFFECT.IGNITE,2)}
				 을 주는 ${this.projsizeStr(3)}의 영역을 그 자리에 생성함`
				break
			case 8:
				str =this.nameTitle(s)+this.passive()+`스킬 사용시 사용한 자리에 식충식물 소환, <br>
				식충식물은 ${this.duration(this.skillAmt("plant_lifespan"))}간 유지되며 매 턴마다 ${this.radius(1)}의 적에게
				 ${this.mDmg(this.skillAmt("plantdamage"),"plantdamage")}를 입히고 적이 ${this.basicattack()}시 사라짐`+
				this.active()+this.range(s)+`${this.target()}에게 ${this.mDmg(this.baseDmg(s),hotkey)}를 입히고
				 ${this.effect(ENUM.EFFECT.STUN,1)}.('시든 나무' 상태이면 2턴)
				,또한 이 상태에서 아군이 가하는 피해 ${this.up("20% 증가")},
				 이때 맵에 있는 모든 식충 식물이 대상 주변으로 이동됨`
				 break
			default:
				return ""
		}
		return str
	}
}

export { ObstacleHelper, PlayerSelector, AIHelper ,SkillInfoFactory}
