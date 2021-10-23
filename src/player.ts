import oceanmap = require("../res/ocean_map.json")
import casinomap = require("../res/casino_map.json")
import defaultmap = require("../res/map.json")
import obsInfo = require("../res/obstacles.json")
import SETTINGS = require("../res/settings.json")

import * as server from "./app"
import { items as ItemList } from "../res/item.json"

import * as ENUM from "./enum"
import * as Util from "./Util"
import { Game } from "./Game"

const LVL=1   //for test only
const POS=0

const MAP: Util.Map = new Util.Map([defaultmap, oceanmap, casinomap])

abstract class Player {
	game: Game
	players: Player[]
	mapId: number
	AI: boolean
	turn: number
	name: string
	champ: number
	champ_name: string
	team: boolean | string
	pos: number
	lastpos: number
	dead: boolean
	level: number

	money: number
	token: number
	life: number
	lifeBought: number
	kill: number
	death: number
	assist: number
	invulnerable: boolean
	nextdmg: number
	adamage: number
	adice: number //추가 주사위숫자
	onMainWay: boolean //갈림길 체크시 샤용
	pendingSkill: number
	oneMoreDice: boolean
	diceControl: boolean
	diceControlCool: number
	thisLevelDeathCount: number //현재 레벨에서 사망 횟수
	thisLifeKillCount: number //죽지않고 킬 횟수
	waitingRevival: boolean

	HP: number
	MaxHP: number
	AD: number
	AR: number
	MR: number
	attackRange: number
	AP: number
	basicAttack_multiplier: number

	arP: number
	MP: number
	regen: number
	absorb: number
	adStat: number
	skillDmgReduction: number
	addMdmg: number
	adStatAD: boolean
	obsR: number
	ultHaste: number
	moveSpeed: number

	shield: number
	cooltime: number[]
	duration: number[]
	stun: boolean
	signs: object[]
	igniteSource: number
	effects:{
		obs:number[],skill:number[]
	} 
	//0.slow 1.speed 2.stun 3.silent 4. shield  5.poison  6.radi  7.annuity 8.slave
	loanTurnLeft: number
	skilleffects: Util.SkillEffect[]
	activeItems: Util.ActiveItem[]

	stats: number[]
	//0.damagetakenbychamp 1. damagetakenbyobs  2.damagedealt
	//3.healamt  4.moneyearned  5.moneyspent   6.moneytaken  7.damagereduced
	//8 timesrevived 9 timesforcemoved 10 basicattackused  11 timesexecuted

	damagedby: number[]
	//for eath player, turns left to be count as assist(maximum 3)

	bestMultiKill: number

	item: number[]
	positionRecord: number[]
	itemRecord: { item_id: number; count: number; turn: number }[]
	moneyRecord: number[]

	abstract onoff: boolean[]
	abstract hpGrowth: number
	abstract projectile: Projectile[]
	abstract cooltime_list: number[]
	// abstract skill_name:string[]
	abstract itemtree: {
		level: number
		items: number[]
		final: number
	}

	abstract getSkillInfoKor(): string[]
	abstract getSkillInfoEng(): string[]
	abstract getSkillTrajectorySpeed(s:string):number
	abstract getSkillTargetSelector(skill: number): Util.SkillTargetSelector 
	abstract getSkillProjectile(target: number): Projectile
	abstract getSkillDamage(target: number): Util.SkillDamage
	abstract passive(): void
	abstract getSkillName(skill: number): string
	abstract onSkillDurationCount(): void
	abstract onSkillDurationEnd(skill: number): void
	abstract aiSkillFinalSelection(skilldata: any, skill: number): { type: number; data: number }

	constructor(
		turn: number,
		team: boolean | string,
		game: Game,
		ai: boolean,
		char: number,
		name: string,
		champ_name: string,
		basic_stats: number[]
	) {
		this.game = game
		this.players = []
		this.mapId = game.mapId

		this.AI = ai //AI여부
		this.turn = turn //턴 (0에서 시작)
		this.name = name //이름
		this.champ = char //챔피언 코드
		this.champ_name = champ_name //챔피언 이름
		this.team = team //0:readteam  1:blue
		this.pos = POS //현재위치
		this.lastpos = 0 //이전위치
		this.dead = false
		this.level = LVL //레벨, 1에서시작
		this.money = 0
		this.token = 2
		this.life = 0
		this.lifeBought = 0
		this.kill = 0
		this.death = 0
		this.assist = 0
		this.invulnerable = true
		this.nextdmg = 0
		this.adamage = 0
		this.adice = 0 //추가 주사위숫자
		this.onMainWay = true //갈림길 체크시 샤용
		this.pendingSkill = -1
		this.oneMoreDice = false
		this.diceControl = false
		this.diceControlCool = SETTINGS.DC_COOL
		this.thisLevelDeathCount = 0 //현재 레벨에서 사망 횟수
		this.thisLifeKillCount = 0 //죽지않고 킬 횟수
		this.waitingRevival = false

		this.HP = basic_stats[0]
		this.MaxHP = basic_stats[0]
		this.AD = basic_stats[1]
		this.AR = basic_stats[2]
		this.MR = basic_stats[3]
		this.attackRange = basic_stats[4]
		this.AP = basic_stats[5]
		this.basicAttack_multiplier = 1 //평타 데미지 계수

		this.arP = 0
		this.MP = 0
		this.regen = 0
		this.absorb = 0
		this.adStat = 0
		this.skillDmgReduction = 0
		this.addMdmg = 0
		this.adStatAD = true
		this.obsR = 0
		this.ultHaste = 0
		this.moveSpeed = 0

		this.shield = 0
		this.cooltime = [0, 0, 0]
		this.duration = [0, 0, 0]
		this.stun = false
		this.signs = []
		this.igniteSource = -1 //점화효과를 누구에게 받았는지

		//two lists of effects hae different cooldown timing
		this.effects={
			skill:Util.makeZeroArray(20),  //턴 끝날때 쿨다운
			obs:Util.makeZeroArray(20)   //장애물 끝날때 쿨다운
		}
		//0.slow 1.speed 2.stun 3.silent 4. shield  5.poison  6.radi  7.annuity 8.slave
		this.loanTurnLeft = 0
		this.skilleffects = []
		this.activeItems = []

		this.stats = Util.makeZeroArray(12)
		//0.damagetakenbychamp 1. damagetakenbyobs  2.damagedealt
		//3.healamt  4.moneyearned  5.moneyspent   6.moneytaken  7.damagereduced
		//8 timesrevived 9 timesforcemoved 10 basicattackused  11 timesexecuted

		this.damagedby = [0, 0, 0, 0]
		//for eath player, turns left to be count as assist(maximum 3)

		this.bestMultiKill = 0

		this.item = Util.makeZeroArray(ItemList.length)

		//record positions for every turn
		this.positionRecord = [0]

		//record gold earned for every turn
		this.moneyRecord = [0]
		//record when and what item the player bought
		this.itemRecord = []
	}

	distance(p1: Player, p2: Player): number {
		return Math.abs(p1.pos - p2.pos)
	}

	getPlayer(): Player {
		return this
	}
	message(text: string) {
		if (this.game.instant) return
		server.message(this.game.rname, text)
	}

	/**
	 * 가장 앞에있는 플레이어 반환
	 */
	getFirstPlayer(): Player {
		let first: Player = this
		for (let p of this.players) {
			if (p.pos > first.pos) {
				first = p
			}
		}
		return first
	}

	calculateAdditionalDice(): number {
		let first: Player = this.getFirstPlayer()

		//자신이 1등보다 15칸이상 뒤쳐져있으면 주사위숫자 2 추가,
		//자신이 1등보다 30칸이상 뒤쳐져있으면 주사위숫자 4 추가
		//자신이 1등보다 레벨이 2 낮으면 주사위숫자 5 추가
		//역주사위 효과 있을시 추가안함
		if (this.pos + 15 < first.pos && !this.haveEffect(ENUM.EFFECT.BACKDICE) && first.onMainWay) {
			this.adice += 2
			if (this.pos + 30 < first.pos) {
				this.adice += 2
			}
			if (this.level + 1 < first.level) {
				this.adice += 3
			}
		}
		this.adice += this.moveSpeed

		if (this.haveItem(28) && this.isLast()) {
			this.adice += 1
		}

		//동레벨서 2~3번이상사망시 주사위2배 상시부여
		if (this.thisLevelDeathCount >= 3 && this.level < 4) {
			this.applyEffectBeforeDice(ENUM.EFFECT.DOUBLEDICE, 1)
		} else if (this.thisLevelDeathCount >= 2 && this.level < 2) {
			this.applyEffectBeforeDice(ENUM.EFFECT.DOUBLEDICE, 1)
		} else if (this.thisLevelDeathCount >= 7) {
			this.applyEffectBeforeDice(ENUM.EFFECT.DOUBLEDICE, 1)
		}

		return this.adice
	}

	/**
	 * 조건에 맟는 플레이어 플레이어 반환
	 * @param {*} range 범위, -1이면 전체범위
	 * @param {*} includeMe 자신 포함 여부
	 * @param {*} includeInvulnerable 무적플레이어 포함 여부 (Invulnerable,invisible)
	 * @param {*} includeDead 죽은플레이어 포함여부
	 * @param {*} includeMyTeam 우리팀 포함여부
	 */
	getPlayersByCondition(
		range: number,
		includeMe: boolean,
		includeInvulnerable: boolean,
		includeDead: boolean,
		includeMyTeam: boolean
	): Player[] {
		let result: Player[] = this.players
		//범위가 정해져있을시
		if (range > -1) {
			let start = this.pos - range
			let end = this.pos + range

			result = result.filter((a) => a.pos >= start && a.pos <= end)
		}

		if (!includeInvulnerable) {
			let myway = this.onMainWay
			result = result.filter((a) => !a.invulnerable && !a.haveEffect(ENUM.EFFECT.INVISIBILITY) && a.onMainWay === myway)
		}

		if (!includeMe) {
			result = result.filter((a) => a.turn !== this.turn)
		}
		if (!includeDead) {
			result = result.filter((a) => !a.dead)
		}
		if (!includeMyTeam && this.game.isTeam) {
			result = result.filter((a) => a.team !== this.team)
		}
		return result
	}

	/**
	 * 공격가능한 플레이어 반환
	 * @param {*} range
	 */
	getAllVaildPlayer(range: number): Player[] {
		let start = this.pos - range
		let end = this.pos + range
		return this.players.filter(
			(a) =>
				!a.dead &&
				!a.invulnerable &&
				!a.haveEffect(ENUM.EFFECT.INVISIBILITY) &&
				a.pos >= start &&
				a.pos <= end &&
				a.turn !== this.turn
		)
	}

	//true if it is itself or same team , false if individual game or in different team
	isValidOpponent(other: Player) {
		//자기자신
		if (this === other) {
			return false
		}
		//무적이거나 투명화효과나 죽었을경우
		if (other.invulnerable || other.haveEffect(ENUM.EFFECT.INVISIBILITY) || other.dead) {
			return false
		}
		//갈림길에서 다른길
		if (other.onMainWay !== this.onMainWay) {
			return false
		}

		//팀 없거나 다를시
		if (this.team !== other.team || !this.game.isTeam) {
			return true
		}
		return false
	}
	/**
	 *  가장 앞에있는 플레이어반환
	 * 거리 5칸 내일시 가장 체력적은 플레이어
	 * @param {} players int[]
	 * return int
	 */
	getAiTarget(players: number[]): number {
		if (players.length === 1) {
			return players[0]
		}
		let ps = this.players
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
	getAiProjPos(skilldata: any, skill: number): number {
		let goal = null
		let targets = this.getPlayersIn(
			this.pos - 3 - Math.floor(skilldata.range / 2),
			this.pos - 3 + Math.floor(skilldata.range / 2)
		)
		console.log("getAiProjPos" + targets)
		if (targets.length === 0) {
			return -1
		}
		if (targets.length === 1) { //타겟이 1명일경우
			goal = targets[0]
			//속박걸렸으면 플레이어 위치 그대로
			if(this.players[goal].haveEffect(ENUM.EFFECT.STUN)){
				return Math.floor(this.players[goal].pos)
			}
		} else {
			 //타겟이 여러명일경우
			let ps = this.players

			//앞에있는플레이어 우선
			targets.sort(function (b: number, a: number): number {
				return ps[a].pos - ps[b].pos
			})

			//속박걸린 플레이어있으면 그 플레이어 위치 그대로
			for(let t in targets){
				if(ps[t].haveEffect(ENUM.EFFECT.STUN)){
					return Math.floor(ps[t].pos)
				}
			}

			goal = targets[0]
		}
		return Math.floor(Math.min(this.players[goal].pos + 7-skilldata.size, this.pos + skilldata.range / 2))
	}

	/**
	 *
	 * @param {*} skill 0 ~
	 */
	isSkillLearned(skill: number): boolean {
		if (this.level < 2 && skill === ENUM.SKILL.W) {
			return false
		}
		if (this.level < 3 && skill === ENUM.SKILL.ULT) {
			return false
		}
		return true
	}

	/**
	 * 스킬 사용가능여부 체크
	 * @param {} s (0~) 스킬
	 * @returns
	 */
	isCooltimeAvaliable(s: number): boolean {
		if (this.cooltime[s] > 0 && !this.onoff[s]) {
			return false
		}
		return true
	}
	//========================================================================================================

	constDamage() {
		if (this.haveSkillEffect("timo_u")) {
			let skeffect = this.skilleffects.filter((e: Util.SkillEffect) => e.type === "timo_u")[0]
			this.applyEffectBeforeSkill(ENUM.EFFECT.SLOW, 1)
			let died = this.hitBySkill(skeffect.skillattr, skeffect.owner_turn, ENUM.SKILL.ULT, null)
			return died
			//giveDamage(skeffect.const_damage,skeffect.owner+1,'hit')
		}
	}

	//========================================================================================================
	showEffect(type: string,source:number) {
		if (this.game.instant) return
		server.effect(this.game.rname, this.turn, type,source)
	}
	//========================================================================================================
	coolDownBeforeDice() {
		this.passive()
	}
	//========================================================================================================
	coolDownBeforeObs() {
		if (this.oneMoreDice) {
			return
		}

		this.invulnerable = false
		this.adamage = 0

		// if (this.champ === 2 && this.w_active) {
		// 	this.invulnerable = true
		// }

		for (let p of this.projectile) {
			p.projCoolDown()
		}

		// for (let i = 0; i < this.effects.length; ++i) {
		// 	if (this.effects[i] === 1) {
		// 		server.update(this.game.rname, "removeEffect", this.turn, i)
		// 	}
		// }

		if (this.loanTurnLeft === 1) {
			this.takeMoney(400)
		}
		this.loanTurnLeft = Math.max(0, this.loanTurnLeft - 1)

		// this.effects = this.effects.map(Util.decrement)
		this.cooltime = this.cooltime.map(Util.decrement)
		console.log("cooltime " + this.turn)
		console.log(this.cooltime)

		let died = false
		//점화
		died = this.applyIgnite()
		//독
		if (this.haveEffect(ENUM.EFFECT.POISON)) {
			died = this.doObstacleDamage(30,"simple")
		}
		//연금
		if (this.haveEffect(ENUM.EFFECT.ANNUITY)) {
			this.giveMoney(20)
		}
		//연금복권
		if (this.haveEffect(ENUM.EFFECT.ANNUITY_LOTTERY)) {
			this.giveMoney(50)
			this.changeToken(1)
		}

		//노예계약
		if (this.haveEffect(ENUM.EFFECT.SLAVE)) {
			died = this.doObstacleDamage(80,"simple")
		}

		if (died) {
			this.applyEffectBeforeSkill(ENUM.EFFECT.SILENT, 1)
		}
	}
	applyIgnite() {
		let died = false
		for (let p of this.players) {
			if (p.haveEffect(ENUM.EFFECT.IGNITE)) {
				if(p.igniteSource===-1){
					died = p.doObstacleDamage(Math.floor(0.04*this.MaxHP), "fire")
				}
				else{
					died = p.doPlayerDamage(Math.floor(0.04*this.MaxHP), p.igniteSource, "fire",false)
				}

			}
		}
		return died
	}
	//========================================================================================================

	coolDownAfterObstacle() {
		if (this.oneMoreDice) {
			return
		}
		// if (!this.haveEffect(ENUM.EFFECT.STUN)) {
		// 	this.stun = false
		// }
		this.onSkillDurationCount()

		this.decrementAllSkillDuration()

		let died = this.constDamage()
		if (died) {
			this.applyEffectBeforeSkill(ENUM.EFFECT.SILENT, 1)
		}

		this.cooldownEffectsBeforeSkill()
	}

	/**
	 * 	decrement all skill durations at once
	 */
	decrementAllSkillDuration() {
		for (let i = 0; i < this.duration.length; i++) this.setSingleSkillDuration(i, this.duration[i] - 1)
	}
	/**
	 * set all skill durations at once
	 * @param durations
	 */
	setAllSkillDuration(durations: number[]) {
		for (let i = 0; i < durations.length; i++) this.setSingleSkillDuration(i, durations[i])
	}

	/**
	 * change one skill`s duration
	 * checks if the skill duration ends
	 * @param skill
	 * @param val
	 */
	setSingleSkillDuration(skill: number, val: number) {
		if (val === 0 && this.isSkillActivated(skill)) {
			this.onSkillDurationEnd(skill)
		}
		if (val < 0) val = 0
		this.duration[skill] = val
	}

	//========================================================================================================

	coolDownOnTurnEnd() {
		if (this.oneMoreDice) {
			return
		}
		this.damagedby = this.damagedby.map(Util.decrement)
		this.diceControlCool -= 1
		if (this.diceControlCool === 0) {
			this.diceControl = true
			this.diceControlCool = SETTINGS.DC_COOL
		}

		this.signCoolDown()
		this.skillEffectCoolDown()
		this.activeItemCoolDown()
		this.cooldownEffectsAfterSkill()
		this.regeneration()
	}
	//========================================================================================================

	checkMuststop(dice: number): number {
		if (this.pos + dice < 0) {
			return this.pos
		}

		for (let m of MAP.getMuststop(this.mapId)) {
			if ((this.pos < m && this.pos + dice > m) || (this.pos > m && this.pos + dice < m)) {
				return m - this.pos
			}
		}
		return dice
	}
	//========================================================================================================

	checkWay2(dice: number): boolean {
		//갈림길 시작점 도착시
		try {
			if (this.pos + dice === MAP.get(this.mapId).way2_range.start) {
				return true
			}
			//way2 에서 마지막칸 도착시
			if (this.pos + dice === MAP.get(this.mapId).way2_range.way_end) {
				this.exitWay2(dice)
				return false
			}
		} catch (e) {
			return false
		}
	}
	//========================================================================================================

	goWay2() {
		this.pos = MAP.get(this.mapId).way2_range.way_start
		this.onMainWay = false
		if (this.game.instant) return
		server.update(this.game.rname, "way", this.turn, false)
	}
	//========================================================================================================

	exitWay2(dice: number) {
		this.onMainWay = true

		this.pos = MAP.get(this.mapId).way2_range.end - dice

		if (this.game.instant) return
		server.update(this.game.rname, "way", this.turn, true)
	}

	move(dice: number): boolean {
		this.lastpos = this.pos
		let died = this.changePos(this.pos + dice)
		return died
	}
	//========================================================================================================

	checkWay2ForGoto(pos: number) {
		let w2 = MAP.get(this.mapId).way2_range

		if (!this.onMainWay) {
			if (pos < w2.way_start) {
				pos = w2.start - (w2.way_start - pos)
				this.onMainWay = true
			} else if (pos > w2.way_end) {
				pos = w2.end - (w2.way_end - pos)
				this.onMainWay = true
			}
		}
	}

	/**
	 * called to change position of player for dice or forcemove
	 * @param {} pos
	 * @returns
	 */
	changePos(pos: number): boolean {
		if (this.giveDamageWhenMove()) return true

		if (pos < 0) {
			pos = 0
		}
		if (pos >= MAP.getFinish(this.mapId) && this.onMainWay) {
			pos = MAP.getFinish(this.mapId)
		}

		this.pos = pos
		this.lvlup()

		return false
	}

	goto(pos: number, ignoreObstacle: boolean, movetype: string) {
		this.stats[ENUM.STAT.FORCEMOVE] += 1
		this.adice = 0
		this.game.pendingObs=0   //강제이동시 장애물무시
		this.checkWay2ForGoto(pos)

		this.changePos(pos)

		this.resetEffect(ENUM.EFFECT.STUN)
		this.invulnerable=false
		// this.stun = false

		let t = this.turn
		server.tp(this.game.rname, t, pos, movetype)

		if (!ignoreObstacle) {
			if (this.game.instant) {
				this.arriveAtSquare(true)
			} else {
				setTimeout(() => {
					this.arriveAtSquare(true)
				}, (movetype==="simple"?700:1100))
			}
		}
	}

	isBehindOf(other: Player): boolean {
		return this.pos < other.pos
	}
	//========================================================================================================

	resetCooltime(list: number[]) {
		this.message(this.name + "`s cooltime has been reset")
		for (let i of list) {
			this.cooltime[i] = 0
		}
	}
	/**
	 * 스킬사용후 쿨타임 시작
	 * @param {} skill 스킬종류,0에서시작
	 */
	startCooltime(skill: number) {
		this.cooltime[skill] = this.cooltime_list[skill]
		if (skill === ENUM.SKILL.ULT) {
			this.cooltime[skill] -= this.ultHaste
		}
	}
	/**
	 * 
	 * @param skill skill
	 * @param amt has to be positive
	 */
	setCooltime(skill:number,amt:number){
		this.cooltime[skill]=amt
	}

	isSkillActivated(skill: number) {
		return this.duration[skill] > 0
	}

	//========================================================================================================

	/**
	 *
	 * @param {*} m
	 * @param {*} type 0: 돈 받음  1:돈 소모 2:돈 뺏김
	 */
	changemoney(m: number, type: number) {
		//사채
		if (type === ENUM.CHANGE_MONEY_TYPE.EARN && this.haveEffect(ENUM.EFFECT.PRIVATE_LOAN)) {
			return
		}
		if (m === 0) {
			return
		}
		this.money += m

		switch (type) {
			case ENUM.CHANGE_MONEY_TYPE.EARN: //money earned
				this.stats[ENUM.STAT.MONEY_EARNED] += m
				if (this.game.instant) return
				server.changeMoney(this.game.rname, this.turn, m, this.money)
				break
			case ENUM.CHANGE_MONEY_TYPE.SPEND: //money spend
				this.stats[ENUM.STAT.MONEY_SPENT] += -1 * m
				if (this.game.instant) return
				server.changeMoney(this.game.rname, this.turn, 0, this.money) //0일 경우 indicator 는 표시안됨

				break
			case ENUM.CHANGE_MONEY_TYPE.TAKEN: //money taken
				this.stats[ENUM.STAT.MONEY_TAKEN] += -1 * m
				if (this.game.instant) return
				server.changeMoney(this.game.rname, this.turn, m, this.money)
				break
		}
	}
	//========================================================================================================

	changeToken(token: number) {
		this.token += token
		server.update(this.game.rname, "token", this.turn, this.token)
		console.log("token" + token)
	}
	//========================================================================================================

	changeLife(life: number) {
		this.life = Math.max(this.life + life, 0)
		server.update(this.game.rname, "life", this.turn, this.life)
	}
	//========================================================================================================
	incrementKda(type: string) {
		switch (type) {
			case "k":
				this.kill += 1
				break
			case "d":
				this.death += 1
				break
			case "a":
				this.assist += 1
				break
		}
		console.log("incrementKda " + type)

		let str = this.kill + "/" + this.death + "/" + this.assist

		if (this.game.instant) return
		server.update(this.game.rname, "kda", this.turn, str)
	}

	/**
	 * 캐릭터 외형 변경
	 * @param name name of that apperance
	 * set to default if name===""
	 */
	changeApperance(name: string) {
		server.update(this.game.rname, "appearance", this.turn, name)
	}

	/**
   * 체력 바꾸고 클라로 체력변화 전송
   * @param {*}data Util.HPChangeData

   */
	changeHP_damage(data: Util.HPChangeData) {
		if (this.dead) {
			return
		}
		let hp = data.hp

		if (hp > -4000) {
			 if (data.source >= 0) {
				this.stats[ENUM.STAT.DAMAGE_TAKEN_BY_CHAMP] += -1 * hp
			} //챔피언에게 받은 피해
			else {
				this.stats[ENUM.STAT.DAMAGE_TAKEN_BY_OBS] += -1 * hp
			} //장애물에게 받은 피해
		}
		this.MaxHP += data.maxHp
		this.HP = Math.min(this.HP + hp, this.MaxHP)

		if (this.game.instant) return

		let isblocked=data.hasFlag(Util.HPChangeDataFlag.SHIELD)

		if (hp <= 0 || isblocked || data.hasFlag(Util.HPChangeDataFlag.NODMG_HIT)) {
			let hpChangeData = {
				turn: this.turn,
				hp: hp,
				maxhp: data.maxHp,
				currhp: this.HP,
				currmaxhp: this.MaxHP,
				skillfrom: data.source,
				type: data.type,
				needDelay: data.needDelay,
				killed: data.killedByDamage,
				willRevive: data.willRevive,
				skillTrajectorySpeed: data.skillTrajectorySpeed,
				isBlocked:isblocked
			}
			
			server.changeHP_damage(this.game.rname, hpChangeData)
		}
	}

	/**
   * 체력 바꾸고 클라로 체력변화 전송
   * @param {*}data Util.HPChangeData

   */
	changeHP_heal(data:Util.HPChangeData){
		if (!data.isRespawn && this.dead) {
			return
		}
		let hp = data.hp
		this.stats[ENUM.STAT.HEAL_AMT] += hp

		this.MaxHP += data.maxHp
		this.HP = Math.min(this.HP + hp, this.MaxHP)


		if (this.game.instant) return
		if(hp>0){
			let changeData={
				turn: this.turn,
				hp: hp,
				maxhp: data.maxHp,
				currhp: this.HP,
				currmaxhp: this.MaxHP,
				skillfrom: data.source,
				type: data.type,
			}
			server.changeHP_heal(this.game.rname, changeData)
		}
		
	}

	//========================================================================================================

	/**
	 *
	 * @param {*} shield 변화량 + or -
	 * @param {*} noindicate 글자 표시할지 여부
	 */
	setShield(shield: number, noindicate: boolean) {
		let change = shield - this.shield
		this.shield = shield
		if (this.game.instant) return
		server.changeShield(this.game.rname, {
			turn: this.turn,
			shield: this.shield,
			change: change,
			indicate: !noindicate
		})
	}
	//========================================================================================================

	/**
	 *
	 * @returns died
	 */
	giveDamageWhenMove() {
		let died = false
		if (this.nextdmg !== 0) {
			died = this.doObstacleDamage(this.nextdmg, "explode")
			this.nextdmg = 0
		}
		return died
	}
	//========================================================================================================

	killplayer() {
		this.doObstacleDamage(9999,"stab")
	}
	//========================================================================================================

	getPossiblePosList(): number[] {
		let list = []
		let offset = 1
		let increase = 1
		if (this.haveEffect(ENUM.EFFECT.SLOW)) {
			offset = -1
		}
		if (this.haveEffect(ENUM.EFFECT.SPEED)) {
			offset = 3
		}
		offset += this.adice
		if (this.haveEffect(ENUM.EFFECT.DOUBLEDICE)) {
			increase = 2
		}
		if (this.haveEffect(ENUM.EFFECT.BACKDICE)) {
			increase *= -1
			offset *= -1
		}

		for (let i = offset, n = 0; n < 6; i += increase, ++n) {
			if (this.pos + i < MAP.get(this.mapId).finish) {
				list.push(this.pos + i)
			}
		}
		return list
	}

	getWorstDice(): number {
		let list = this.getPossiblePosList()
		if (list.length === 0) {
			return 1
		}
		let worst = 5
		let dice = 1
		let searchto=list.length - Math.floor(Math.random()*4)   //앞으로 3~6칸(랜덤)중 선택함
		for (let i = 0; i < searchto; ++i) {
			let obs = MAP.get(this.mapId).coordinates[list[i]].obs
			//상점
			if (obs === 0 && worst > 0 && i > 1) {
				break
			}

			if (list[i] > 0) {
				if (obsInfo.obstacles[obs].val < worst) {
					worst = obsInfo.obstacles[obs].val
					dice = i + 1
				}
			}
		}
		if (Math.random() < 0.8 && worst < 0) return dice   //가장 나쁜장애물이 -1 이하이면 그대로 반환
		else if (this.haveEffect(ENUM.EFFECT.BACKDICE)) return 6
		else return 1
	}
	//========================================================================================================

	sellToken(info: any) {
		this.changeToken(-1 * info.token)
		this.giveMoney(info.money)
		this.message(this.name + " sold token, obtained " + info.money + "$!")
	}
	//========================================================================================================

	arriveAtSquare(isForceMoved: boolean): number {
		if (this.dead) {
			return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
		}

		if (this.pos < 0) {
			this.pos = 0
		}

		if (this.pos >= MAP.getFinish(this.mapId) && this.onMainWay) {
			if (this.haveEffect(ENUM.EFFECT.SLAVE)) {
				this.pos = MAP.getFinish(this.mapId) - 1
				this.killplayer()
				this.message(this.name + " has been finally freed from slavery")
				return 0
			} else {
				this.game.gameover = true
				return ENUM.ARRIVE_SQUARE_RESULT_TYPE.FINISH
			}
		}

		let obs = MAP.get(this.mapId).coordinates[this.pos].obs

		if (obs !== 0) {
			this.checkProjectile()
		}

		if (this.haveEffect(ENUM.EFFECT.STUN)) {
			//카지노, 사형제판 속박 무시
			if (!(obs === 38 || obs === 37)) {
				this.basicAttack()
				return ENUM.ARRIVE_SQUARE_RESULT_TYPE.STUN
			}
		}

		obs = this.obstacle(obs, isForceMoved)

		this.basicAttack()

		return obs
	}

	/**

	 */
	/**
	 *
	 * @param {*} obs obstacle id
	 * @param {*} isForceMoved whether it is forcemoved
	 * @returns
	 */
	obstacle(obs: number, isForceMoved: boolean): number {
		let others: Player[] = []
		const pendingObsList = [21, 33, 37, 38, 63, 67]
		//  if(obs===-1){return 'finish'}
		if (obs === 0) {
			this.invulnerable = true
			this.effects.obs[ENUM.EFFECT.SILENT] += 1  //cant use skill in the store
			// server.update(this.game.rname, "removeEffect", this.turn, 3)
			this.goStore(false)
			return ENUM.ARRIVE_SQUARE_RESULT_TYPE.STORE
		}
		//투명화
		if (this.haveEffect(ENUM.EFFECT.INVISIBILITY)) {
			return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
		}

		// if (obs === 1 || obs === 2 || obs === 3 || obs === 47) {
		let money = MAP.get(this.mapId).coordinates[this.pos].money * 10
		if (money > 0) {
			this.giveMoney(money)
		}

		// }

		// 0 상점 1,2,3 돈 4덫 5강도 6포탑 7지뢰 8 칼 9열매
		// 10수면제 11물약 12마법성 13 거미줄
		//  14도박 15도둑 16눈덩이 17흡혈 18소매 19소환 20위치교환 21
		//  신손 22 연금 23날강도 24대피소 25방어막
		//   26대전자 27살인법 28 독거미줄 29 독 30폭탄 31핵폭탄 32 방사능
		//    33납치 34노예 35수용소 36 태풍  37사형재판 38카지노
		//obs=21
		try {
			switch (obs) {
				case 4:
					this.doObstacleDamage(10,"trap")
					break
				case 5:
					this.takeMoney(30)
					break
				case 7:
					this.nextdmg = 30
					break
				case 8:
					this.doObstacleDamage(20, "knife")
					break
				case 9:
					this.heal(50)
					break
				case 10:
					this.applyEffectBeforeSkill(ENUM.EFFECT.SILENT, 1)
					break
				case 11:
					this.resetCooltime([0, 1])
					this.cooltime[2] = Math.floor(this.cooltime[2] / 2)
					break
				case 12:
					this.adamage = 30
					// this.message(this.name + ": skill range x3, additional damage 30")
					break
				case 13:
					this.applyEffectBeforeSkill(ENUM.EFFECT.STUN, 1)
					break
				case 14:
					let d = Math.floor(Math.random() * 6) + 1
					this.giveMoney(d * 10)
					break
				case 15:
					let m3 = Math.floor(this.money / 10)
					others = this.getPlayersByCondition(-1, false, true, true, false)
					this.takeMoney(m3 * others.length)
					for (let o of others) {
						o.giveMoney(m3)
					}

					break
				case 16:
					this.applyEffectBeforeSkill(ENUM.EFFECT.SLOW, 1)
					this.doObstacleDamage(20,"hit")
					break
				case 17:
					others = this.getPlayersByCondition(-1, false, true, false, false)
					this.doObstacleDamage(20 * others.length, "hit")
					for (let o of others) {
						o.heal(20)
					}
					break
				case 18:
					others = this.getPlayersByCondition(-1, false, true, true, false)
					this.takeMoney(30 * others.length)
					for (let o of others) {
						o.giveMoney(30)
					}
					break
				case 19:
					others = this.getPlayersByCondition(20, false, true, false, true)
					for (let o of others) {
						o.goto(this.pos, true, "simple")
					}
					break
				case 20:
					// if (isForceMoved) {
					// 	return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
					// }
					let target = this.getNearestPlayer(40, true, false)
					if (target != null && target.pos != this.pos) {
						let pos = this.pos
						this.goto(target.pos, false, "simple")
						target.goto(pos, true, "simple")
						others.push(target)
					}
					break
				case 21:
					//godhand
					break
				case 22:
					this.applyEffectBeforeSkill(ENUM.EFFECT.ANNUITY, 99999)
					break
				case 23:
					this.takeMoney(30)
					this.doObstacleDamage(30,"knife")
					break
				case 24:
					this.applyEffectBeforeSkill(ENUM.EFFECT.SHIELD, 99999)
					this.applyEffectBeforeSkill(ENUM.EFFECT.INVISIBILITY, 1)
					this.heal(70)
					break
				case 25:
					this.applyEffectBeforeSkill(ENUM.EFFECT.SHIELD, 99999)
					break
				case 26:
					this.nextdmg = 70
					break
				case 27:
					this.doObstacleDamage(100,"knife")
					break
				case 28:
					this.applyEffectBeforeSkill(ENUM.EFFECT.STUN, 1)
					this.applyEffectBeforeSkill(ENUM.EFFECT.SLOW, 2)
					break
				case 29:
					this.applyEffectBeforeSkill(ENUM.EFFECT.POISON, 99999)
					break
				case 30:
					this.doObstacleDamage(Math.floor(this.HP / 3),  "explode")
					break
				case 31:
					this.doObstacleDamage(Math.floor((this.MaxHP - this.HP) / 2),  "explode")
					this.applyEffectBeforeSkill(ENUM.EFFECT.RADI, 1)
					break
				case 32:
					this.applyEffectBeforeSkill(ENUM.EFFECT.RADI, 1)
					break
				case 33:
					// kidnap
					if (this.AI) {
						if (this.HP > 300) {
							this.doObstacleDamage(300, "stab")
						} else {
							this.applyEffectBeforeSkill(ENUM.EFFECT.STUN, 2)
						}
					}
					break
				case 34:
					this.applyEffectBeforeSkill(ENUM.EFFECT.SLAVE, 99999)
					break
				case 35:
					this.applyEffectBeforeSkill(ENUM.EFFECT.STUN, 3)
					this.applyEffectBeforeSkill(ENUM.EFFECT.SPEED, 4)
					break
				case 36:
					if (!isForceMoved) {
						this.goto(this.lastpos, false, "levitate")
					}
					break
				case 37:
					//trial
					if (this.AI) {
						let d = Math.floor(Math.random() * 6) + 1
						this.trial(d)
					}
					break
				case 38:
					//casino
					if (this.AI) {
						let d = Math.floor(Math.random() * 6) + 1
						this.casino(d)
					}
					break
				case 39:
					this.applyEffectBeforeSkill(ENUM.EFFECT.DOUBLEDICE, 1)
					break
				case 40:
					this.applyEffectBeforeSkill(ENUM.EFFECT.BACKDICE, 1)
					break
				case 41:
					this.applyEffectBeforeSkill(ENUM.EFFECT.STUN, 1)
					break
				case 42:
					this.heal(50)
					break
				case 43:
					this.applyEffectBeforeSkill(ENUM.EFFECT.POISON, 3)
					break
				case 44:
					this.doObstacleDamage(40, "knife")
					break
				case 45:
					this.applyEffectBeforeSkill(ENUM.EFFECT.BLIND, 3)
					break
				case 46:
					this.applyEffectBeforeSkill(ENUM.EFFECT.SLOW, 1)
					this.doObstacleDamage(30, "hit")
					break
				case 48:
					break
				case 49:
					this.takeMoney(30)
					this.doObstacleDamage(30, "knife")
					break
				case 50:
					this.giveIgniteEffect(3, -1)
					this.doObstacleDamage(30,  "knife")
					break
				case 51:
					this.applyEffectBeforeSkill(ENUM.EFFECT.INVISIBILITY, 1)
					break
				case 52:
					this.doObstacleDamage(75, "lightning")
					others = this.getPlayersByCondition(3, false, false, false, true)
					for (let p of others) {
						p.doObstacleDamage(75, "lightning")
					}
					break
				case 53:
					let died = this.doObstacleDamage(30, "wave")
					if (!died) {
						this.goto(this.pos - 3, false, "simple")
					}

					others = this.getPlayersByCondition(-1, false, false, false, true)
					for (let p of others) {
						let died = p.doObstacleDamage(30,  "wave")
						if (!died) {
							p.goto(p.pos - 3, false, "simple")
						}
					}
					break
				case 54:
					others = this.getPlayersByCondition(20, false, false, false, true)

					for (let o of others) {
						o.goto(this.pos, true, "simple")
					}
					break
				case 55:
					let r = Math.floor(Math.random() * 10)
					this.goto(this.pos - 3 + r, false, "levitate")
					break
				case 56:
					let allplayers = this.getPlayersByCondition(30, false, true, false, true)
					if (allplayers.length !== 0) {
						let r2 = Math.floor(Math.random() * allplayers.length)
						this.goto(allplayers[r2].pos, true, "levitate")
					}
					break
				case 57:
					this.nextdmg = 70
					break
				case 58:
					this.doObstacleDamage(120, "explode")
					break
				case 59:
					this.applyEffectBeforeSkill(ENUM.EFFECT.SPEED, 3)
					break
				case 60:
					this.giveIgniteEffect(3, -1)
					this.doObstacleDamage(Math.floor(this.MaxHP / 4), "explode")
					break
				case 61:
					this.doObstacleDamage(175, "explode")
					break
				case 62:
					this.changeToken(10)
					this.loanTurnLeft = 5
					break
				case 63:
					//Threaten
					break
				case 64:
					this.applyEffectBeforeSkill(ENUM.EFFECT.PRIVATE_LOAN, 2)
					break
				case 65:
					this.takeMoney(Math.floor(this.money / 2))
					this.changeToken(-1 * Math.floor(this.token / 2))
					break
				case 66:
					this.applyEffectBeforeSkill(ENUM.EFFECT.ANNUITY_LOTTERY, 9999)
					break
				case 67: //coin store
					if (this.haveEffect(ENUM.EFFECT.PRIVATE_LOAN)) {
						obs = ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
					}
					break
				case 68:
					// street_vendor
					this.goStore(true)
					break
				case 69:
					let m1 = 0
					for (let p of this.game.players) {
						m1 += p.stats[ENUM.STAT.MONEY_EARNED]
					}
					if (Math.random() > 0.93) {
						this.giveMoney(m1)
						this.message(" won the lottery! earned" + m1 + "$")
					}

					break
				case 70:
					let m2 = 0
					others = this.getPlayersByCondition(-1, false, true, true, false)
					for (let p of others) {
						m2 += p.token * 2
						m2 += Math.floor(p.money * 0.05)
						p.takeMoney(m2)
					}

					this.giveMoney(m2)
					break
				case 71:
					this.thief()
					break
				case 72:
					this.applyEffectBeforeSkill(ENUM.EFFECT.BAD_LUCK, 2)
					break
				case 73:
					this.doObstacleDamage(Math.floor(this.money / 2), "hit")
					break
				case 74:
					if (!this.AI) {
						if (this.money < 150 && this.token < 10) {
							this.killplayer()
							// this.message("can pass only if you have\n more than 150$ or 10 tokens")
						}
					} else if (this.money < 100 && this.token < 10) {
						this.killplayer()
					}
			}
		} catch (e) {
			console.error(e)
			return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
		}

		//not ai, not pending obs and forcemoved, not arrive at none
		if (!this.AI && !(pendingObsList.indexOf(obs) > -1 && isForceMoved) && obs != ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE) {
			server.indicateObstacle(this.game.rname, this.turn, obs)
		}

		for (let p of others) {
			server.indicateObstacle(this.game.rname, p.turn, obs)
		}

		return obs
	}

	goStore(street_vendor: boolean) {
		if (this.game.instant) return
		server.goStore(this.game.rname, this.turn, this.getStoreData(street_vendor ? 1.2 : 1))
	}
	/**
	 * @return 위치가 가장 뒤면 true
	 */
	isLast(): boolean {
		let pos = this.pos
		return !this.players.some(function (p: Player) {
			return p.pos < pos
		})
	}
	//========================================================================================================
	/**
	 * levels up if avaliable
	 */
	lvlup() {
		let respawn = MAP.getRespawn(this.mapId)
		for (let i = 1; i < respawn.length; ++i) {
			if (this.pos >= respawn[i] && this.level <= i && this.onMainWay) {
				this.addMaxHP(this.hpGrowth)
				this.MR += this.players.length * 5
				this.AR += this.players.length * 5
				this.AD += 10
				this.level += 1

				this.changeStat()
				this.resetEffect(ENUM.EFFECT.ANNUITY_LOTTERY) //연금복권 끝

				if (this.level === 3) {
					this.cooltime[2] = 4
				}
				this.thisLevelDeathCount = 0

				break
			}
		}
	}
	//게임 길어지는거 방지용 저항 추가부여
	addExtraResistance(amt: number) {
		this.MR += amt
		this.AR += amt
		this.changeStat()
	}
	//========================================================================================================

	thief() {
		let itemhave = []
		for (let i of ItemList) {
			if (this.haveItem(i.id - 1) && i.itemlevel === 1) {
				itemhave.push(i.id - 1)
			}
		}

		if (itemhave.length === 0) {
			return
		}
		let thiefitem = itemhave[Math.floor(Math.random() * itemhave.length)]
		this.message(this.name + "`s` " + ItemList[thiefitem].name + " got stolen!")
		//	this.item[thiefitem] -= 1
		this.changeOneItem(thiefitem, -1)
		server.update(this.game.rname, "item", this.turn, this.item)
	}
	//========================================================================================================
	/**
	 * 범위내에서 가장가까운 플레이어 반환
	 * @param {} range
	 * @param {*} includeInvulnerable
	 * @param {*} includeDead
	 */
	getNearestPlayer(range: number, includeInvulnerable: boolean, includeDead: boolean) {
		let dist = 200
		let target = null
		for (let p of this.players) {
			if (p !== this && this.distance(this, p) < dist && this.distance(this, p) < range) {
				if (includeInvulnerable && !(!includeDead && p.dead)) {
					target = p
					dist = this.distance(this, p)
				} else if (!p.invulnerable && !p.haveEffect(ENUM.EFFECT.INVISIBILITY)) {
					target = p
					dist = this.distance(this, p)
				}
			}
		}
		return target
	}
	//========================================================================================================
	giveIgniteEffect(dur: number, source: number) {
		this.applyEffectBeforeSkill(ENUM.EFFECT.IGNITE, dur)
		this.igniteSource = source
	}

	// haveEffect(effect: number) {
	// 	return this.effects[effect] > 0
	// }
	resetEffect(effect: number) {
		this.effects.obs[effect] = 0
		this.effects.skill[effect] = 0
		server.update(this.game.rname, "removeEffect", this.turn, effect)
	}
	/**
	 *
	 * @param {*} e 이펙트 ID
	 * @param {*} dur 지속시간
	 * @param {*} num 번호
	 */
	giveEffect(effect: number, dur: number, type: string) {
		if (dur === 0) return

		let num=this.game.totalEffectsApplied%3
		this.game.totalEffectsApplied+=1

		//장화로 둔화 무시
		if (effect === ENUM.EFFECT.SLOW && this.haveItem(29)) {
			return
		}

		server.giveEffect(this.game.rname, this.turn, effect, num)
		

		//이펙트 부여하자마자 바로 쿨다운 하기 때문에 지속시간 +1 해줌
		if(type==="obs"){
			this.effects.obs[effect] = Math.max(dur, this.effects.obs[effect])
		}
		else if(type==="skill"){
			this.effects.skill[effect] = Math.max(dur, this.effects.skill[effect])
		}
		
		// if (effect === ENUM.EFFECT.STUN) {
		// 	this.stun = true
		// }

		if (this.game.instant) return
		
	}

	applyEffectBeforeSkill(effect:number,dur:number){
		this.giveEffect(effect,dur+1,"obs")
	}
	applyEffectAfterSkill(effect:number,dur:number){
		this.giveEffect(effect,dur+1,"skill")
	}
	applyEffectBeforeDice(effect:number,dur:number){
		this.giveEffect(effect,dur,"obs")
	}


	cooldownEffectsBeforeSkill(){
		for(let i=0;i<this.effects.obs.length;++i){
			if(this.effects.obs[i]===1 && this.effects.skill[i]===0){
				server.update(this.game.rname, "removeEffect", this.turn, i)
			}
		}
		this.effects.obs = this.effects.obs.map(Util.decrement)
		
	}	


	cooldownEffectsAfterSkill(){
		for(let i=0;i<this.effects.skill.length;++i){
			if(this.effects.skill[i]===1 && this.effects.obs[i]===0){
				server.update(this.game.rname, "removeEffect", this.turn, i)
			}
		}
		this.effects.skill = this.effects.skill.map(Util.decrement)
	}



	haveEffect(effect:number){
		return this.effects.obs[effect]>0 ||  this.effects.skill[effect]>0
	}

	resetAllEffects(){
		for(let i=0;i<this.effects.obs.length;++i){
			this.effects.obs[i] = 0
			this.effects.skill[i] = 0
		}
	}

	giveMoney(m: number) {
		this.changemoney(m, ENUM.CHANGE_MONEY_TYPE.EARN)
	}
	//========================================================================================================

	takeMoney(m: number) {
		this.changemoney(-1 * m, ENUM.CHANGE_MONEY_TYPE.TAKEN)
	}
	//========================================================================================================

	heal(h: number) {
		this.changeHP_heal(new Util.HPChangeData().setHpChange(h).setType("heal"))
	}
	//========================================================================================================

	addMaxHP(m: number) {
		this.changeHP_heal(new Util.HPChangeData().setMaxHpChange(m))
	}
	//========================================================================================================

	regeneration() {
		if (this.regen > 0) {
			this.changeHP_heal(new Util.HPChangeData().setHpChange(this.regen))
		}
		//1등급 재생열매 효과
		if (this.haveItem(9)) {
			this.changeHP_heal(new Util.HPChangeData().setHpChange(Math.floor(this.MaxHP * 0.05)))
		}
	}
	//========================================================================================================
	//모든피해 흡혈
	absorb_hp(damage: number) {
		this.changeHP_heal(new Util.HPChangeData().setHpChange(5 + Math.floor((damage * this.absorb) / 100)))
	}
	//========================================================================================================

	addShield(s: number) {
		this.setShield(s, false)
	}
	//========================================================================================================

	addKill(deadplayer: Player) {
		this.incrementKda("k")
		//선취점
		let totalkill = this.players.reduce(function (t, a) {
			return t + a.kill
		}, 0)
		if (totalkill === 0) {
			this.changemoney(100, 0)
			this.message(this.name + ", First Blood!")
		} else {
			this.changemoney(
				70 + 10 * this.thisLifeKillCount + 20 * deadplayer.thisLifeKillCount,
				ENUM.CHANGE_MONEY_TYPE.EARN
			)
		}
		this.oneMoreDice = true
		this.diceControl = true
		this.diceControlCool = SETTINGS.DC_COOL
		this.thisLifeKillCount += 1

		if (this.thisLifeKillCount > this.bestMultiKill) this.bestMultiKill = this.thisLifeKillCount

		// this.giveEffect('speed',1,1)
	}

	/**
	 * sterp before givedamage
	 * @param damage 
	 * @param origin 
	 * @param type 
	 * @param needDelay 
	 * @param flags 
	 */
	doPlayerDamage(damage:number,origin:number,type:string, needDelay: boolean,flags?:Util.HPChangeDataFlag[]):boolean{
		let changeData = new Util.HPChangeData()
		.setSource(origin)
		.setType(type)
		.setSkillTrajectorySpeed(this.players[origin].getSkillTrajectorySpeed(type)) 

		if (needDelay) changeData.setDelay()
		if(flags!=null){
			for(let f of flags){
				changeData.addFlag(f)
			}
		}
		
		return this.doDamage(damage,changeData)
		
	}

	/**
	 * step before givedamage 
	 * @param damage 
	 * @param type 
	 */
	doObstacleDamage(damage:number,type?:string):boolean{
		let changeData = new Util.HPChangeData()
		.setSource(-1)

		if(type!=null){
			changeData.setType(type)
		}
		
		return this.doDamage(damage,changeData)
	}

	/**
	 * common damage giver for skill and obstacles
	 * 
	 * 1. 무적 여부 체크
	 * 2. 방사능 체크
	 * 3. 어시스트용 array 에 데미지 근원 기록
	 * 4. 방어막 적용
	 * 5. 체력 바꿈
	 * 6. 죽었을경우 체크
	 * @param damage 총 합 데미지
	 * @param  skillfrom  starts with 0   ,obstacle:-1
	 * @param type: string
	 * @return 죽으면 true 아니면 false
	 */
	doDamage(damage: number,changeData:Util.HPChangeData) {

		try {
			if (damage === 0 && changeData.hasFlag(Util.HPChangeDataFlag.SHIELD)) {
				this.changeHP_damage(changeData)
				return false
			} else if ( changeData.hasFlag(Util.HPChangeDataFlag.NODMG_HIT)) {
				this.changeHP_damage(changeData)
				return false
			}

			if (this.invulnerable || damage === 0) {
				return false
			}

			if (this.haveEffect(ENUM.EFFECT.RADI)) {
				damage *= 2
			}
			if (changeData.source >= 0) {
				this.damagedby[changeData.source] = 3
				this.players[changeData.source].absorb_hp(damage)  //모든피해흡혈, 어시스트저장
			} else if (changeData.source === -1) {
				damage *= 1 - this.obsR / 100 //장애물 저항
			}

			damage -= this.shield

			//if shield absorb all damage and left
			if (damage <= 0) {
				this.setShield(-1 * Math.floor(damage), false)
				this.stats[ENUM.STAT.DAMAGE_REDUCED] += -1 * damage
				damage = 0

				this.showEffect(changeData.type,changeData.source)
				return false
			} //if shield exist but can`t absorb all damage
			else if (this.shield > 0) {
				this.stats[ENUM.STAT.DAMAGE_REDUCED] += this.shield
				this.setShield(0, false)
			}

			let reviveType = this.canRevive()
			if (this.HP - damage <= 0) {
				if (reviveType == null) {
					changeData.setKilled()
				} else {
					//revive
					changeData.setWillRevive()
				}
			}
			this.changeHP_damage(changeData.setHpChange(-1 * Math.floor(damage)))

			if (this.HP <= 0) {
				this.resetAllEffects()

				if (reviveType == null) {
					this.die(changeData.source)
					if (changeData.source >= 0) {
						this.players[changeData.source].addKill(this)
						this.thisLifeKillCount = 0
					} else {
						this.stats[ENUM.STAT.EXECUTED] += 1
					}
					return true
				} else {
					this.prepareRevive(reviveType)
					return false
				}
			}
			return false
		} catch (e) {
			console.error(e)
			return false
		}
	}

	canRevive(): string {
		if (this.life > 0) return "life"

		if (this.isActiveItemAvaliable(15)) return "guardian_angel"

		return null
	}

	prepareRevive(reviveType: string) {
		if (reviveType === "life") this.changeLife(-1)

		if (reviveType === "guardian_angel") this.useActiveItem(15)

		this.waitingRevival = true
		this.HP = 0
		this.dead = true
	}

	sendKillInfo(skillfrom: number, gostore: boolean) {
		if (this.game.instant) return

		let storeData = null
		if (gostore) {
			storeData = this.getStoreData(1)
		}
		let killData = {
			skillfrom: skillfrom,
			turn: this.turn,
			location: this.pos,
			storeData: storeData,
			isShutDown: false,
			killerMultiKillCount: 1
		}

		//상대에게 죽은경우
		if (skillfrom >= 0) {
			console.log("sendkillinfo skillfrom " + skillfrom)
			let killerMultiKillCount = this.players[skillfrom].thisLifeKillCount + 1
			let isShutDown = this.thisLifeKillCount > 1
			killData.isShutDown = isShutDown
			killData.killerMultiKillCount = killerMultiKillCount
		}

		server.die(this.game.rname, killData)
	}

	/**
	 * 1. 메세지 전송
	 * 2. 어시스트 기록
	 * 3. 다음턴데미지, 이펙트, 스킬지속시간, 투사체 초기화
	 * 4. 리스폰지점으로 이동
	 * @param {*} skillfrom 0에서시작
	 */
	die(skillfrom: number) {
		if (skillfrom > 0) {
			this.message(this.players[skillfrom].name + " killed" + this.name)
		} else {
			this.message(this.name + " has been executed!")
		}
		this.game.addKillData(skillfrom, this.turn, this.pos)

		this.Assist(skillfrom)
		this.HP = 0
		this.dead = true

		this.incrementKda("d")
		this.nextdmg = 0
		this.damagedby = [0, 0, 0, 0]

		this.setAllSkillDuration([0, 0, 0])
		this.invulnerable = true
		this.stun = false
		this.signs = []
		this.skilleffects = []
		this.onMainWay = true
		this.oneMoreDice = false
		for (let p of this.projectile) {
			p.remove()
		}
		this.projectile = []
		this.thisLevelDeathCount += 1

		this.pos = this.getRespawnPoint()
		console.log("respawn pos" + this.pos)
		//this.giveEffect('silent',1,-1)
		let gostore = MAP.getStore(this.mapId).indexOf(this.pos) !== -1
		if (gostore && this.AI) {
			this.aiStore()
		}

		this.sendKillInfo(skillfrom, gostore)
	}

	//========================================================================================================

	getRespawnPoint(): number {
		let res = MAP.getRespawn(this.mapId)

		return res[this.level - 1]
	}

	//========================================================================================================

	respawn() {
		let health = this.MaxHP
		if (this.waitingRevival) {
			health /= 2
			this.stats[ENUM.STAT.REVIVE] += 1
		}

		this.changeHP_heal(new Util.HPChangeData().setHpChange(health).setRespawn())
		this.dead = false
		console.log("revive" + this.HP)
		server.respawn(this.game.rname, this.turn, this.pos, this.waitingRevival)

		this.waitingRevival = false
	}

	//========================================================================================================
	/**
	 * 3턴 이내에 피해를 준 플레이어가 사망
	 * @param {*} skillfrom
	 */
	Assist(skillfrom: number) {
		//let assists=[]
		for (let i = 0; i < this.players.length; ++i) {
			if (this.damagedby[i] > 0 && this.turn !== i && skillfrom !== i) {
				if (skillfrom === i) {
					continue
				}

				this.players[i].incrementKda("a")
				this.players[i].changemoney(25, ENUM.CHANGE_MONEY_TYPE.EARN)
				this.message(this.players[i].name + " assist!")
				//assists.push(this.players[i])
			}
		}
		// return assists
	}

	getBaseBasicAttackDamage():Util.Damage{
		return new Util.Damage(this.AD,0,0)
	}
	getBasicAttackName(): string {
		return "basicattack"
	}


	basicAttack() {
		let range = this.attackRange

		for (let p of this.players) {
			if (Math.abs(this.pos - p.pos) <= range && this.isValidOpponent(p)) {
				this.hitBasicAttack(p)
				if (!p.dead && p.pos === this.pos && p.turn !== this.turn) {
					p.hitBasicAttack(this)
				}
			}
		}
	}
	//========================================================================================================

	hitBasicAttack(target: Player): boolean {
		if (this.haveSkillEffect("timo_q") || this.haveEffect(ENUM.EFFECT.BLIND)) {
			return false
		}
		let damage = this.getBaseBasicAttackDamage()
			.updateAttackDamage(Util.CALC_TYPE.multiply, this.basicAttack_multiplier)
			.updateMagicDamage(Util.CALC_TYPE.plus, target.HP * this.addMdmg * 0.01)

		this.stats[ENUM.STAT.BASICATTACK] += 1
		this.stats[ENUM.STAT.DAMAGE_DEALT] += damage.getTotalDmg()

		let percentPenetration = 0

		//석궁아이템
		if (this.haveItem(31)) {
			percentPenetration = 40
		}

		let calculatedDmg = damage.mergeDamageWithResistance({
			AR: target.AR,
			MR: target.MR,
			arP: this.arP,
			MP: this.MP,
			percentPenetration
		})

		target.stats[ENUM.STAT.DAMAGE_REDUCED] += calculatedDmg.reducedDamage
		let totaldamage = calculatedDmg.damage

		if (this.haveSkillEffectAndOwner("timo_u", target.turn)) {
			totaldamage /= 2
		}
		return target.doPlayerDamage(totaldamage, this.turn, this.getBasicAttackName(), true)
	}
	//========================================================================================================
	/**
	 *
	 * @param {}} start
	 * @param {*} end
	 * @returns turn list of players in range
	 */
	getPlayersIn(start: number, end: number): number[] {
		let targets = []

		for (let p of this.players) {
			if (this.isValidOpponent(p) && p.pos >= start && p.pos <= end) {
				targets.push(p.turn)
			}
		}
		return targets
	}
	//========================================================================================================

	/**
	 * 스킬 전용
	 * 범위내의 공격 가능한 대상들의 턴 반환
	 * @param {*} range
	 * @param {*} skill_id start with 0
	 * @return 'notarget' 타깃이 없으면
	 * @return array of turns of targets
	 */
	getAvailableTarget(range: number, skill_id: number): number[] {
		let targets = []
		// console.log(this.distance(this.players[1], this))

		for (let p of this.players) {
			if (this.isValidOpponent(p)) {
				if (this.distance(p, this) <= range) {
					targets.push(p.turn)
				}
				else if (p.haveSign("silver_w", this.turn) && skill_id === ENUM.SKILL.Q && this.distance(p, this) <= range + 5) {
					targets.push(p.turn)
				}
			}
		}

		return targets
		//target choosing
	}
	//========================================================================================================

	hitOneTarget(skillto: number, skilldmgdata: Util.SkillDamage) {
		//adamage
		let skill = skilldmgdata.skill

		let died = this.players[skillto].hitBySkill(skilldmgdata.damage, this.turn, skill, skilldmgdata.onHit,this.getSkillName(skill))
		if (died && skilldmgdata.onKill) {
			skilldmgdata.onKill()
		}
	}

	/**
	 *
	 * @param {*} skilldmg  Util.Damage
	 * @param {*} skillfrom
	 * @param {*} skill_id  0~
	 * @param {*} action 데미지 준 후에 발동
	 */
	hitBySkill(skilldmg: Util.Damage, skillfrom: number, skill_id: number, onHit: Function,type?:string): boolean {
		//스킬별 이펙트표시를 위한 이름
		if(type==null){
			type = this.players[skillfrom].getSkillName(skill_id)
		}
		

		//방어막 효과
		if (this.haveEffect(ENUM.EFFECT.SHIELD)) {
			console.log("shield")
			this.resetEffect(ENUM.EFFECT.SHIELD)
			this.doPlayerDamage(0, skillfrom,type,true,[Util.HPChangeDataFlag.SHIELD])
			return false
		}
		

		skilldmg.updateMagicDamage(Util.CALC_TYPE.plus, this.HP * this.players[skillfrom].addMdmg * 0.01)
		this.players[skillfrom].stats[ENUM.STAT.DAMAGE_DEALT] += skilldmg.getTotalDmg()

		let percentPenetration = 0

		if (this.players[skillfrom].haveItem(31)) {
			percentPenetration = 40
		}

		let calculatedDmg = skilldmg.mergeDamageWithResistance({
			AR: this.AR,
			MR: this.MR,
			arP: this.players[skillfrom].arP,
			MP: this.players[skillfrom].MP,
			percentPenetration:percentPenetration
		})

		this.stats[ENUM.STAT.DAMAGE_REDUCED] += calculatedDmg.reducedDamage
		let totaldamage = calculatedDmg.damage

		if (this.players[skillfrom].haveSkillEffectAndOwner("timo_u", this.turn)) {
			totaldamage /= 2
		}

		totaldamage -= Math.floor(totaldamage * this.skillDmgReduction * 0.01)

		totaldamage += skilldmg.fixed
		totaldamage += this.players[skillfrom].adamage
	
		//still show effect even if damage is 0
		let flags=[]
		if(skilldmg.getTotalDmg()===0){
			flags.push(Util.HPChangeDataFlag.NODMG_HIT)
		}

		console.log("TYPE " + type)
		let died = this.doPlayerDamage(totaldamage, skillfrom, type,true,flags)

		if (onHit != null && !this.dead) {
			onHit(this)
		}

		return died
	}
	//========================================================================================================

	checkProjectile() {
		if (this.invulnerable) {
			return
		}
		let other = this.getPlayersByCondition(-1, false, true, false, false)
		for (let o of other) {
			for (let p of o.projectile) {
				if (p.activated && p.scope.indexOf(this.pos) !== -1) {
					this.hitBySkill(p.damage, o.turn, p.skill, p.action,p.type)
					if (p.disappearWhenStep) {
						p.remove()
					}
				}
			}
		}
	}
	//========================================================================================================

	giveSign(sign: any) {
		this.message(this.name + " got hit by" + sign.name)
		this.signs.push(sign)
	}
	//========================================================================================================

	haveSign(type: string, owner: number) {
		let o = this.signs.some((sign: any) => sign.type === type && sign.owner_turn === owner)
		return o
	}
	//========================================================================================================

	removeSign(type: string, owner: number) {
		this.signs = this.signs.filter((sign: any) => !(sign.type === type && sign.owner_turn === owner))
	}

	giveSkillEffect(effect: Util.SkillEffect) {
		this.message(this.name + " got " + effect.name + " effect")
		this.skilleffects.push(effect)
	}
	//========================================================================================================

	haveSkillEffectAndOwner(type: string, owner: number) {
		return this.skilleffects.some((ef: Util.SkillEffect) => ef.type === type && ef.owner_turn === owner)
	}
	//========================================================================================================

	haveSkillEffect(type: string) {
		return this.skilleffects.some((ef) => ef.type === type)
	}
	//========================================================================================================

	removeSkillEffect(type: string, owner: number) {
		this.skilleffects = this.skilleffects.filter((ef) => !(ef.type === type && ef.owner_turn === owner))
	}
	//========================================================================================================

	signCoolDown() {
		this.signs = this.signs.map(function (s: any) {
			s.dur = Util.decrement(s.dur)
			return s
		})
		this.signs = this.signs.filter((s: any) => s.dur > 0)
		console.log(this.signs)
	}
	//========================================================================================================

	skillEffectCoolDown() {
		this.skilleffects = this.skilleffects.map(function (s: Util.SkillEffect) {
			s.dur = Util.decrement(s.dur)
			return s
		})
		this.skilleffects = this.skilleffects.filter((s: Util.SkillEffect) => s.dur > 0)
		console.log(this.skilleffects)
	}

	haveItem(item: number): boolean {
		return this.item[item] > 0
	}

	addActiveItem(itemdata: Util.ActiveItem) {
		this.activeItems.push(itemdata)
		console.log("buy active item" + itemdata)
	}

	/**
	 * 한번이라도 산적있으면 true
	 * @param {}item_id id of item
	 * @returns
	 */
	boughtActiveItem(item_id: number) {
		return this.activeItems.some((ef: Util.ActiveItem) => ef.id === item_id)
	}

	activeItemCoolDown() {
		this.activeItems = this.activeItems.map(function (i: Util.ActiveItem) {
			i.cooltime = Util.decrement(i.cooltime)
			return i
		})
		console.log(this.activeItems)
	}

	/**
	 * 한번이라도 산적있고 지금 아이템 가지고있고 쿨타임 돌아왔으면 true
	 * @param {} item_id id of item
	 * @returns
	 */
	isActiveItemAvaliable(item_id: number) {
		// console.log(this.item + "" + this.activeItems)
		if (!this.haveItem(item_id)) return false

		return this.activeItems.some((it) => it.id === item_id && it.cooltime === 0)
	}

	/**
	 * 아이템 사용해서 쿨타임 초기화
	 * @param {} item_id id of item
	 * @returns
	 */
	useActiveItem(item_id: number) {
		let item: Util.ActiveItem = this.activeItems.filter((ef: Util.ActiveItem) => ef.id === item_id)[0]
		item.cooltime = item.resetVal
	}

	kidnap(result: boolean) {
		if (result) {
			this.applyEffectBeforeSkill(ENUM.EFFECT.STUN, 2)
		} else {
			this.doObstacleDamage(300, "stab")
		}
	}
	threaten(result: boolean) {
		if (result) {
			this.takeMoney(50)
		} else {
			this.changeToken(-3)
		}
	}
	trial(num: number) {
		console.log("trial" + num)
		switch (num) {
			case 0:
				this.takeMoney(100)
				this.message(this.name + "fine 100$")
				break
			case 1:
				this.applyEffectBeforeSkill(ENUM.EFFECT.SLAVE, 99999)
				break
			case 2:
				let target = this.getNearestPlayer(40, true, false)
				if (target !== null && target !== undefined) {
					this.goto(target.pos, true, "levitate")
				}
				break
			case 3:
				this.killplayer()
				this.message(this.name + " has been sentenced to death")
				break
			case 4:
				this.doObstacleDamage(Math.floor(this.HP / 2),  "stab")
				this.applyEffectBeforeSkill(ENUM.EFFECT.STUN, 1)
				this.message(this.name + " will get retrial")
				break
			case 5:
				for (let p of this.players) {
					let m = Math.random()
					if (m > 0.5) {
						p.killplayer()
					}
				}
				break
		}
	}
	//========================================================================================================

	casino(num: number) {
		switch (num) {
			case 0:
				this.giveMoney(100)
				break
			case 1:
				this.giveMoney(this.money)
				break
			case 2:
				this.applyEffectBeforeSkill(ENUM.EFFECT.SPEED, 2)
				break
			case 3:
				this.doObstacleDamage(Math.floor(this.HP / 2),"stab")
				break
			case 4:
				this.takeMoney(Math.floor(this.money / 2))
				break
			case 5:
				this.doObstacleDamage(50,"stab")
				this.applyEffectBeforeSkill(ENUM.EFFECT.STUN, 1)
				break
		}
	}
	//========================================================================================================

	getStoreData(priceMultiplier: number) {
		return {
			item: this.item,
			money: this.money,
			token: this.token,
			life: this.life,
			lifeBought: this.lifeBought,
			recommendeditem: this.itemtree.items,
			itemLimit: this.game.itemLimit,
			priceMultiplier: priceMultiplier
		}
	}

	changeAbility(ability: string, change_amt: number) {
		let maxHpChange = 0
		switch (ability) {
			case "HP":
				maxHpChange += change_amt
				break
			case "AD":
				this.AD += change_amt
				if (this.AD > this.AP && this.adStat > 0 && !this.adStatAD) {
					this.AP -= this.adStat
					this.AD += this.adStat
					this.adStatAD = true
				}
				break
			case "AP":
				this.AP += change_amt
				if (this.AD < this.AP && this.adStat > 0 && this.adStatAD) {
					this.AD -= this.adStat
					this.AP += this.adStat
					this.adStatAD = false
				}
				break
			case "AR":
				this.AR += change_amt
				break
			case "MR":
				this.MR += change_amt
				break
			case "arP":
				this.arP += change_amt
				break
			case "MP":
				this.MP += change_amt
				break
			case "absorb":
				this.absorb += change_amt
				break
			case "regen":
				this.regen += Math.min(30, this.skillDmgReduction + change_amt)
				break
			case "skillDmgReduction":
				this.skillDmgReduction = Math.min(75, this.skillDmgReduction + change_amt)
				break
			case "adStat":
				this.adStat += change_amt
				if (this.AD >= this.AP) {
					this.AD += change_amt
					this.adStatAD = true
				} else {
					this.AP += change_amt
					this.adStatAD = false
				}
				break
			case "addMdmg":
				this.addMdmg += change_amt
				break
			case "attackRange":
				this.attackRange = Math.min(this.attackRange + change_amt, 5)
				break
			case "obsR":
				this.obsR += change_amt
				break
			case "ultHaste":
				this.ultHaste = Math.min(this.ultHaste + change_amt, 3)
				break
			case "moveSpeed":
				this.moveSpeed = Math.min(this.moveSpeed + change_amt, 2)
				break
		}

		this.changeStat()

		return maxHpChange
	}
	changeStat() {
		let info_kor = this.getSkillInfoKor()
		let info_eng = this.getSkillInfoEng()

		if (this.game.instant) return
		server.update(this.game.rname, "stat", this.turn, {
			level: this.level,
			AD: this.AD,
			AP: this.AP,
			AR: this.AR,
			MR: this.MR,
			regen: this.regen,
			absorb: this.absorb,
			arP: this.arP,
			MP: this.MP,
			attackRange: this.attackRange,
			obsR: this.obsR,
			ultHaste: this.ultHaste,
			moveSpeed: this.moveSpeed
		})

		server.updateSkillInfo(this.game.rname, this.turn, info_kor, info_eng)
	}

	//========================================================================================================

	changeOneItem(item: number, count: number) {
		this.item[item] += count
		let maxHpChange = 0
		if (count > 0) {
			if (ItemList[item].itemlevel >= 3) {
				this.message(this.name + " bought " + count + " " + ItemList[item].name)
			}

			this.itemRecord.push({
				item_id: item,
				count: count,
				turn: this.game.totalturn
			})
		}
		for (let j = 0; j < ItemList[item].ability.length; ++j) {
			let ability = ItemList[item].ability[j]
			let change_amt = ability.value * count
			maxHpChange += this.changeAbility(ability.type, change_amt)
		}
		if (maxHpChange !== 0) {
			this.addMaxHP(maxHpChange)
		}

		if (ItemList[item].active_cooltime != null && !this.boughtActiveItem(item)) {
			this.addActiveItem({
				name: ItemList[item].name,
				id: item,
				cooltime: 0,
				resetVal: ItemList[item].active_cooltime
			})
		}
	}

	/**
	 *
	 * @param {*} data {
	 * storedata:{item:int[]}
	 * moneyspend:int
	 * }
	 */
	updateItem(data: any) {
		this.changemoney(-1 * data.moneyspend, ENUM.CHANGE_MONEY_TYPE.SPEND)
		this.changeToken(data.tokenbought)
		this.changeLife(data.life)
		this.lifeBought += data.life

		for (let i = 0; i < ItemList.length; ++i) {
			let diff = data.storedata.item[i] - this.item[i]

			if (diff === 0) {
				continue
			}
			this.changeOneItem(i, diff)
		}
		//	this.item = data.storedata.item
		if (this.game.instant) return
		server.update(this.game.rname, "item", this.turn, this.item)
	}
	//========================================================================================================

	/**
	 *  컴퓨터 아이템 구입
	 *
	 */
	aiStore() {
		console.log("aistore" + this.money)
		let list = this.itemtree
		let totalMoneySpend = 0
		let templist = this.item.map((x) => x)
		if (list.level >= 6 && this.game.mapId === 2) {
			this.aiBuyLife()
			return
		}
		while (this.money - totalMoneySpend >= 30) {
			let tobuy = 0
			if (list.level >= list.items.length) {
				tobuy = list.final
			} else {
				tobuy = list.items[list.level]
			}

			let moneyspend = this.aiAttemptItemBuy(tobuy - 1, templist, { val: totalMoneySpend }).val - totalMoneySpend
			if (moneyspend === 0) {
				break
			}
			totalMoneySpend += moneyspend
			// console.log(templist)
		}

		this.updateItem({
			storedata: {
				item: templist
			},
			moneyspend: totalMoneySpend,
			tokenbought: 0,
			life: 0,
			lifeBought: 0
		})
	}

	aiBuyLife() {
		let lifeprice = 200 * Math.pow(2, this.lifeBought)

		while (this.money >= lifeprice) {
			lifeprice = 200 * Math.pow(2, this.lifeBought)
			this.changeLife(1)
			this.lifeBought += 1
			this.changemoney(-lifeprice, ENUM.CHANGE_MONEY_TYPE.SPEND)
		}
	}
	//========================================================================================================

	isItemLimitExceeded(temp_itemlist: number[]) {
		let count = temp_itemlist.reduce((total, curr) => total + curr, 0)

		return count + 1 > this.game.itemLimit
	}
	//========================================================================================================

	/**
	 *
	 * @param {*} tobuy index of item 0~
	 * @param {*} temp_itemlist int[]
	 * @param {*} moneyspend  {val:totalmoneyspend}
	 *
	 * return moneyspend  {val:totalmoneyspend}
	 */
	aiAttemptItemBuy(tobuy: number, temp_itemlist: number[], moneyspend: { val: number }): { val: number } {
		let item = ItemList[tobuy]
		let temp_itemlist2 = temp_itemlist.map((x) => x) //이 아이템을 샀을 경우의 아이템리스트
		let price = item.price - this.calcDiscount(tobuy, temp_itemlist2)

		//구매가능
		if (this.canbuy(price, moneyspend.val) && !this.isItemLimitExceeded(temp_itemlist2) && this.checkStoreLevel(item)) {
			moneyspend.val += price
			Util.copyElementsOnly(temp_itemlist, temp_itemlist2)
			temp_itemlist[tobuy] += 1
			if (item.itemlevel === 3) {
				this.itemtree.level += 1
			}

			//불가
		} else {
			if (item.children.length === 0) {
				return { val: 0 }
			}

			let temp_itemlist3 = temp_itemlist.map((x) => x)

			for (let i = 0; i < item.children.length; ++i) {
				let child = item.children[i] - 1

				if (temp_itemlist3[child] > 0) {
					temp_itemlist3[child] -= 1
					continue
				}

				this.aiAttemptItemBuy(child, temp_itemlist, moneyspend)
			}
			temp_itemlist3 = null
		}
		return moneyspend
	}
	/**
	 * 첫번째 상점에선 2등급이상아이템 구입불가
	 * @param {} item
	 */
	checkStoreLevel(item: any) {
		if (this.level <= 2 && item.itemlevel >= 2) {
			console.log("false t")
			return false
		}
		return true
	}
	//========================================================================================================

	/**
	 * 아이템 구매가능여부
	 * @param {*} price
	 */
	canbuy(price: number, moneyspend: number): boolean {
		return price <= this.money - moneyspend
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
			if (temp_itemlist[c - 1] === 0) {
				discount += this.calcDiscount(c - 1, temp_itemlist)
			} else {
				discount += ItemList[c - 1].price
				temp_itemlist[c - 1] -= 1
			}
		}
		return discount
	}
	//========================================================================================================

	getItemNames(): string[] {
		return ItemList.map((i: any) => i.name)
	}
}

class PassProjectile {
	game: any
	type: string
	action: Function
	stopPlayer: boolean
	pos: number
	dur: number
	UPID: string

	constructor(game: any, name: string, action: Function, stopPlayer: boolean) {
		this.game = game
		this.type = name
		this.action = action
		this.pos = -1
		this.dur = 0
		this.stopPlayer = stopPlayer
		this.UPID = "" //unique projectile id:  PP1 PP2 ..
	}

	place(pos: number, upid: string) {
		this.UPID = upid
		this.pos = pos
		if (!this.game.isAttackableCoordinate(pos) && pos < MAP.get(this.game.mapId).coordinates.length) {
			this.pos += 1
		}
		server.placePassProj(this.game.rname, this.type, this.pos, this.UPID)
	}

	removeProj() {
		server.removeProj(this.game.rname, this.UPID)
	}
}

class Projectile {
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
	trajectorySpeed:number

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
		this.trajectorySpeed=builder.trajectorySpeed

		this.pos = -1
		this.activated = false
		this.scope = []
		this.UPID = "" //unique projectile id:  P1 P2 ..
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
		server.placeProj(this.owner.game.rname, {
			scope: this.scope,
			UPID: id,
			owner: this.owner.turn,
			type: this.type,
			trajectorySpeed:this.trajectorySpeed
		})
	}
	remove() {
		this.owner.projectile = this.removeProjFromList(this.owner.projectile)
		this.game.removeProjectile(this.UPID)

		server.removeProj(this.owner.game.rname, this.UPID)
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
		console.log("projCoolDown" + this.type + " " + this.dur)

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
	trajectorySpeed:number
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
		this.trajectorySpeed=0
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
	setTrajectorySpeed(speed:number){
		this.trajectorySpeed=speed
		return this
	}
	build() {
		return new Projectile(this)
	}
}

export { Player, Projectile, PassProjectile, ProjectileBuilder }
