import { Player } from "../player"
import * as ENUM from "../enum"
import { ITEM } from "../enum"

import { Damage, SkillTargetSelector, SkillDamage, CALC_TYPE, randInt } from "../Util"
import { Game } from "../Game"
import { Projectile, ProjectileBuilder } from "../Projectile"
import {
	AblityChangeEffect,
	OnDamageEffect,
	ShieldEffect
} from "../StatusEffect"
import { SpecialEffect } from "../SpecialEffect"
import TreePlant from "./SummonedEntity/TreePlantEntity"
import { SummonedEntity } from "./SummonedEntity/SummonedEntity"
import { SkillInfoFactory } from "../helpers"
import * as SKILL_SCALES from "../../res/skill_scales.json"

const ID = 8
class Tree extends Player {
	//	onoff: boolean[]
	readonly hpGrowth: number
	readonly cooltime_list: number[]
	readonly duration_list: number[]
	readonly skill_ranges:number[]
	itemtree: {
		level: number
		items: number[]
		final: number
	}

	private isWithered: boolean
	private plantEntities:Set<SummonedEntity>
	skillInfo:SkillInfoFactory
	skillInfoKor:SkillInfoFactory


	static PROJ_W = "tree_w"
	static SKILLNAME_STRONG_R = "tree_wither_r"
	static APPERANCE_WITHERED="tree_low_hp"
	static Q_AREA_SIZE=3
	static PLANT_LIFE_SPAN=2
	static RANGES=[25,30,25]
	static BASIC_STATS=[160, 20, 6, 6, 0, 30] //hp, ad, ar, mr, attackrange,ap
	static SKILL_EFFECT_NAME=["tree_q", "tree_w", "tree_r"]
	static COOLTIME = [2, 5, 9]

	static SKILL_SCALES=SKILL_SCALES[ID]

	constructor(turn: number, team: boolean | string, game: Game, ai: boolean, name: string) {
		
		super(turn, team, game, ai, ID, name, Tree.BASIC_STATS)
		this.hpGrowth = 90
		this.cooltime_list = Tree.COOLTIME
		this.duration_list = [0, 0, 0]
		this.skill_ranges=Tree.RANGES
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
	
	// getSkillInfoKor() {
	// 	return [this.skillInfoKor.getQ(),this.skillInfoKor.getW(),this.skillInfoKor.getUlt()]
	// }
	// getSkillInfoEng() {		
	// 	return [this.skillInfo.getQ(),this.skillInfo.getW(),this.skillInfo.getUlt()]
	// }
	getSkillScale(){
		return Tree.SKILL_SCALES
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
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.AREA_TARGETING).setRange(Tree.RANGES[skill]).setAreaSize(Tree.Q_AREA_SIZE)
				break
			case ENUM.SKILL.W:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.PROJECTILE).setRange(Tree.RANGES[skill]).setProjectileSize(1)
				break
			case ENUM.SKILL.ULT:
				skillTargetSelector.setType(ENUM.SKILL_INIT_TYPE.TARGETING).setRange(Tree.RANGES[skill])
				break
		}
		return skillTargetSelector
	}
	getSkillName(skill: number): string {
		if (this.isWithered && skill === ENUM.SKILL.ULT) {
			return Tree.SKILLNAME_STRONG_R
		}
		return Tree.SKILL_EFFECT_NAME[skill]
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
	getSkillAmount(key: string): number {
		if(key==="qshield") return this.calculateScale(Tree.SKILL_SCALES.qshield)
		if(key==="qheal") return this.calculateScale(Tree.SKILL_SCALES.qheal)
		if(key==="plantdamage") return this.calculateScale(Tree.SKILL_SCALES.plantdamage)
		if(key==="plant_lifespan") return 3

		return 0
	}


	getSkillBaseDamage(skill: number): number {
		if (skill === ENUM.SKILL.Q) {
			return this.calculateScale(Tree.SKILL_SCALES.Q)
		}
		if (skill === ENUM.SKILL.ULT) {
			return this.calculateScale(Tree.SKILL_SCALES.R)
		}
	}


	private createPlantEntity(){
		return TreePlant.create(this.game,new Damage(0,this.getSkillAmount("plantdamage"),0))
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

			let opponents = this.game.playerSelector.getPlayersIn(this,pos, pos + Tree.Q_AREA_SIZE-1)
			let dmg = new SkillDamage(new Damage(0, this.getSkillBaseDamage(ENUM.SKILL.Q), 0), ENUM.SKILL.Q)

			for (let p of opponents) {
				this.hitOneTarget(p, dmg)
			}
			if(this.isWithered) return
			let allies = this.game.playerSelector.getAlliesIn(this,pos, pos + Tree.Q_AREA_SIZE-1)

			for(let p of allies){
				this.game.playerSelector.get(p).heal(this.getSkillAmount("qheal"))
				this.game.playerSelector.get(p).effects.applySpecial(new ShieldEffect(ENUM.EFFECT.TREE_Q_SHIELD,2, this.getSkillAmount("qshield")))
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
			this.changeSkillImage(Tree.SKILLNAME_STRONG_R,ENUM.SKILL.ULT)
			this.changeApperance(Tree.APPERANCE_WITHERED)
		} else {
			this.effects.removeByKey(ENUM.EFFECT.TREE_WITHER)
			this.isWithered = false
			this.resetApperance()
			this.resetSkillImage(ENUM.SKILL.ULT)

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
