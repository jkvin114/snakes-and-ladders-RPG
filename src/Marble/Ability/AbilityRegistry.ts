import { ACTION_TYPE } from "../action/Action"
import { ACTION_SOURCE_TYPE } from "../action/ActionSource"
import { Ability } from "./Ability"
import { DefenceCardAbility } from "./DefenceAbilty"
import { EVENT_TYPE } from "./EventType"

export enum ABILITY_NAME {
    NONE="none",
	ANGEL_CARD = "angel_card",
	SHIELD_CARD = "shield_card",
	DISCOUNT_CARD = "discount_card",
}
const ABILITY_REGISTRY = new Map<ABILITY_NAME, Ability>()

ABILITY_REGISTRY.set(
	ABILITY_NAME.ANGEL_CARD,
	new DefenceCardAbility(ABILITY_NAME.ANGEL_CARD, ACTION_SOURCE_TYPE.USE_DEFENCE_CARD)
		.on(EVENT_TYPE.TOLL_CLAIMED)
		.on(EVENT_TYPE.BEING_ATTACKED)
)

ABILITY_REGISTRY.set(
	ABILITY_NAME.SHIELD_CARD,
	new DefenceCardAbility(ABILITY_NAME.SHIELD_CARD, ACTION_SOURCE_TYPE.USE_DEFENCE_CARD
        )
    .on(
		EVENT_TYPE.BEING_ATTACKED
	)
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.DISCOUNT_CARD,
	new DefenceCardAbility(ABILITY_NAME.DISCOUNT_CARD, ACTION_SOURCE_TYPE.USE_DEFENCE_CARD,
   )
    .on(
		EVENT_TYPE.TOLL_CLAIMED
	)
)
export {ABILITY_REGISTRY}