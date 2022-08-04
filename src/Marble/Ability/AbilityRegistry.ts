import { ACTION_TYPE } from "../action/Action"
import { ACTION_SOURCE_TYPE } from "../action/ActionTrace"
import { Ability, DiceChanceAbility, MoveAbilty, PayAbility, ValueModifierAbility } from "./Ability"
import { DefenceCardAbility } from "./DefenceAbilty"
import { EVENT_TYPE } from "./EventType"

export enum ABILITY_NAME {
	
	NONE = "none",
	ANGEL_CARD = "angel_card",
	SHIELD_CARD = "shield_card",
	DISCOUNT_CARD = "discount_card",

	//phase 1
	SALARY_BONUS = "salary_bonus",
	ADDITIONAL_TOLL = "additional_toll",
	DICE_CONTROL_ACCURACY = "dice_control_accuracy",
	BACK_DICE = "back_dice",
	MOVE_DOUBLE_ON_DICE = "move_double_on_dice",
	DICE_DOUBLE = "dice_double",
	MONEY_ON_DICE="money_on_dice",
	GET_TRAVEL_ON_DRAW_CARD="get_travel_on_draw_card",
	TAKE_MONEY_ON_ARRIVE_TO_PLAYER="perfume",
	TAKE_MONEY_ON_PLAYER_ARRIVE_TO_ME="badge",
	TAKE_MONEY_ON_PASS_ENEMY="agreement",
	TAKE_MONEY_ON_ENEMY_PASS_ME="reverse_agreement",
	FREE_TOLL="free_toll",
	TRAVEL_ON_ENEMY_LAND="healing",
	MONEY_ON_MY_LAND="ring",


	//phase 2
	MONEY_ON_PASS_ENEMY="money_on_pass_enemy",
	MONEY_ON_ENEMY_PASS_ME="money_on_enemy_pass_me",
	FREE_AND_TRAVEL_ON_ENEMY_LAND="boss_healing",
	DEFEND_ATTACK="defend_attack",
	IGNORE_ATTACK_DEFEND="ignore_attack_defend",
	INSTANT_TRAVEL="freepass",
	ONE_MORE_DICE_AFTER_TRAVEL="taxi",
	TRAVEL_ON_TRIPLE_DOUBLE="travel_on_triple_double",
	FOLLOW_ON_ENEMY_HEALING="follow_on_enemy_healing",
	ONE_MORE_DICE_ON_MONOPOLY_CHANCE="speaker",
	GO_START_ON_THREE_HOUSE="construction",
	BUILD_ON_PASSED_LAND="build_on_passed_land"
}
const ABILITY_REGISTRY = new Map<ABILITY_NAME, Ability>()

ABILITY_REGISTRY.set(
	ABILITY_NAME.ANGEL_CARD,
	new DefenceCardAbility(ABILITY_NAME.ANGEL_CARD)
		.on(EVENT_TYPE.TOLL_CLAIMED)
		.on(EVENT_TYPE.BEING_ATTACKED)
)

ABILITY_REGISTRY.set(
	ABILITY_NAME.SHIELD_CARD,
	new DefenceCardAbility(ABILITY_NAME.SHIELD_CARD).on(EVENT_TYPE.BEING_ATTACKED)
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.DISCOUNT_CARD,
	new DefenceCardAbility(ABILITY_NAME.DISCOUNT_CARD).on(EVENT_TYPE.TOLL_CLAIMED)
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.SALARY_BONUS,
	new ValueModifierAbility(ABILITY_NAME.SALARY_BONUS).on(
		EVENT_TYPE.RECEIVE_SALARY
	)
	.desc("출발지 경유시 월급 $v% 추가 획득")
)

ABILITY_REGISTRY.set(
	ABILITY_NAME.DICE_CONTROL_ACCURACY,
	new Ability(ABILITY_NAME.DICE_CONTROL_ACCURACY).on(EVENT_TYPE.GENERATE_DICE_NUMBER)
	.desc("주사위 컨트롤 정확도 $c% 증가")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.BACK_DICE,
	new Ability(ABILITY_NAME.BACK_DICE).on(EVENT_TYPE.GENERATE_DICE_NUMBER)
	.desc("주사위 뒤로")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.MOVE_DOUBLE_ON_DICE,
	new Ability(ABILITY_NAME.MOVE_DOUBLE_ON_DICE).on(EVENT_TYPE.GENERATE_DICE_NUMBER)
	.desc("주사위 결과의 2배 이동")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.DICE_DOUBLE,
	new Ability(ABILITY_NAME.DICE_DOUBLE).on(EVENT_TYPE.GENERATE_DICE_NUMBER)
	.desc("주사위 더블 확률 $c% 증가")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.MONEY_ON_DICE,
	new PayAbility(ABILITY_NAME.MONEY_ON_DICE,PayAbility.BASE_FIXED).on(EVENT_TYPE.THROW_DICE)
	.desc("주사의를 던지면 주사위 수 x $v 만큼의 돈 획득")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.GET_TRAVEL_ON_DRAW_CARD,
	new Ability(ABILITY_NAME.GET_TRAVEL_ON_DRAW_CARD).on(EVENT_TYPE.DRAW_CARD)
	.desc("포춘 카드 획득시 $c% 확률로 여행 초대권 획득")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.TAKE_MONEY_ON_ARRIVE_TO_PLAYER,
	new PayAbility(ABILITY_NAME.TAKE_MONEY_ON_ARRIVE_TO_PLAYER,PayAbility.BASE_RATIO)
	.on(EVENT_TYPE.ARRIVE_TO_ENEMY)
	.desc("상대 말에게 도착시 보유 돈의 $v%을 빼앗음")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.TAKE_MONEY_ON_PLAYER_ARRIVE_TO_ME,
	new PayAbility(ABILITY_NAME.TAKE_MONEY_ON_PLAYER_ARRIVE_TO_ME, PayAbility.BASE_RATIO)
	.on(EVENT_TYPE.ENEMY_ARRIVE_TO_ME)
	.desc("상대 말이 나에게 도착시 보유 돈의 $v%을 빼앗음")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.TAKE_MONEY_ON_PASS_ENEMY,
	new PayAbility(ABILITY_NAME.TAKE_MONEY_ON_PASS_ENEMY, PayAbility.BASE_RATIO)
	.on(EVENT_TYPE.PASS_ENEMY)
	.desc("상대 말을 지나치면 $c%확률로 상대 보유 돈의 $v%을 빼앗음")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.TAKE_MONEY_ON_ENEMY_PASS_ME,
	new PayAbility(ABILITY_NAME.TAKE_MONEY_ON_ENEMY_PASS_ME, PayAbility.BASE_RATIO)
	.on(EVENT_TYPE.ENEMY_PASS_ME)
	.desc("상대 말이 나를 지나치면 $c%확률로 상대 보유 돈의 $v%을 빼앗음")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.ADDITIONAL_TOLL,
	new ValueModifierAbility(ABILITY_NAME.ADDITIONAL_TOLL)
	.on(EVENT_TYPE.CLAIM_TOLL)
	.desc("통행료 $v% 추가 징수")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.FREE_TOLL,
	new ValueModifierAbility(ABILITY_NAME.FREE_TOLL)
	.on(EVENT_TYPE.CLAIM_TOLL)
	.desc("상대 땅 도착시 통행료 면제")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.TRAVEL_ON_ENEMY_LAND,
	new MoveAbilty(ABILITY_NAME.TRAVEL_ON_ENEMY_LAND)
	.on(EVENT_TYPE.ARRIVE_ENEMY_LAND)
	.desc("상대 땅 도착시 $c% 확률로 세계여행")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.MONEY_ON_MY_LAND,
	new PayAbility(ABILITY_NAME.MONEY_ON_MY_LAND,PayAbility.BASE_RATIO)
	.on(EVENT_TYPE.ARRIVE_MY_LAND)
	.desc("자신의 땅 도착시 건설 비용의 $v%를 지급받음")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.INSTANT_TRAVEL,
	new Ability(ABILITY_NAME.INSTANT_TRAVEL)
	.on(EVENT_TYPE.ARRIVE_TRAVEL)
	.desc("$c% 확률로 세계여행 도착 시 즉시 이용 가능")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.GO_START_ON_THREE_HOUSE,
	new Ability(ABILITY_NAME.GO_START_ON_THREE_HOUSE)
	.on(EVENT_TYPE.BUILD)
	.desc("$c% 확률로 건물 3개 건설시 시작지점 이동")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.ONE_MORE_DICE_AFTER_TRAVEL,
	new Ability(ABILITY_NAME.ONE_MORE_DICE_AFTER_TRAVEL)
	.on(EVENT_TYPE.ARRIVE_TILE)
	.desc("세계여행에서 도착 시 $c% 확률로 주사위 한번 더")
)

ABILITY_REGISTRY.set(
	ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND,
	new MoveAbilty(ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND)
	.on(EVENT_TYPE.ARRIVE_ENEMY_LAND)
	.desc("상대 땅 도착시 통행료 면제 후 $c% 확률로 세계여행")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.ONE_MORE_DICE_ON_MONOPOLY_CHANCE,
	new DiceChanceAbility(ABILITY_NAME.ONE_MORE_DICE_ON_MONOPOLY_CHANCE)
	.on(EVENT_TYPE.MONOPOLY_CHANCE)
	.desc("독점 찬스시 $c% 확률로 주사위 한번더")
)


export { ABILITY_REGISTRY }
