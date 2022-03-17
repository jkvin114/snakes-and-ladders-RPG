import { Player } from "../player"
import * as ENUM from "../enum"
import { ITEM } from "../enum"

import { Damage, SkillTargetSelector, SkillDamage, PercentDamage, CALC_TYPE, randInt } from "../Util"
import { Game } from "../Game"
import { Projectile, ProjectileBuilder } from "../Projectile"
// import SETTINGS = require("../../res/globalsettings.json")
import {
	TickDamageEffect,
	TickEffect,
	TickActionFunction,
	onHitFunction,
	OnHitEffect,
	AblityChangeEffect,
	OnDamageEffect,
	ShieldEffect
} from "../StatusEffect"
import { SpecialEffect } from "../SpecialEffect"
import { PlayerClientInterface } from "../app"
import TreePlant from "./SummonedEntity/TreePlant"
import { SummonedEntity } from "./SummonedEntity/SummonedEntity"
const ID = 8
class Tree extends Player {
	//	onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]

	itemtree: {
		level: number
		items: number[]
		final: number
	}
	private readonly skill_name: string[]
	readonly duration_list: number[]

	private isWithered: boolean
	private plantEntities:Set<SummonedEntity>
	static PROJ_W = "tree_w"
	static SKILLNAME_STRONG_R = "tree_wither_r"
	static Q_AREA_SIZE=3
	static PLANT_LIFE_SPAN=2

	constructor(turn: number, team: boolean | string, game: Game, ai: boolean, name: string) {
		//hp, ad:40, ar, mr, attackrange,ap
		const basic_stats: number[] = [160, 30, 6, 6, 0, 30]
		super(turn, team, game, ai, ID, name, basic_stats)
		//	this.onoff = [false, false, false]
		this.hpGrowth = 90
		this.cooltime_list = [2, 5, 9]
		this.duration_list = [0, 1, 0]
		this.skill_name = ["tree_q", "tree_w", "tree_r"]
		this.itemtree = {
			level: 0,
			items: [
				ITEM.ANCIENT_SPEAR,
				ITEM.EPIC_CRYSTAL_BALL,
				ITEM.CARD_OF_DECEPTION,
				ITEM.EPIC_FRUIT,
				ITEM.BOOTS_OF_HASTE,
				ITEM.POWER_OF_MOTHER_NATURE
			],
			final: ITEM.EPIC_CRYSTAL_BALL
		}
		this.isWithered = false
		this.plantEntities=new Set<TreePlant>()
	}

	getSkillInfoKor() {
		let info = []
		info[0] = `"[달콤한 열매] <br>
			[기본 지속 효과]:체력이 40% 미만이면 '시든 나무' 상태 돌입, '시든 나무' 상태에선 '열매 투척' 으로 아군 회복이 불가하지만 모든 피해 흡혈이 15% 증가함<br>
			[사용시]:쿨타임:${this.cooltime_list[0]}턴,범위:20, 3칸 범위를 선택해 그 안에 있는 적들에게 ${this.getSkillBaseDamage(ENUM.SKILL.Q)}의 마법 피해를 입히고 아군은 ${this.getQHeal()}의 체력을 회복시키고 ${this.getQShield()}의 보호막 부여`
		info[1] = `[덩굴 함정] 쿨타임:${this.cooltime_list[1]}턴<br>범위:30, 지나가는 플레이어를 멈추는 뿌리를 설치, 뿌리에 걸린 플레이어는 해당 칸의 효과를 받음, 아군은 추가로 신속 효과를 받음`
		info[2] = `[뿌리 감옥] <br>[기본 지속 효과]:스킬 사용시 사용한 자리에 식충식물 소환, <br>
		식충식물은 5턴간 유지되며 매 턴마다 주변 2칸이내의 적에게 의 ${this.getSkillBaseDamage(5)}마법 피해를 입히고 적이 기본 공격시 사라짐.<br>
		[사용시]:쿨타임:${this.cooltime_list[2]}턴, 범위 25, 사용시 대상에게 ${this.getSkillBaseDamage(ENUM.SKILL.ULT)}의 마법 피해를 입히고 1턴간 속박시킴('시든 나무' 상태이면 2턴),또한 이 상태에서 아군에게 받는 피해 20% 증가, 이때 맵에 있는 모든 식충 식물이 대상 주변으로 이동됨`
		return info
	}
	getSkillInfoEng() {
		let info = []
		info[0] = ``
		info[1] = ``
		info[2] = ``
		return info
	}

	getSkillTrajectorySpeed(skilltype: string): number {
		if(skilltype==="tree_q"){
			return 300
		}
		if(skilltype==="tree_r"){
			return 600
		}
		return 0
	}

	private buildProjectile() {
		const _this = this.getPlayer()
		return new ProjectileBuilder(this.game, Tree.PROJ_W, Projectile.TYPE_PASS)
			.setSource(this.turn)
			.setAction(function (target: Player) {
				if (!_this.game.playerSelector.isOpponent(target.turn, _this.turn)) {
					target.effects.apply(ENUM.EFFECT.SPEED, 1, ENUM.EFFECT_TIMING.TURN_END)
				}
			})
			.setDuration(3)
			.setCanApplyToAlly()
			.addFlag(Projectile.FLAG_STOP_PLAYER)
			.build()
	}

	getSkillTargetSelector(skill: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(ENUM.SKILL_INIT_TYPE.CANNOT_USE).setSkill(
			skill
		) //-1 when can`t use skill, 0 when it`s not attack skill

		switch (skill) {
			case ENUM.SKILL.Q:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.AREA_TARGETING).setRange(25).setAreaSize(Tree.Q_AREA_SIZE)
				break
			case ENUM.SKILL.W:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.PROJECTILE).setRange(30).setProjectileSize(1)
				break
			case ENUM.SKILL.ULT:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(25)
				break
		}
		return skillTargetSelector
	}
	getSkillName(skill: number): string {
		if (this.isWithered && skill === ENUM.SKILL.ULT) {
			return Tree.SKILLNAME_STRONG_R
		}
		return this.skill_name[skill]
	}

	getBasicAttackName(): string {
		return super.getBasicAttackName()
	}

	getSkillProjectile(pos:number): Projectile {
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		if (s === ENUM.SKILL.W) {
			this.summonPlantAt(pos+1)
			let proj = this.buildProjectile()
			this.startCooltime(ENUM.SKILL.W)
			return proj
		}
	}
	private getQShield(){
		return Math.floor(30+this.ability.AP * 0.08)
	}
	private getQHeal(){
		return Math.floor(20+this.ability.AP * 0.15)
	}
	private getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return Math.floor(30 + this.ability.AP * 0.5)
		}
		if (skill === ENUM.SKILL.ULT) {
			return Math.floor(50 + 0.6 * this.ability.AP)
		}//plant attack damage
		if(skill===5){
			return Math.floor(10 + 0.2 * this.ability.AP)
		}
	}

	private createPlantEntity(){
		return TreePlant.create(this.game,new Damage(0,this.getSkillBaseDamage(5),0))
	}
	private summonPlantAt(pos:number){
		if(!this.isSkillLearned(ENUM.SKILL.ULT)) return
		let entity=this.game.summonEntity(this.createPlantEntity(),this,Tree.PLANT_LIFE_SPAN,pos)

		this.plantEntities.add(entity)
	}
	private moveAllPlantTo(pos:number){
		this.cleanupDeadPlants()
		for(let plant of this.plantEntities){
			this.game.updateEntityPos(plant,pos + randInt(3)-1)
		}
	}
	private plantAttack(){
		this.cleanupDeadPlants()
		for(let plant of this.plantEntities){
			console.log("PLant at"+plant.pos)
			plant.attack()
		}
	}
	private cleanupDeadPlants(){
		for(let plant of this.plantEntities){
			console.log("plantalive "+plant.alive)
			if(!plant.alive) this.plantEntities.delete(plant)
		}
	}

	getUltEffect() {
		return new OnDamageEffect(ENUM.EFFECT.TREE_ULT, this.isWithered ? 2 : 1, (damage: Damage, source: Player) => {
			return damage.updateAllDamage(CALC_TYPE.multiply, 1.2)
		})
			.on([OnDamageEffect.BASICATTACK_DAMAGE, OnDamageEffect.SKILL_DAMAGE])
			.from(this.game.playerSelector.getAlliesOf(this.turn))
	}

	getSkillDamage(targetTurn: number): SkillDamage {
		let skillattr: SkillDamage = null
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		switch (s) {
			case ENUM.SKILL.ULT:
				this.summonPlantAt(this.game.playerSelector.get(targetTurn).pos)
				this.startCooltime(ENUM.SKILL.ULT)

				skillattr = new SkillDamage(new Damage(0, this.getSkillBaseDamage(s), 0), ENUM.SKILL.ULT).setOnHit(
					(target: Player) => {
						target.effects.applySpecial(this.getUltEffect(), SpecialEffect.SKILL.TREE_ULT.name)
						target.effects.apply(ENUM.EFFECT.STUN, this.isWithered ? 2 : 1, ENUM.EFFECT_TIMING.TURN_END)
					}
				)
				this.moveAllPlantTo(this.game.playerSelector.get(targetTurn).pos)
				// setTimeout(()=>this.plantAttack(),200)

				break
		}

		return skillattr
	}
	usePendingAreaSkill(pos: number): void {
		let skillattr: SkillDamage = null
		let s: number = this.pendingSkill
		this.pendingSkill = -1
		if(s===ENUM.SKILL.Q){
			this.startCooltime(ENUM.SKILL.Q)
			this.summonPlantAt(pos)

			console.log("area"+pos)

			let opponents = this.game.playerSelector.getPlayersIn(this,pos, pos + Tree.Q_AREA_SIZE-1)
			let dmg = new SkillDamage(new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.Q), 0), ENUM.SKILL.Q)

			for (let p of opponents) {
				this.hitOneTarget(p, dmg)
			}
			if(this.isWithered) return
			let allies = this.game.playerSelector.getAlliesIn(this,pos, pos + Tree.Q_AREA_SIZE-1)

			for(let p of allies){
				this.game.playerSelector.get(p).heal(this.getQHeal())
				this.game.playerSelector.get(p).effects.applySpecial(new ShieldEffect(ENUM.EFFECT.TREE_Q_SHIELD,2, this.getQShield()))
			}
		}
	}

	passive() {
		if (this.HP < this.MaxHP * 0.4) {
			this.isWithered = true

			this.effects.applySpecial(
				new AblityChangeEffect(ENUM.EFFECT.TREE_WITHER, 2, new Map().set("absorb", 15)),
				SpecialEffect.SKILL.TREE_WITHER.name
			)
			this.changeSkillImage("tree_wither_r",ENUM.SKILL.ULT)
			this.changeApperance("tree_low_hp")
		} else {
			this.effects.removeByKey(ENUM.EFFECT.TREE_WITHER)
			this.isWithered = false
			this.changeApperance("")
			this.changeSkillImage("",ENUM.SKILL.ULT)

		}
	}

	//override
	onTurnEnd(): void {
		this.plantAttack()
		super.onTurnEnd()
	}

	getBaseBasicAttackDamage(): Damage {
		return super.getBaseBasicAttackDamage()
	}
	onSkillDurationCount() {}
	onSkillDurationEnd(skill: number) {}
	/**
	 *
	 * @param {*} skilldata
	 * @param {*} skill 0~
	 */
	aiSkillFinalSelection(skilldata: any, skill: number): { type: number; data: number } {
		if (
			skilldata === ENUM.INIT_SKILL_RESULT.NOT_LEARNED ||
			skilldata === ENUM.INIT_SKILL_RESULT.NO_COOL ||
			skilldata === ENUM.INIT_SKILL_RESULT.NO_TARGET
		) {
			return null
		}
		switch (skill) {
			case ENUM.SKILL.Q:
				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.AREA_TARGET,
					data: this.getAiAreaPos(skilldata, skill)
				}
			case ENUM.SKILL.W:
				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.LOCATION,
					data: this.getAiProjPos(skilldata, skill)
				}
			case ENUM.SKILL.ULT:
				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.TARGET,
					data: this.getAiTarget(skilldata.targets)
				}
		}
	}
}

export { Tree }
