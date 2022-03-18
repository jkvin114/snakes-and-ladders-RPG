import { Player } from "../player"
import * as ENUM from "../enum"
import { ITEM } from "../enum"

import { CALC_TYPE, Damage, SkillTargetSelector, SkillDamage, PercentDamage } from "../Util"
import { ShieldEffect } from "../PlayerStatusEffect"
import { Game } from "../Game"
import { TickDamageEffect, TickEffect} from "../StatusEffect"
import { Projectile, ProjectileBuilder } from "../Projectile"
import { SpecialEffect } from "../SpecialEffect"
import { SkillInfoFactory } from "../helpers"
import * as SKILL_SCALES from "../../res/skill_scales.json"

// import SETTINGS = require("../../res/globalsettings.json")
const ID = 5
class Jellice extends Player {
	skillInfoKor: SkillInfoFactory
	skillInfo: SkillInfoFactory
	//	onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]
	skill_ranges: number[]

	itemtree: {
		level: number
		items: number[]
		final: number
	}
	private u_used: number
	readonly duration_list: number[]

	static PROJ_ULT="magician_r"
	// static EFFECT_W="magician_w"
	// static EFFECT_W_BURN="magician_w_burn"
	static SKILLNAME_W_Q="magician_w_q"
	static SKILL_SCALES=SKILL_SCALES[ID]
	static SKILL_EFFECT_NAME=["magician_q", "hit", "magician_r"]


	constructor(turn: number, team: boolean | string, game: Game, ai: boolean, name: string) {
		//hp, ad:40, ar, mr, attackrange,ap
		const basic_stats = [170, 30, 6, 6, 0, 50]
		super(turn, team, game, ai, ID, name, basic_stats)
		//	this.onoff = [false, false, false]
		this.hpGrowth = 90
		this.cooltime_list = [3, 4, 7] //3 5 7
		this.duration_list = [0, 1, 0]
		this.skill_ranges=[0,0,30]
		this.u_used = 0
		this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_CRYSTAL_BALL,
				ITEM.CARD_OF_DECEPTION,
				ITEM.INVISIBILITY_CLOAK,
				ITEM.CROSSBOW_OF_PIERCING,
				ITEM.ANCIENT_SPEAR,
				ITEM.EPIC_CRYSTAL_BALL
			],
			final: ITEM.EPIC_CRYSTAL_BALL
		}
		this.skillInfo=new SkillInfoFactory(ID,this,SkillInfoFactory.LANG_ENG)
		this.skillInfoKor=new SkillInfoFactory(ID,this,SkillInfoFactory.LANG_KOR)

	}


	getSkillInfoEng() {
		let info = []
		info[0] =
			"[Spell Attack] cooltime:" +
			this.cooltime_list[0] +
			" turns <br>Damage all players within 5~15 squares front, 3~8 squares back, deals " +
			this.getSkillBaseDamage(0) +
			"magic damage"
		info[1] =
			"[Burning Spellbook] cooltime:" +
			this.cooltime_list[1] +
			" turns<br>Doubles range for all skills for 1 turn, Applies ignite effect on lv1 skill use.Can`t throw dice this turn, gains speed effect after use"
		info[2] =
			"[Dark Sorcery] cooltime:" +
			this.cooltime_list[2] +
			" turns<br>range:30 , Places a projectile with size 3, players steps on it receives " +
			this.getSkillBaseDamage(2) +
			"magic damage and silenced, Can use skill 3 times"
		return info
	}

	getSkillScale(){
		return Jellice.SKILL_SCALES
	}

	getSkillTrajectorySpeed(skilltype: string): number {
		return 0
	}
	private buildProjectile() {
		let _this: Player = this.getPlayer()
		return new ProjectileBuilder(this.game,Jellice.PROJ_ULT,Projectile.TYPE_RANGE)
			.setSize(3)
			.setSource(this.turn)
			.setAction(function (target: Player) {
				target.effects.apply(ENUM.EFFECT.SILENT, 1, ENUM.EFFECT_TIMING.BEFORE_SKILL)
			})
			.setDamage(new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.ULT), 0))
			.setDuration(2)
			.setTrajectorySpeed(300)
			.build()
	}

	getSkillTargetSelector(s: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(ENUM.SKILL_INIT_TYPE.CANNOT_USE).setSkill(s) //-1 when can`t use skill, 0 when it`s not attack skill
		switch (s) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)
				if (!this.AI) {
					if (!this.useQ()) {
						skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NO_TARGET)
					}
				}

				break
			case ENUM.SKILL.W:
				if (!this.AI) {
					this.useW()
				}
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)
				break
			case ENUM.SKILL.ULT:
				let range = this.isSkillActivated(ENUM.SKILL.W) ? 2 : 1 * this.skill_ranges[s]

				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.PROJECTILE).setRange(range).setProjectileSize(3)
				break
		}
		return skillTargetSelector
	}

	private getWShield() {
		return new ShieldEffect(ENUM.EFFECT.MAGICIAN_W_SHIELD,1, 50)
	}
	private getWBurnEffect() {
		return new TickDamageEffect(
			ENUM.EFFECT.MAGICIAN_W_BURN,
			2, //2
			TickEffect.FREQ_EVERY_PLAYER_TURN,
			new PercentDamage(this.getSkillBaseDamage(ENUM.SKILL.W), PercentDamage.MAX_HP)
		)
			.setSourcePlayer(this.turn)
	}
	private useW() {
		this.effects.applySpecial(this.getWShield(), SpecialEffect.SKILL.MAGICIAN_W.name)


		this.startCooltime(ENUM.SKILL.W)
		this.duration[ENUM.SKILL.W] = 2
		this.effects.apply(ENUM.EFFECT.STUN, 1, ENUM.EFFECT_TIMING.TURN_START)
	}
	private useQ(): boolean {
		let w_on=this.isSkillActivated(ENUM.SKILL.W) 
		let end_front = this.effects.modifySkillRange(w_on?2:1 * this.getSkillAmount("qrange_end_front"))
		let end_back=this.effects.modifySkillRange(w_on?2:1 * this.getSkillAmount("qrange_end_back"))
		let start = this.getSkillAmount("qrange_start")

		let targets = this.game.playerSelector.getPlayersIn(this, this.pos + start + 1, this.pos + end_front)
		targets = targets.concat(this.game.playerSelector.getPlayersIn(this, this.pos - end_back, this.pos - start))
		let dmg = new SkillDamage(new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.Q), 0), ENUM.SKILL.Q)

		if (targets.length === 0) {
			return false
		}
		if (this.isSkillActivated(ENUM.SKILL.W)) {
			dmg.setOnHit((target: Player) => {
				target.effects.applySpecial(this.getWBurnEffect(),SpecialEffect.SKILL.MAGICIAN_W_BURN.name)
			})
		}
		for (let p of targets) {
			this.hitOneTarget(p, dmg)
		}
		this.startCooltime(ENUM.SKILL.Q)
		return true
	}

	getSkillName(skill: number): string {
		if (skill === ENUM.SKILL.Q && this.isSkillActivated(ENUM.SKILL.W)) {
			return Jellice.SKILLNAME_W_Q
		}
		return Jellice.SKILL_EFFECT_NAME[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}

	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}

	getSkillProjectile(pos:number): Projectile {
		let s: number = this.pendingSkill
		this.pendingSkill = -1

		if (s === ENUM.SKILL.ULT) {
			let proj = this.buildProjectile()
			this.u_used += 1
			if (this.u_used === 3) {
				this.startCooltime(ENUM.SKILL.ULT)
				this.u_used = 0
			}

			return proj
		}
	}

	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Jellice.SKILL_SCALES.Q)
		}
		if (skill === ENUM.SKILL.W) {
			return this.calculateScale(Jellice.SKILL_SCALES.Q)
		}
		if (skill === ENUM.SKILL.ULT) {
			return this.calculateScale(Jellice.SKILL_SCALES.R)
		}
	}
	getSkillAmount(key: string): number {
		if(key==="qrange_start") return 3
		if(key==="qrange_end_front") return 15
		if(key==="qrange_end_back") return 8
		//앞 3~15, 뒤 3~8
		return 0
	}
	getSkillDamage(target: number): SkillDamage {
		return null
	}
	onSkillDurationEnd(skill: number) {}
	passive() {}
	onSkillDurationCount() {}
	/**
	 *
	 * @param {*} skilldata
	 * @param {*} skill 0~
	 */
	aiSkillFinalSelection(skilldata: any, skill: number): { type: number; data: number } {
		//	console.log("aiSkillFinalSelection" + skill + "" + skilldata)
		if (
			skilldata === ENUM.INIT_SKILL_RESULT.NOT_LEARNED ||
			skilldata === ENUM.INIT_SKILL_RESULT.NO_COOL ||
			skilldata === ENUM.INIT_SKILL_RESULT.NO_TARGET
		) {
			return null
		}
		switch (skill) {
			case ENUM.SKILL.Q:
				//사거리네에 플레이어 있거나 w 쓰고 사거리안에 1~3명 있을때 사용
				if (
					this.game.playerSelector.getPlayersIn(this, this.pos - 7, this.pos + 15).length > 0 ||
					(this.duration[ENUM.SKILL.W] > 0 &&
						this.game.playerSelector.getPlayersIn(this, this.pos - 23, this.pos + 30).length >= this.game.totalnum - 1)
				) {
					this.useQ()
					return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
				}
			case ENUM.SKILL.W:
				//q 쿨 있고 사거리내에 1~3 명이상 있으면 사용
				if (
					this.cooltime[0] === 0 &&
					this.game.playerSelector.getPlayersIn(this, this.pos - 23, this.pos + 30).length >= this.game.totalnum - 1
				) {
					this.useW()
					return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
				}

			case ENUM.SKILL.ULT:
				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.LOCATION,
					data: this.getAiProjPos(skilldata, skill)
				}
		}
		return null
	}
}
export { Jellice }
