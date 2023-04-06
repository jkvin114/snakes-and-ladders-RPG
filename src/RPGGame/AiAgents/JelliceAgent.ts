import type { Jellice } from "../characters/Jellice";
import { ITEM, SKILL } from "../data/enum";
import { EntityFilter } from "../entity/EntityFilter";
import { AiAgent, ItemBuild } from "./AiAgent";
import { ItemBuildStage, UtilityCondition } from "../core/ItemBuild";
import type { ServerGameEventFormat } from "../data/EventFormat";
import type { Player } from "../player/player";

class JelliceAgent extends AiAgent{
    itemBuild: ItemBuild
	skillManager:Jellice
	private readonly minEnemy:number //minimum number of enemies in range to use W
    constructor(player:Player,skillManager:Jellice){
        super(player)
		this.skillManager=skillManager
		if(this.player.game.isTeam)
			this.minEnemy=1
		else this.minEnemy=Math.max(1,this.player.game.totalnum-2)
		
        this.itemBuild = new ItemBuild().setItemStages([
			new ItemBuildStage(ITEM.EPIC_CRYSTAL_BALL),
			new ItemBuildStage(ITEM.CARD_OF_DECEPTION),
			new ItemBuildStage(ITEM.STAFF_OF_JUDGEMENT)
			.setChangeCondition(ITEM.INVISIBILITY_CLOAK,UtilityCondition.MoreADOverall()),
			new ItemBuildStage(ITEM.TIME_WARP_POTION),
			new ItemBuildStage(ITEM.BOOTS_OF_HASTE).setChangeCondition(
				ITEM.CROSSBOW_OF_PIERCING,
				UtilityCondition.MoreTankers()
			),new ItemBuildStage(ITEM.BOOTS_OF_PROTECTION).setChangeCondition(
				ITEM.ANCIENT_SPEAR,
				UtilityCondition.MoreTankers()
				).setSecondaryChangeCondition(
					ITEM.BOOTS_OF_ENDURANCE,
					UtilityCondition.MoreAPThanAD(2)
				)
		],new ItemBuildStage(ITEM.EPIC_CRYSTAL_BALL))
		
		this.gameStartMessage="The mystic flame will burn you all!"
    }
	nextSkill(): number {
		if (this.player.canBasicAttack()) {
			return  AiAgent.BASICATTACK
		}
		if (this.skillUseCounter.countItem(SKILL.ULT)<2) {
			return SKILL.ULT
		}
		if (!this.attemptedSkills.has(SKILL.W) && this.player.mapHandler.gamemap.finish - this.player.pos > 3) {
			let range=this.skillManager.qRange()

			//q 쿨 있고 사거리내에 1~3 명이상 있으면 사용
				if (
					this.skillManager.isCooltimeAvaliable(SKILL.Q) &&
					this.player.mediator.count(EntityFilter.ALL_ATTACKABLE_PLAYER(this.player)
					.in(this.player.pos-range.end_back*2,this.player.pos+range.end_front*2)) >= this.minEnemy
				)
			return SKILL.W
		}
		if (!this.attemptedSkills.has(SKILL.Q)) {
			let range=this.skillManager.qRange()
			if(this.skillManager.isSkillActivated(SKILL.W)){
				if(this.player.mediator.count(EntityFilter.ALL_ATTACKABLE_PLAYER(this.player)
				.in(this.player.pos - range.end_back*2,this.player.pos + range.end_front*2))>0)
				return SKILL.Q
			}
			else{
				//사거리네에 플레이어 있거나 w 쓰고 사거리안에 1~3명 있을때 사용
				if(this.player.mediator.count(EntityFilter.ALL_ATTACKABLE_PLAYER(this.player)
				.in(this.player.pos + range.start + 1, this.player.pos + range.end_front)
				.in(this.player.pos - range.end_back, this.player.pos - range.start))>0)
				return SKILL.Q
			}
		}
		return -1
	}
	getProjectilePos(skill: SKILL, selector: ServerGameEventFormat.LocationTargetSelector): number {
		let goal = null
		let targets = this.playersInProjRange(selector)

		//	console.log("getAiProjPos" + targets)
		if (targets.length === 0) {
			return -1
		}
		if (targets.length === 1) {
			//타겟이 1명일경우
			goal = targets[0]
			//속박걸렸으면 플레이어 위치 그대로
			if (!goal.canThrowDice() && Math.random()<0.8) {
				return goal.pos - this.skillUseCounter.countItem(SKILL.ULT)+1
			}
		} else {
			//타겟이 여러명일경우
			//앞에있는플레이어 우선
			targets.sort(function (b: Player, a: Player): number {
				return a.pos - b.pos
			})

			//속박걸린 플레이어있으면 그 플레이어 위치 그대로
			for (const t of targets) {
				if (!t.canThrowDice() && Math.random()<0.8) {
					return t.pos - this.skillUseCounter.countItem(SKILL.ULT)
				}
			}

			goal = targets[0]
		}
		let offset=9
		offset-=this.skillUseCounter.countItem(SKILL.ULT)*3
		return Math.min(goal.pos + offset - selector.size, Math.floor(this.player.pos + selector.range / 2))
	}
}
export default JelliceAgent