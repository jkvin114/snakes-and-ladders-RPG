import oceanmap = require("../res/ocean_map.json")
import casinomap = require("../res/casino_map.json")
import defaultmap = require("../res/map.json")
import SETTINGS = require("../res/settings.json")

import { Creed } from "./characters/Creed"
import { Bird } from "./characters/Bird"
import { Silver } from "./characters/Silver"
import { Jean } from "./characters/Jean"
import { Jellice } from "./characters/Jellice"
import { Gorae } from "./characters/Gorae"
import { Timo } from "./characters/Timo"

import { Yangyi } from "./characters/Yangyi"

import * as ENUM from "./enum"
import * as Util from "./Util"
import {  Player } from "./player"
import {Projectile,ProjectileBuilder} from "./Projectile"
import {PassProjectile} from "./PassProjectile"


const MAP: Util.Map = new Util.Map([defaultmap, oceanmap, casinomap])

class Game {
	instant: boolean
	rname: string
	mapId: number
	simulation: boolean
	players: Player[]
	totalturn: number
	isTeam: boolean
	PNUM: number
	CNUM: number
	totalnum: number
	thisturn: number
	skilldmg: any
	skillcount: number
	clientsReady: number
	pendingObs: number
	pendingAction: string
	roullete_result: number
	nextUPID: number
	nextPassUPID: number
	activeProjectileList: Map<string, Projectile>
	passProjectileList: Map<string, PassProjectile>
	passProjectileQueue: PassProjectile[]
	gameover: boolean
	itemLimit: number
	submarine_cool: number
	submarine_id: string
	dcitem_id: string
	totalEffectsApplied: number
	shuffledObstacles: { obs: number; money: number }[]
	killRecord: {
		pos: number
		turn: number
		killer: Number
		dead: number
	}[]

	constructor(isteam: boolean, mapid: number, rname: string, simulation: boolean, instant: boolean) {
		this.instant = instant
		this.simulation = simulation
		this.rname = rname
		this.mapId = mapid //0: 오리지널  1:바다  2:카지노
		this.players = []
		this.totalturn = 0
		this.isTeam = isteam
		this.PNUM = 0
		this.CNUM = 0
		this.totalnum = 0
		this.thisturn = 0
		this.skilldmg = -1
		this.skillcount = 0
		this.clientsReady = 0
		this.pendingObs = 0
		this.pendingAction = null
		this.roullete_result = -1
		this.itemLimit = SETTINGS.itemLimit
		this.nextUPID = 1
		this.nextPassUPID = 1
		this.activeProjectileList = new Map()
		this.passProjectileList = new Map()
		this.passProjectileQueue = []
		this.gameover = false
		this.shuffledObstacles = MAP.getShuffledObstacles(this.mapId)
		this.submarine_cool = 0
		this.submarine_id = "" //잠수함의 upid
		this.dcitem_id = ""
		this.killRecord = []
		this.totalEffectsApplied = 0 //total number of effects applied until now
	}
	p(): Player {
		return this.players[this.thisturn]
	}

	//========================================================================================================

	//client:Socket(),team:number,char:int,name:str
	addPlayer(team: boolean | string, char: number, name: string) {
		console.log("add player " + char + "  " + team)
		let p = null
		char = Number(char)
		switch (char) {
			case 0:
				p = new Creed(this.totalnum, team, this, false, char, name)
				break
			case 1:
				p = new Silver(this.totalnum, team, this, false, char, name)
				break
			case 2:
				p = new Timo(this.totalnum, team, this, false, char, name)
				break
			case 3:
				p = new Yangyi(this.totalnum, team, this, false, char, name)
				break
			case 4:
				p = new Jean(this.totalnum, team, this, false, char, name)
				break
			case 5:
				p = new Jellice(this.totalnum, team, this, false, char, name)
				break
			case 6:
				p = new Gorae(this.totalnum, team, this, false, char, name)
				break
			case 7:
				p = new Bird(this.totalnum, team, this, false, char, name)
				break
			default:
				p = new Creed(this.totalnum, team, this, false, char, name)
		}

		this.players.push(p)
		this.PNUM += 1
		this.totalnum += 1
	}
	//========================================================================================================

	//team:number,char:str,name:str
	addAI(team: boolean | string, char: number, name: string) {
		console.log("add ai " + char + "  " + team)

		char = Number(char)
		let p = null
		switch (char) {
			case 0:
				p = new Creed(this.totalnum, team, this, true, char, name)
				break
			case 1:
				p = new Silver(this.totalnum, team, this, true, char, name)
				break
			case 2:
				p = new Timo(this.totalnum, team, this, true, char, name)
				break
			case 3:
				p = new Yangyi(this.totalnum, team, this, true, char, name)
				break
			case 4:
				p = new Jean(this.totalnum, team, this, true, char, name)
				break
			case 5:
				p = new Jellice(this.totalnum, team, this, true, char, name)
				break
			case 6:
				p = new Gorae(this.totalnum, team, this, true, char, name)
				break
			case 7:
				p = new Bird(this.totalnum, team, this, true, char, name)
				break
			default:
				p = new Creed(this.totalnum, team, this, true, char, name)
		}
		this.players.push(p)
		this.CNUM += 1
		this.totalnum += 1
		// this.clients.push("ai")
	}

	getInitialSetting() {
		let setting = []
		for (let p of this.players) {
			setting.push({
				turn: p.turn,
				team: p.team,
				HP: p.HP,
				MaxHP: p.MaxHP,
				name: p.name,
				champ: p.champ,
				champ_name: p.champ_name,
				recommendedItem:p.itemtree.items
			})
		}
		return {
			itemLimit: this.itemLimit,
			simulation: false,
			isTeam: this.isTeam,
			playerSettings: setting,
			shuffledObstacles: this.shuffledObstacles
		}
	}

	//()=>{turn:number,stun:boolean}
	startTurn() {
		for (let p of this.players) {
			p.players = this.players
			p.ability.sendToClient()
		}
		let p = this.players[0]

		//if this is first turn ever
		this.clientsReady += 1
		if (this.clientsReady !== this.PNUM) {
			return false
		}
		return {
			turn: p.turn,
			stun: p.haveEffect(ENUM.EFFECT.STUN),
			ai: p.AI,
			dc: p.diceControl,
			dc_cool: p.diceControlCool,
			adice: 0,
			effects: new Array<string>()
		}
	}
	//========================================================================================================

	summonSubmarine() {
		if (this.submarine_cool === 0) {
			console.log("submarine" + this.submarine_id)
			this.removePassProjById(this.submarine_id)
			this.submarine_id = ""
			let pos = 0
			let submarine_range = MAP.get(this.mapId).submarine_range

			if (submarine_range !== null) {
				let diff = submarine_range.end - submarine_range.start
				pos = submarine_range.start + Math.floor(Math.random() * diff)
			}

			this.placePassProj("submarine", pos)
			this.submarine_cool = SETTINGS.submarine_cooltime
		} else {
			this.submarine_cool = Math.max(0, this.submarine_cool - 1)
		}
	}

	removePassProjById(id: string) {
		if (id === "") return
		console.log("REmoved PASSPROJECTILE  PASSPROJECTILE" + id)
		// let toremove=this.passProjectileList.filter((p: PassProjectile) => p.UPID === id)
		let toremove = this.passProjectileList.get(id)
		if (toremove !== null) {
			// this.passProjectileList = this.passProjectileList.filter((proj: PassProjectile) => {
			// 	proj.UPID!==id
			// })
			this.passProjectileList.delete(id)

			toremove.removeProj()
			toremove = null
		}
	}

	/**
	 * called on every player`s turn start
	 * @returns
	 */
	summonDicecontrolItem() {
		let playercount = this.players.length

		//4:50% fail
		if (this.dcitem_id === "" && playercount === 4 && Math.random() > 0.5) {
			return
		}

		this.removePassProjById(this.dcitem_id)
		this.dcitem_id = ""

		//2명이면 50%, 3명이면 75%확률로 재배치
		if ((playercount === 2 && Math.random() > 0.5) || (playercount === 3 && Math.random() > 0.75)) {
			return
		}

		//플레이어 1명 랜덤선택
		let r = Math.floor(Math.random() * this.players.length)

		//플레이어가 일정레벨이상일시 등장안함
		if (this.players[r].level >= MAP.get(this.mapId).dc_limit_level) return

		//플레이어 앞 1칸~  8칸 사이 배치
		let range = 7
		let pos = this.players[r].pos + Math.floor(Math.random() * range) + 1
		let bound = MAP.get(this.mapId).respawn[MAP.get(this.mapId).dc_limit_level - 1]

		//일정범위 벗어나면 등장안함
		if (pos <= 0 || pos >= bound) return

		this.placePassProj("dicecontrol", pos)
	}

	/**
	 * 킬을 해서 추가주사위 던지면 80%로 앞1~ 8칸이내에 주컨아이템 소환
	 * @param turn
	 */
	summonDicecontrolItemOnkill(turn: number) {
		if (this.players[turn].level >= MAP.get(this.mapId).dc_limit_level) return

		if (Math.random() < 0.8) {
			this.removePassProjById(this.dcitem_id)
			let range = 8
			this.placePassProj("dicecontrol", this.players[turn].pos + Math.floor(Math.random() * range) + 1)
		}
	}

	goNextTurn() {
		if (this.gameover) {
			return null
		}
		this.pendingObs = 0
		this.pendingAction = null
		let p = this.p()

		p.coolDownOnTurnEnd()

		//다음턴 안넘어감(one more dice)
		if (p.oneMoreDice) {
			console.log("ONE MORE DICE")
			p.oneMoreDice = false
			p.cooldownEffectsAfterSkill()
			p.cooldownEffectsBeforeSkill()
			this.summonDicecontrolItemOnkill(p.turn)
			// p.effects[ENUM.EFFECT.STUN] = Math.max(p.effects[ENUM.EFFECT.STUN] - 1, 0)
			p.adice = 0
		}
		//다음턴 넘어감
		else {
			this.thisturn += 1
			this.thisturn %= this.totalnum

			this.summonDicecontrolItem()
			if (this.thisturn === 0) {
				this.totalturn += 1
				if (this.totalturn >= 30 && this.totalturn % 10 === 0) {
					for (let p of this.players) {
						p.ability.addExtraResistance((this.totalturn / 10) * 3)
					}
				}
				this.recordStat()

				//잠수함, 1턴 일때만 소환
				if (this.mapId === 1) {
					this.summonSubmarine()
				}
			}
			p = this.p()

			p.invulnerable = false
			if (p.dead || p.waitingRevival) {
				p.respawn()
			}
			p.giveMoney(Number(MAP.get(this.mapId).goldperturn))
			p.coolDownBeforeDice()
		}

		let additional_dice = p.calculateAdditionalDice()

		let doubledice = false
		let effects = new Array<string>()

		if (p.haveEffect(ENUM.EFFECT.DOUBLEDICE)) {
			effects.push("doubledice")
		}
		if (p.haveEffect(ENUM.EFFECT.BACKDICE)) {
			effects.push("backdice")
		}
		if (p.haveEffect(ENUM.EFFECT.BAD_LUCK)) {
			effects.push("badluck")
		}
		if (this.mapId === 2 && p.subwayTicket >= 0 && p.isInSubway) {
			effects.push("subway")
		}

		if (p.haveEffect(ENUM.EFFECT.SLOW)) {
			additional_dice -= 2
		}
		if (p.haveEffect(ENUM.EFFECT.SPEED)) {
			additional_dice += 2
		}
		console.log("adice" + additional_dice + " " + doubledice + " turn" + p.turn)

		// //temp
		// if(p.turn===0){
		// 	p.diceControl=true
		// }

		let avaliablepos: number[] = []
		if (p.diceControl) {
			avaliablepos = p.getPossiblePosList()
		}
		console.log("avliablepos" + avaliablepos)
		return {
			turn: p.turn,
			stun: p.haveEffect(ENUM.EFFECT.STUN),
			ai: p.AI,
			dc: p.diceControl,
			dc_cool: p.diceControlCool,
			adice: additional_dice,
			effects: effects,
			avaliablepos: avaliablepos
		}
	}

	//called when start of every 1p`s turn
	getPlayerVisibilitySyncData() {
		let data = []
		for (let plyr of this.players) {
			data.push({
				alive: !plyr.dead,
				pos: plyr.pos,
				turn: plyr.turn
			})
		}
		return data
	}

	/**
	 * called start of every turn,
	 * record all player`s current position of this turn
	 */
	recordStat() {
		for (let plyr of this.players) {
			if (plyr.onMainWay) {
				plyr.statistics.addPositionRecord(plyr.pos)
			} else if (MAP.get(this.mapId).way2_range != undefined) {
				plyr.statistics.addPositionRecord(
					MAP.get(this.mapId).way2_range.start + (plyr.pos - MAP.get(this.mapId).way2_range.way_start)
				)
			}
			plyr.statistics.addMoneyRecord()
		}
	}

	/**
	 *
	 * @param {int} killer -1 if executed
	 * @param {int} dead
	 * @param {int} pos
	 */
	addKillData(killer: number, dead: number, pos: number) {
		this.killRecord.push({ killer: killer, dead: dead, pos: pos, turn: this.totalturn })
	}

	rollDice(dicenum: number) {
		let p: Player = this.p()

		//return if stun
		if (p.haveEffect(ENUM.EFFECT.STUN)) {
			return "stun"
		}

		//original dice number
		let d = Math.floor(Math.random() * 6) + 1
		let dcused = false

		//  d=6  //임시

		//주사위컨트롤
		if (dicenum !== null && dicenum !== undefined && dicenum > 0 && p.diceControl) {
			d = dicenum
			p.useDiceControl()
			dcused = true
		}

		//ai 주컨
		if (p.AI && p.diceControl && p.level < MAP.get(this.mapId).dc_limit_level) {
			d = 6
			dcused = true
			p.useDiceControl()
		}

		//badluck effect
		if (p.haveEffect(ENUM.EFFECT.BAD_LUCK)) {
			d = p.getWorstDice()
		}

		let dice = d

		//doubledice,backdice
		if (p.haveEffect(ENUM.EFFECT.BACKDICE)) {
			dice *= -1
		}
		if (p.haveEffect(ENUM.EFFECT.DOUBLEDICE)) {
			dice *= 2
		}

		//speed,slow
		if (p.haveEffect(ENUM.EFFECT.SLOW)) {
			dice -= 2
		}
		if (p.haveEffect(ENUM.EFFECT.SPEED)) {
			dice += 2
		}

		//additional dice
		dice += p.adice
		p.adice = 0

		//상점 체크
		dice = p.checkMuststop(dice)

		//지나가는 투사체 체크
		let result = this.checkPassProj(p, p.pos, dice)
		dice = result.dice
		//컴퓨터면 무시

		this.passProjectileQueue = result.projList

		let currpos = p.pos

		//need to choose between two way
		if (MAP.get(this.mapId).way2_range !== null && p.checkWay2(dice)) {
			if (p.AI) {
			} else {
				this.pendingAction = "ask_way2"
			}
		}
		console.log("move" + dice)

		console.log("isinsubway" + p.isInSubway + "" + p.turn)
		if (this.mapId === 2 && p.subwayTicket >= 0 && p.isInSubway) {
			if (p.subwayTicket === 2) {
				d = 6
				dice = 6
			} else if (p.subwayTicket === 1) {
				if (MAP.get(this.mapId).subway.rapid.includes(p.pos)) {
					d = 3
					dice = 2
				} else {
					d = 3
					dice = 1
				}
			} else if (p.subwayTicket === 0) {
				d = 1
				dice = 1
			}

			if (p.pos + dice > MAP.get(this.mapId).subway.end) {
				dice = MAP.get(this.mapId).subway.end - p.pos
			}
		}

		//move player
		let died = p.moveByDice(dice)

		//dont move if player is killed by mine
		if (died) {
			dice = 0
		}

		return {
			dice: d,
			actualdice: dice,
			currpos: currpos,
			turn: this.thisturn,
			finish: MAP.getFinish(this.mapId),
			dcused: dcused,
			died: died
		}
	}
	//========================================================================================================

	checkPassProj(player: Player, currpos: number, dice: number) {
		let projList = []
		for (let pp of this.passProjectileList.values()) {
			if ((pp.pos > currpos && pp.pos <= currpos + dice) || (pp.pos < currpos && pp.pos >= currpos + dice)) {
				if (player.AI && pp.type === "submarine") {
					continue
				}
				projList.push(pp)
				if (pp.stopPlayer) {
					dice = pp.pos - currpos
					break
				}
			}
		}
		return { dice: dice, projList: projList }
	}
	//========================================================================================================

	checkObstacle(): number {
		let p = this.p()

		p.coolDownBeforeObs()

		//passprojqueue 에 있는 투사체들을 pendingaction 에 적용
		this.applyPassProj()

		//장애물 효과 적용
		let result = p.arriveAtSquare(false)

		if (result === ENUM.ARRIVE_SQUARE_RESULT_TYPE.STORE) {
			p.applyEffectBeforeSkill(ENUM.EFFECT.SILENT, 1)
			if (p.AI) {
				p.aiStore()
				result = ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
			}
		}
		let t = this.thisturn

		//게임 오버시 player 배열 순위순으로 정렬후 게임 끝냄
		if (result === ENUM.ARRIVE_SQUARE_RESULT_TYPE.FINISH) {
			this.players.sort(function (a, b) {
				if (a.turn === t) {
					return -1000
				}
				if (b.turn === t) {
					return 1000
				} else {
					if (b.kill === a.kill) {
						return a.death - b.death
					} else {
						return b.kill - a.kill
					}
				}
			})
			return ENUM.ARRIVE_SQUARE_RESULT_TYPE.FINISH
		}
		//godhand, 사형재판, 납치범 대기중으로 표시
		if (SETTINGS.pendingObsList.some((a) => result === a)) {
			if (!this.p().AI) {
				this.pendingObs = result
			}
		}

		p.coolDownAfterObstacle()

		return result
	}
	/**
	 * passprojqueue 에 있는 투사체들을 pendingaction 에 적용
	 */
	applyPassProj() {
		for (let pp of this.passProjectileQueue) {
			if (pp.type === "submarine") {
				this.removePassProjById(this.submarine_id)
				pp.removeProj()
				this.pendingAction = "submarine"
				this.submarine_id = ""
			}
			if (pp.type === "dicecontrol") {
				this.removePassProjById(this.dcitem_id)
				pp.removeProj()
				this.dcitem_id = ""
				this.p().giveDiceControl()
			}
		}
		this.passProjectileQueue = []
	}
	//========================================================================================================

	/**
	 * 클라로부터 신의손 정보 받아서 실행시킴
	 * @param {} godhand_info target,location
	 */
	processGodhand(godhand_info: { target: number; location: number }) {
		let p = this.players[godhand_info.target]
		p.damagedby[this.thisturn] = 3
		p.forceMove(godhand_info.location, false, "levitate")
	}
	//========================================================================================================

	//()=>{turn:number,silent:number,cooltime:number[],duration:number[]}
	skillCheck() {
		return this.getSkillStatus()
	}
	//========================================================================================================

	async aiSkill() {
		let p = this.p()
		if (p.haveEffect(ENUM.EFFECT.SILENT) || p.dead || this.gameover) {
			return
		}

		// p.aiUseSkills()

		//use ult first then w and q
		for (let i = 2; i >= 0; --i) {
			//let slist = ["Q", "W", "ult"]
			let skillresult = p.aiSkillFinalSelection(this.initSkill(i), i)
			if (!skillresult) {
				continue
			}

			if (skillresult.type === ENUM.AI_SKILL_RESULT_TYPE.LOCATION) {
				console.log(skillresult)
				if (skillresult.data === -1) {
					return
				}
				this.placeProj(skillresult.data)
			} else if (skillresult.type === ENUM.AI_SKILL_RESULT_TYPE.TARGET) {
				this.useSkillToTarget(skillresult.data)
			} else if (skillresult.type === ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET) {
			}
			if (!this.instant) {
				await Util.sleep(150)
			}
		}
	}
	//========================================================================================================

	/**
	 *
	 * @param {*} skill 0~
	 *
	 * return
	 * notlearned
	 * nocool
	 *  notarget
	 *  non-target(skillstatus)
	 * projectile(pos,range,onmainway,size)
	 *  targeting(targets)
	 */
	initSkill(skill: number) {
		let p = this.p()
		console.log("initSkill pendingskill" + skill)
		p.pendingSkill = skill

		if (!p.isSkillLearned(skill)) {
			//	return "notlearned"
			return ENUM.INIT_SKILL_RESULT.NOT_LEARNED
		}

		if (!p.isCooltimeAvaliable(skill)) {
			//return "nocool"
			return ENUM.INIT_SKILL_RESULT.NO_COOL
		}

		let skillTargetSelector: Util.SkillTargetSelector = p.getSkillTargetSelector(skill)

		//-1 when can`t use skill, 0 when it`s not attack skill that used immediately
		if (skillTargetSelector.isNonTarget()) {
			return {
				type: ENUM.INIT_SKILL_RESULT.NON_TARGET,
				skillstatus: this.getSkillStatus()
			}
		}

		if (skillTargetSelector.isNoTarget()) {
			//return "notarget"
			return ENUM.INIT_SKILL_RESULT.NO_TARGET
		}

		//마법의성
		if (p.adamage === 30) {
			skillTargetSelector.range *= 3
		}

		if (skillTargetSelector.isProjectile()) {
			return {
				type: ENUM.INIT_SKILL_RESULT.PROJECTILE,
				pos: p.pos,
				range: skillTargetSelector.range,
				onMainWay: p.onMainWay,
				size: skillTargetSelector.projSize
			}
		}

		let targets = p.getAvailableTarget(skillTargetSelector.range, skillTargetSelector.skill_id)

		console.log("skillattr" + targets + " " + skillTargetSelector.range)
		if (targets.length === 0) {
			//return "notarget"
			return ENUM.INIT_SKILL_RESULT.NO_TARGET
		}

		return {
			type: ENUM.INIT_SKILL_RESULT.NEED_TARGET,
			targets: targets
		}
	}
	useSkillToTarget(target: number) {
		let p = this.p()
		//this.skilldmg.onSkillUse(target)

		p.hitOneTarget(target, p.getSkillDamage(target))
		return this.getSkillStatus()
	}
	//========================================================================================================

	/**
	 *
	 * @returns turn,issilent,cooltile,duration,level,isdead
	 */
	getSkillStatus() {
		let p = this.p()
		return {
			turn: this.thisturn,
			silent: p.haveEffect(ENUM.EFFECT.SILENT),
			cooltime: p.cooltime,
			duration: p.duration,
			level: p.level,
			dead: p.dead
		}
	}
	getUPID(): string {
		let id = "P" + String(this.nextUPID)
		this.nextUPID += 1
		console.log("upid" + id)
		return id
	}
	//========================================================================================================

	placeProj(pos: number) {
		let p = this.p()
		let proj = p.getSkillProjectile(-1)
		let id = this.getUPID()
		proj.place(pos, id)
		this.activeProjectileList.set(id, proj)
	}

	placeProjNoSelection(proj: Projectile, pos: number) {
		console.log("placeProjNoSelection" + proj)
		let id = this.getUPID()
		proj.place(pos, id)
		this.activeProjectileList.set(id, proj)
	}

	removeProjectile(UPID: string) {
		this.activeProjectileList.delete(UPID)
	}

	//========================================================================================================

	isAttackableCoordinate(c: number): boolean {
		let coor = this.shuffledObstacles
		if (c < 1 || c >= coor.length || coor[c].obs === -1 || coor[c].obs === 0) {
			return false
		}
		return true
	}
	//========================================================================================================

	/**
	 *
	 * @param {*} type str
	 * @param {*} pos
	 */
	placePassProj(type: string, pos: number) {
		if (type === "submarine") {
			let proj = new PassProjectile(this, type, () => {}, false)

			let id = this.getPassUPID()
			this.passProjectileList.set(id, proj)
			proj.place(pos, id)
			console.log("Placed PASSPROJECTILE  PASSPROJECTILE" + id)
			this.submarine_id = id
		}
		if (type === "dicecontrol") {
			let proj = new PassProjectile(this, type, () => {}, false)
			// this.passProjectileList.push(proj)
			let id = this.getPassUPID()
			this.passProjectileList.set(id, proj)
			proj.place(pos, id)

			this.dcitem_id = id
		}

		// this.passProjectileList.sort(function (a, b) {
		// 	return a.pos - b.pos
		// })
	}
	//========================================================================================================

	getPassUPID(): string {
		let id = "PP" + String(this.nextPassUPID)
		this.nextPassUPID += 1
		return id
	}
	getGodHandTarget() {
		return this.p()
			.getPlayersByCondition(-1, false, false, false, true)
			.map(function (p: Player) {
				return p.turn
			})
	}

	//========================================================================================================

	/**
	 * 선택 장애물 대기중일 경우 바로 스킬로 안넘어가고 선택지 전송
	 * @returns false if no pending obs,  of return {name of obs,argument(false on default)}
	 */
	checkPendingObs(): { name: string; argument: number | number[] } {
		if (this.pendingObs === 0 || this.p().dead) return null

		let name = ""
		let argument: number | number[] = -1
		if (this.pendingObs === 21) {
			//신의손 대기중일 경우 바로 스킬로 안넘어가고 신의손 타겟 전송
			let target = this.getGodHandTarget()
			if (target.length > 0) {
				name = "server:pending_obs:godhand"
				argument = target
			} else {
				this.pendingObs = 0
				return null
			}
		}
		//납치범
		else if (this.pendingObs === 33) {
			name = "server:pending_obs:kidnap"
		}
		//사형재판
		else if (this.pendingObs === 37) {
			let num = Math.floor(Math.random() * 6) //0~5
			//let num=5
			this.roullete_result = num
			name = "server:pending_obs:trial"
			argument = num
		}
		//카지노
		else if (this.pendingObs === 38) {
			let num = Math.floor(Math.random() * 6) //0~5
			this.roullete_result = num
			name = "server:pending_obs:casino"
			argument = num
		}
		//공갈협박
		else if (this.pendingObs === 63) {
			name = "server:pending_obs:threaten"
		}
		//떡상
		else if (this.pendingObs === 67) {
			name = "server:pending_obs:sell_token"
			argument = this.p().token
		} //지하철
		else if (this.pendingObs === 6) {
			name = "server:pending_obs:subway"
			argument = this.p().getSubwayPrices()
		}

		return { name: name, argument: argument }
	}
	//========================================================================================================
	processPendingObs(info: any) {
		//타임아웃될 경우
		if (!info) {
			if (this.pendingObs === 33) {
				this.kidnap(true)
			} //타임아웃 악용방지 자동실행
			if (this.pendingObs === 37 || this.pendingObs === 38) {
				this.roulleteComplete()
			}
			if (this.pendingObs === 63) {
				this.threaten(true)
			}
			if (this.pendingObs === 6) {
				this.p().selectSubway(0, 0)
			}

			this.pendingObs = 0
			return
		}

		if (this.pendingObs === 0) {
			return
		}

		if (info.type === "godhand") {
			if (info.complete) {
				this.processGodhand(info)
			}
		} else if (info.type === "roullete") {
			this.roulleteComplete()
		} else if (info.type === "kidnap") {
			this.kidnap(info.result)
		} else if (info.type === "threaten") {
			this.threaten(info.result)
		} else if (info.type === "sell_token") {
			this.sellToken(info)
		} else if (info.type === "subway") {
			console.log("subway")
			console.log(info)
			this.p().selectSubway(info.result, info.price)
		}
		this.pendingObs = 0
	}
	//========================================================================================================

	processPendingAction(info: any) {
		//타임아웃될 경우
		if (!info || !info.complete) {
			this.pendingAction = null
			return
		}

		if (!this.pendingAction) {
			return
		}

		if (info.type === "submarine" && info.complete) {
			this.p().forceMove(info.pos, false, "levitate")
		}
		if (info.type === "ask_way2" && !info.result) {
			this.p().goWay2()
		}

		this.pendingAction = null
	}
	roulleteComplete() {
		console.log("roullete" + this.pendingObs)

		let p = this.p()
		//사형재판
		if (this.pendingObs === 37) {
			p.trial(this.roullete_result)
		}
		//카지노
		else if (this.pendingObs === 38) {
			p.casino(this.roullete_result)
		}

		this.pendingObs = 0
		this.roullete_result = -1
	}
	//========================================================================================================

	/**
	 * 납치범 실행
	 * @param result 납치범 결과 boolean
	 */
	kidnap(result: boolean) {
		this.p().kidnap(result)
		this.pendingObs = 0
	}
	//========================================================================================================

	/**
	 * 공갈협박 실행
	 * @param result  결과 boolean
	 */
	threaten(result: boolean) {
		this.p().threaten(result)
		this.pendingObs = 0
	}
	//========================================================================================================

	sellToken(info: any) {
		if (info.token > 0) {
			this.p().sellToken(info)
		}
	}
	//========================================================================================================

	getStoreData(turn: number) {
		let p = this.players[turn]
		return p.getStoreData(1)
	}
	//========================================================================================================
	getFinalStatistics() {
		let data = {
			players: new Array<any>(),
			totalturn: this.totalturn,
			version: 2,
			map_data: {
				name: MAP.get(this.mapId).mapname,
				respawn: MAP.getRespawn(this.mapId),
				finish: MAP.getFinish(this.mapId)
			},
			killRecord: this.killRecord,
			isTeam: this.isTeam
		}

		for (let p of this.players) {
			data.players.push({
				team: p.team,
				name: p.name,
				champ: p.champ_name,
				champ_id: p.champ,
				turn: p.turn,
				stats: p.statistics.stats,
				kda: [p.kill, p.death, p.assist],
				items: p.itemSlots,
				bestMultiKill: p.bestMultiKill,
				positionRecord: p.statistics.positionRecord,
				moneyRecord: p.statistics.moneyRecord,
				itemRecord: p.statistics.itemRecord
			})
		}

		return data
	}
}

export { Game ,MAP}
