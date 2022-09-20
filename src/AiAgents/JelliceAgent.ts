import type { Jellice } from "../characters/Jellice";
import { ITEM, SKILL } from "../data/enum";
import { EntityFilter } from "../entity/EntityFilter";
import { AiAgent, ItemBuild } from "./AiAgent";

class JelliceAgent extends AiAgent{
    itemtree: ItemBuild
	player:Jellice
    constructor(player:Jellice){
        super(player)
        this.itemtree = new ItemBuild().setItems([
			ITEM.EPIC_CRYSTAL_BALL,
			ITEM.CARD_OF_DECEPTION,
			ITEM.TIME_WARP_POTION,
			ITEM.INVISIBILITY_CLOAK,
			ITEM.CROSSBOW_OF_PIERCING,
			ITEM.BOOTS_OF_PROTECTION
		]).setFinal(ITEM.EPIC_CRYSTAL_BALL)
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
	getMessageOnGameStart(): string {
		return "The mystic flame will burn you all!"
	}
}
export default JelliceAgent