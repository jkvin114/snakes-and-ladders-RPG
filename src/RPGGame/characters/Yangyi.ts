import type { Player } from "../player/player"
import type { Game } from "../Game"

import * as ENUM from "../data/enum"
import { Damage,PercentDamage } from "../core/Damage"

import { CALC_TYPE } from "../core/Util"
import { Projectile } from "../Projectile"
// import SETTINGS = require("../../res/globalsettings.json")
import { NormalEffect } from "../StatusEffect"
import { SpecialEffect } from "../data/SpecialEffectRegistry"
import { SkillInfoFactory } from "../data/SkillDescription"
import * as SKILL_SCALES from "../../../res/skill_scales.json"
import { EntityFilter } from "../entity/EntityFilter"
import YangyiAgent from "../AiAgents/YangyiAgent"
import type { Entity } from "../entity/Entity"
import { SkillTargetSelector, SkillAttack } from "../core/skill"
import { EFFECT, EFFECT_TIMING } from "../StatusEffect/enum"
import { CharacterSkillManager } from "./SkillManager/CharacterSkillManager"
const ID = 3
class Yangyi extends CharacterSkillManager {
	// onoff: boolean[]	
	skill_ranges: number[]

	readonly hpGrowth: number
	readonly cooltime_list: number[]
	readonly duration_list: number[]
	static readonly SKILL_EFFECT_NAME= ["dinosaur_q", "hit", "dinosaur_r"]
	static readonly SKILL_SCALES=SKILL_SCALES[ID]
	protected player: Player
	constructor(player: Player) {
		super(player,ID)
		// this.onoff = [false, false, false]
		this.cooltime_list = [1, 7, 8] //1 7
		this.duration_list = [0, 3, 0]
		this.skill_ranges=[0,0,20]
	}


	getSkillScale(){
		return Yangyi.SKILL_SCALES
	}

	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Yangyi.SKILL_SCALES.Q)
		}
		if (skill === ENUM.SKILL.ULT) {
			return this.calculateScale(Yangyi.SKILL_SCALES.R!)
		}
		return 0
	}
	getSkillAmount(key: string): number {
		if(key==="wheal") return this.calculateScale(Yangyi.SKILL_SCALES.wheal!)
		return 0
	}
	getSkillTrajectoryDelay(skilltype: string): number {
		if (skilltype === "dinosaur_r") {
			return 500
		}
		return 0
	}

	getSkillTargetSelector(s: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(s)//-1 when can`t use skill, 0 when it`s not attack skill
		this.pendingSkill=s
		switch (s) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)
				break
			case ENUM.SKILL.W:
				
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.ACTIVATION)
				break
			case ENUM.SKILL.ULT:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(this.skill_ranges[s])
				break
		}
		return skillTargetSelector
	}
	useInstantSkill(skill: number): boolean {
		if (skill===ENUM.SKILL.Q) {
			return this.useQ()
		}
		return false
	}
	useActivationSkill(skill:ENUM.SKILL){
		if (skill===ENUM.SKILL.W) {
			this.useW()
		}
	}
	private useQ() {
		let skilldmg = new SkillAttack(new Damage(this.getSkillBaseDamage(ENUM.SKILL.Q), 0, 0),this.getSkillName(ENUM.SKILL.Q),ENUM.SKILL.Q,this.player)


		let targets=this.mediator.selectAllFrom(EntityFilter.ALL_ATTACKABLE_PLAYER(this.player).inRadius(4))

		if (targets.length > 0) {
			this.player.doObstacleDamage(Math.floor(this.player.HP * 0.05), "noeffect")

			//플레이어 2명아면 데미지 20%, 3명아면 40% 감소
			let damagecoeff = 1 - 0.2 * (targets.length - 1)

			skilldmg.damage.updateAttackDamage(CALC_TYPE.multiply, damagecoeff)
			
			this.mediator.skillAttack(this.player,EntityFilter.ALL_ATTACKABLE_PLAYER(this.player).inRadius(4),skilldmg)

			// for (let p of targets) {
			// 	this.mediator.skillAttackSingle(this,p.turn)(skilldmg)
			// }

		} else {
			return false
		}
		this.startCooltime(ENUM.SKILL.Q)
		return true
	}
	useW() {
		if (this.duration[ENUM.SKILL.W] === 0) {
			this.startDuration(ENUM.SKILL.W)
			this.startCooltime(ENUM.SKILL.W)
			this.player.effects.apply(EFFECT.SLOW, 3)
			this.player.effects.applySpecial(
				new NormalEffect(EFFECT.DINOSAUR_W, 3, EFFECT_TIMING.TURN_START).setGood(),
				SpecialEffect.SKILL.DINOSAUR_W_HEAL.name
			)
		}
	}

	getSkillDamage(target: Entity,s:number): SkillAttack {
		//무조건 궁
		let skillattr = null //-1 when can`t use skill, 0 when it`s not attack skill
		// this.pendingSkill = -1

		this.startCooltime(ENUM.SKILL.ULT)
		//Math.floor(0.5 * (this.game.playerSelector.get(target).MaxHP - this.game.playerSelector.get(target).HP))

		skillattr = new SkillAttack(
			new Damage(this.getSkillBaseDamage(ENUM.SKILL.ULT), 0, 0).mergeWith(
				new PercentDamage(50, PercentDamage.MISSING_HP, Damage.ATTACK).pack(target.MaxHP,target.HP)
			),
			this.getSkillName(ENUM.SKILL.ULT)
		,ENUM.SKILL.ULT,this.player).setOnKill(function (this:Player) {
			this.skillManager.resetCooltime([ENUM.SKILL.ULT])
		}).setTrajectoryDelay(this.getSkillTrajectoryDelay(this.getSkillName(s)))

		return skillattr
	}

	getSkillName(skill: number): string {
		return Yangyi.SKILL_EFFECT_NAME[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}
	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}

	onSkillDurationEnd(skill: number) {
		// if(skill===ENUM.SKILL.W){
		//     this.w_end()
		// }
	}
	getSkillProjectile(pos:number): Projectile|null {
		return null
	}
	/**
	 * 자신의 매 턴 시작시마다 호출
	 */
	onTurnStart() {
		//w passive
		if (this.player.level > 1 && this.mediator.isFellBehind(this.player)) {
			this.player.adice += 1
		}
		super.onTurnStart()
	}

	onSkillDurationCount() {
		if (this.duration[ENUM.SKILL.W] > 0) {
			this.player.heal(this.getSkillAmount("wheal"))
		}
	}

}
export { Yangyi }
