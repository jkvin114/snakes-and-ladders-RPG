import type { Jellice } from "../characters/Jellice";
import { ITEM, SKILL } from "../data/enum";
import { EntityFilter } from "../entity/EntityFilter";
import { AiAgent, ItemBuild } from "./AiAgent";
import { ItemBuildEntry, UtilityCondition } from "./ItemBuild";

class JelliceAgent extends AiAgent{
    itemBuild: ItemBuild
	player:Jellice
    constructor(player:Jellice){
        super(player)
        this.itemBuild = new ItemBuild().setItemEntries([
			new ItemBuildEntry(ITEM.EPIC_CRYSTAL_BALL),
			new ItemBuildEntry(ITEM.CARD_OF_DECEPTION),
			new ItemBuildEntry(ITEM.STAFF_OF_JUDGEMENT).setChangeCondition(
				ITEM.CROSSBOW_OF_PIERCING,
				UtilityCondition.MoreTankers()
				),
			new ItemBuildEntry(ITEM.TIME_WARP_POTION),
			new ItemBuildEntry(ITEM.BOOTS_OF_HASTE).setChangeCondition(
				ITEM.INVISIBILITY_CLOAK,
				UtilityCondition.IsAdvantageous()
			),new ItemBuildEntry(ITEM.BOOTS_OF_PROTECTION).setChangeCondition(
				ITEM.ANCIENT_SPEAR,
				UtilityCondition.MoreTankers()
				).setSecondChangeCondition(
					ITEM.BOOTS_OF_ENDURANCE,
					UtilityCondition.MoreAPThanAD(2)
				)
		],new ItemBuildEntry(ITEM.EPIC_CRYSTAL_BALL))
		
		.setItems([
			ITEM.EPIC_CRYSTAL_BALL,
			ITEM.CARD_OF_DECEPTION,
			ITEM.STAFF_OF_JUDGEMENT,
			ITEM.TIME_WARP_POTION,
			ITEM.INVISIBILITY_CLOAK,
			ITEM.BOOTS_OF_PROTECTION
		]).setFinal(ITEM.EPIC_CRYSTAL_BALL)
		this.gameStartMessage="The mystic flame will burn you all!"
    }
	nextSkill(): number {
		if (this.player.canBasicAttack()) {
			return  AiAgent.BASICATTACK
		}
		if (!this.attemptedSkills.has(SKILL.ULT)) {
			return SKILL.ULT
		}
		if (!this.attemptedSkills.has(SKILL.W)) {
			let range=this.player.qRange()
			//q 쿨 있고 사거리내에 1~3 명이상 있으면 사용
				if (
					this.player.isCooltimeAvaliable(SKILL.Q) &&
					this.player.mediator.count(EntityFilter.ALL_ATTACKABLE_PLAYER(this.player)
					.in(this.player.pos-range.end_back*2,this.player.pos+range.end_front*2)) >= this.player.game.totalnum - 1
				)
			return SKILL.W
		}
		if (!this.attemptedSkills.has(SKILL.Q)) {
			let range=this.player.qRange()
			//사거리네에 플레이어 있거나 w 쓰고 사거리안에 1~3명 있을때 사용
			if(this.player.mediator.count(EntityFilter.ALL_ATTACKABLE_PLAYER(this.player)
			 				.in(this.player.pos + range.start + 1, this.player.pos + range.end_front)
			 				.in(this.player.pos - range.end_back, this.player.pos - range.start))>0)
			return SKILL.Q
		}
		return -1
	}
}
export default JelliceAgent