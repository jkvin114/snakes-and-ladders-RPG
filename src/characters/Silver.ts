import { Player, Projectile } from "../player"
import * as ENUM from "../enum"
import { CALC_TYPE, Damage, SkillDamage, SkillTargetSelector } from "../Util"
import { Game } from "../Game"

class Silver extends Player {
	onoff: boolean[]
	hpGrowth: number
	usedQ: boolean
	projectile: Projectile[]
	cooltime_list: number[]
	
	itemtree: {
		level: number
		items: number[]
		final: number
	}
	
	private skill_name: string[]
	private u_active_amt: number
	private u_passive_amt: number

	constructor(turn: number, team: boolean | string, game: Game, ai: boolean, char: number, name: string) {
		//hp, ad:40, ar, mr, attackrange,ap
		let basic_stats = [250, 25, 15, 15, 0, 20]
		super(turn, team, game, ai, char, name, "Elephant", basic_stats)
		this.onoff = [false, false, false]
		this.projectile = []
		this.cooltime_list = [2, 4, 9]
		this.hpGrowth = 100
		this.u_active_amt = 0
		this.u_passive_amt = 0
		this.skill_name = ["elephant_q", "hit", "hit"]
		this.itemtree = {
			level: 0,
			items: [7, 13, 10, 19, 16],
			final: 7
		}
	}

	/**
	 * skill infos that displays on the game screen
	 * @returns
	 */
	getSkillInfoKor() {
		let info = []
		info[0] =
			"[암흑의 표창] 쿨타임:" +
			this.cooltime_list[0] +
			"턴<br>사정거리:3, 표식을 맞은 상대에게는 7,사용시 대상에게 " +
			this.getSkillBaseDamage(0) +
			"의 마법 피해 후 피해량의 30% 회복, 표식이 있는 대상에게는 30의 추가 피해를 입함"
		info[1] = "[도발]<br> 쿨타임:" + this.cooltime_list[1] + "턴사정거리:15,사용시 대상에게 표식을 남기고 주작 1턴을 줌"
		info[2] =
			"[실버의 갑옷] 쿨타임:" +
			this.cooltime_list[2] +
			"턴<br>[기본 지속 효과]: 잃은 체력에 비례해 방어력과 마법저항력 증가  [사용시]: 4턴간 방어력과 마법저항력이 " +
			(this.HP < 150 ? 150 : 80) +
			"증가"
		return info
	}

	getSkillInfoEng() {
		let info = []
		info[0] =
			"[Tusk Attack] cooltime:" +
			this.cooltime_list[0] +
			" turns<br>range:3,(7 to players that have mark of ivory),Damage a player by tusk, deals " +
			this.getSkillBaseDamage(0)+
			"magic damageDeals 30 more damage if the target has mark of ivory"
		info[1] =
			"[Curse of Ivory]<br> cooltime:" +
			this.cooltime_list[1] +
			" turns<br>range:15, Leaves mark of ivory to a player and applies curse effect"
		info[2] =
			"[Strengthen] cooltime:" +
			this.cooltime_list[2] +
			" turns<br>[Passive effect]: attack and magic resistance increase based on missing health [On use]: Attack and magic resistance increases by" +
			(this.HP < 150 ? 150 : 80)
		return info
	}
	getSkillTrajectorySpeed(skilltype:string):number{
		return 0
	}
	/**
	 * returns type,range, whether it is projectile,
	 * if the skill doesnt need target, use the skill
	 * @param {*} s
	 * @returns
	 */
	getSkillTargetSelector(s: number): SkillTargetSelector {
		let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(ENUM.SKILL_INIT_TYPE.CANNOT_USE).setSkill(s)  //-1 when can`t use skill, 0 when it`s not attack skill

		switch (s) {
			case ENUM.SKILL.Q:
				skillTargetSelector
				.setType(ENUM.SKILL_INIT_TYPE.TARGETING)
				.setRange(3)
			
				break
			case ENUM.SKILL.W:
				skillTargetSelector
				.setType(ENUM.SKILL_INIT_TYPE.TARGETING)
				.setRange(15)
			
				break
			case ENUM.SKILL.ULT:
				if (!this.AI) {
					this.useUlt()
				}
				skillTargetSelector
				.setType(ENUM.SKILL_INIT_TYPE.NON_TARGET)
				break
		}
		return skillTargetSelector
	}

	useUlt() {
		this.startCooltime(ENUM.SKILL.ULT)
		this.setShield(100, false)
		this.duration[ENUM.SKILL.ULT] = 4
		if (this.HP < 150) {
			this.u_active_amt = 150
			this.changeAbility("AR", this.u_active_amt)
			this.changeAbility("MR", this.u_active_amt)
		} else {
			this.u_active_amt = 80
			this.changeAbility("AR", this.u_active_amt)
			this.changeAbility("MR", this.u_active_amt)
		}
		this.showEffect("elephant_r",this.turn)
		this.changeApperance("elephant_r")

	}

	getSkillName(skill:number):string{
        return this.skill_name[skill]
    }


    getBasicAttackName():string{
        return super.getBasicAttackName()
    }


    getSkillProjectile(t:number):Projectile{
        return null
    }

	private getSkillBaseDamage(skill:number):number{
		if(skill===ENUM.SKILL.Q){
			return Math.floor(10 + this.AP * 0.3 + (this.AR + this.MR) * 0.45)
		}
	}
	/**
	 * actually use the skill
	 * get specific damage and projectile objects
	 * starts cooldown
	 * @param {*} target
	 * @returns
	 */
	getSkillDamage(target: number): SkillDamage {
		let skillattr: SkillDamage =null //-1 when can`t use skill, 0 when it`s not attack skill
		let s = this.pendingSkill
		this.pendingSkill = -1

		switch (s) {
			case ENUM.SKILL.Q:
				this.startCooltime(ENUM.SKILL.Q)

				//실버 인장
				let _this=this
				let dmg=this.getSkillBaseDamage(s)
				skillattr = {
					damage: new Damage(0, dmg, 0),
					skill: ENUM.SKILL.Q,
					onHit:function(){
						_this.heal(Math.floor(dmg*0.3))
					}
				}
				if (this.players[target].haveSign("silver_w", this.turn)) {
					skillattr.damage.updateTrueDamage(CALC_TYPE.plus,30)
					this.players[target].removeSign("silver_w", this.turn)
				}

				break
			case ENUM.SKILL.W:
				this.startCooltime(ENUM.SKILL.W)
				let myturn=this.turn
				let onhit=function(target:Player){
					target.giveSign({
						type: "silver_w",
						owner_turn: myturn,
						dur: 5,
						name: "Mark of Ivory"
					})
					target.applyEffectBeforeDice(ENUM.EFFECT.BAD_LUCK, 1)
				}

				skillattr = {
					damage: new Damage(0, 0, 0),
					skill: ENUM.SKILL.W,
					onHit:onhit
				}
				break
		}

		return skillattr
	}
	/**
	 * called every turn before throw dice
	 */
	passive() {
		if (this.level < 3 || this.HP > 250) {
			return
		}
		this.changeAbility("AR", -1 * this.u_passive_amt)
		this.changeAbility("MR", -1 * this.u_passive_amt)

		if (this.HP > 150) {
			this.u_passive_amt = 30
		} else if (this.HP > 50) {
			this.u_passive_amt = 45
		} else {
			this.u_passive_amt = 60
		}

		this.changeAbility("AR", this.u_passive_amt)
		this.changeAbility("MR", this.u_passive_amt)
	}

	/**
	 * called every turn after obstacle
	 */
	onSkillDurationCount() {}
	
	getBaseBasicAttackDamage():Damage{
        return super.getBaseBasicAttackDamage()
    }

	onSkillDurationEnd(skill:number){
		if(skill===ENUM.SKILL.ULT){
			this.changeAbility("AR", -1 * this.u_active_amt)
			this.changeAbility("MR", -1 * this.u_active_amt)
			this.changeApperance("")

		}
	}

	/**
	 * ai actually uses the skill
	 * chooses target or location and returns it
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
					type: ENUM.AI_SKILL_RESULT_TYPE.TARGET,
					data: this.getAiTarget(skilldata.targets)
				}
			case ENUM.SKILL.W:
				//  return {type:"location",data:1}
				return {
					type: ENUM.AI_SKILL_RESULT_TYPE.TARGET,
					data: this.getAiTarget(skilldata.targets)
				}
			case ENUM.SKILL.ULT:
				this.useUlt()
				return { type: ENUM.AI_SKILL_RESULT_TYPE.NON_TARGET, data: null }
		}
	}
}
export { Silver }