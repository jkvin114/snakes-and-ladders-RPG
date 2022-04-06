import { Creed } from "../characters/Creed";
import { ITEM } from "../enum";
import { AiAgent } from "./AiAgent";

class CreedAgent extends AiAgent{
    itemtree: {
		level: number
		items: number[]
		final: number
	}
    constructor(player:Creed){
        super(player)
        this.itemtree = {
			level: 0,
			items: [
				ITEM.EPIC_SWORD,
				ITEM.WARRIORS_SHIELDSWORD,
				ITEM.SWORD_OF_BLOOD,
				ITEM.EPIC_WHIP,
				ITEM.CROSSBOW_OF_PIERCING,
				ITEM.GUARDIAN_ANGEL
			],
			final: ITEM.EPIC_SWORD
		}
    }
}
export default CreedAgent