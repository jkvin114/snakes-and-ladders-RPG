import { ACTION_TYPE } from "../action/Action"
import { Ability, DiceChanceAbility, ForceMoveAbilty, MoveAbilty, PayAbility, ValueModifierAbility } from "./Ability"
import { DefenceAbility, DefenceCardAbility } from "./DefenceAbilty"
import { EVENT_TYPE } from "./EventType"

export enum ABILITY_NAME {
	
	NONE = "",
	ANGEL_CARD = "angel_card",
	SHIELD_CARD = "shield_card",
	DISCOUNT_CARD = "discount_card",
	FIRST_TURN_DOUBLE="first_turn_double",

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
	BUILD_ON_PASSED_LAND="build_on_passed_land",
	LANDMARK_ON_AFTER_TRAVEL="flag",
	IGNORE_ANGEL="ignore_angel",

	//phase3
	RANGE_PULL_ON_ARRIVE_LANDMARK="range_pull_on_arrive_landmark",
	RANGE_PULL_ON_BUILD_LANDMARK="range_pull_on_build_landmark",
	LINE_PULL_ON_ARRIVE_AND_BUILD_LANDMARK="line_pull",
	OLYMPIC_LANDMARK_AND_PULL="iaan",
	ROOT_ON_ENEMY_ARRIVE_MY_LANDMARK="bubble",
	CALL_PLAYERS_ON_TRAVEL="boss_call",
	ADD_MULTIPLIER_ON_BUILD_LANDMARK="apply_multiplier_on_build_landmark",
	ADD_MULTIPLIER_ON_ARRIVE_MY_LAND="monument",
	ADD_MULTIPLIER_ON_PASS_START="inheritance_document",

	//phase4
	BLACKHOLE_ON_BUILD_LANDMARK="blackhole_on_build_landmark",
	BLACKHOLE_ON_ARRIVE_LANDMARK="blackhole_on_arrive_landmark",
	THROW_TO_LANDMARK_ON_ENEMY_ARRIVE_TO_ME="wrong_guidebook",
	ADD_MULTIPLIER_ON_CREATE_BLACKHOLE="add_multiplier_on_blackhole",
	STEAL_MULTIPLIER="blueprint",
	STEAL_MULTIPLIER_AND_LOCK="blueprint_and_lock",
	FREE_AND_TRAVEL_ON_ENEMY_AND_MY_LAND="healing_everywhere",
	STOP_ENEMY_ON_MY_LANDMARK="police_car",

	//phase5
	INSTANT_ESCAPE_ISLAND="instant_escape_island",
	LINE_BUYOUT_ON_BUILD="red_sticker",
	LINE_LANDMARK_ON_BUILD="newtown",
	LINE_MOVE_ON_ARRIVE_MY_LAND="line_trampoline",
	MY_LAND_MOVE_ON_ARRIVE_MY_LAND="my_land_trampoline",
	MY_LAND_MOVE_AND_FREE_ON_ARRIVE_ENEMY_LAND="enemy_land_trampoline",
	FREE_MOVE_ON_ARRIVE_ENEMY_LAND="enemy_land_trampoline_freemove",

	MOVE_TO_PLAYER_AND_STEAL_ON_ARRIVE_MY_LAND="ninja_scroll",
	UPGRADE_LAND_AND_MULTIPLIER_ON_BUILD="upgrade_construction_tool",
	MOVE_IN_PLACE_ON_BUILD="in_place_construction_tool",
	DICE_CHANCE_ON_BUILD_LANDMARK="dice_chance_on_build_landmark",
	MY_LAND_MOVE_ON_BUILD_LANDMARK="my_land_move_on_build_landmark",
	LINE_MOVE_ON_TRIPLE_DOUBLE="teleport_invitation",
	MY_LAND_MOVE_ON_BLACKHOLE="my_land_move_on_blackhole",
	CORNER_SPECIAL_MOVE_ON_ARRIVE_CORNER="corner_special_move_on_arrive_corner",
	BLOCK_BUYOUT="block_buyout",
	TRAVEL_ON_PASS_TRAVEL_AND_DICE_CHANCE="sophie",
	ADDITIONAL_LANDMARK_ON_BUILD="additional_landmark_on_build",
	MOVE_IN_DICE_RANGE_AFTER_DICE="move_in_dice_range_after_dice",
	THROW_TO_LANDMARK_AND_DONATE_ON_ENEMY_ARRIVE_TO_ME="donate_guidebook",

	LOCK_MULTIPLIER_AND_DOUBLE_ON_START_BUILD="lock_multiplier_and_double_on_start_build",
	TOLL_REFLECTION="toll_reflection",
	FREE_BUYOUT_AND_DOUBLE="free_buyout_and_double",
	
	THROW_TO_LANDMARK_WITH_MULTIPLIER="hell_guidebook"
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
	new DefenceCardAbility(ABILITY_NAME.SHIELD_CARD)
	.on(EVENT_TYPE.BEING_ATTACKED)
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.DISCOUNT_CARD,
	new DefenceCardAbility(ABILITY_NAME.DISCOUNT_CARD)
	.on(EVENT_TYPE.TOLL_CLAIMED)
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.SALARY_BONUS,
	new ValueModifierAbility(ABILITY_NAME.SALARY_BONUS).on(
		EVENT_TYPE.RECEIVE_SALARY
	)
	.desc("출발지 경유시 월급 $v% 추가 획득")
	.setAlerts(["월급 추가획득!"])
)

ABILITY_REGISTRY.set(
	ABILITY_NAME.DICE_CONTROL_ACCURACY,
	new Ability(ABILITY_NAME.DICE_CONTROL_ACCURACY)
	.on(EVENT_TYPE.GENERATE_DICE_NUMBER)
	.desc("주사위 컨트롤 정확도 $c% 증가")
	.setAlerts(["주사위 컨트롤 정획도 향상!"])
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
	.setAlerts(["주사위 더블!"])
	
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.FIRST_TURN_DOUBLE,
	new Ability(ABILITY_NAME.FIRST_TURN_DOUBLE)
	.on(EVENT_TYPE.GENERATE_DICE_NUMBER)
	.desc("첫 주사위 더블")
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.MONEY_ON_DICE,
	new PayAbility(ABILITY_NAME.MONEY_ON_DICE,PayAbility.BASE_FIXED).on(EVENT_TYPE.THROW_DICE)
	.desc("주사위를 던지면 주사위 수 x $v 만큼의 돈 획득")
	.setAlerts(["주사위 숫자만큼 돈 획득!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.GET_TRAVEL_ON_DRAW_CARD,
	new Ability(ABILITY_NAME.GET_TRAVEL_ON_DRAW_CARD).on(EVENT_TYPE.DRAW_CARD)
	.desc("포춘 카드 획득시 $c% 확률로 여행 초대권 획득")
	.setAlerts(["여행 초대권 획득!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.TAKE_MONEY_ON_ARRIVE_TO_PLAYER,
	new PayAbility(ABILITY_NAME.TAKE_MONEY_ON_ARRIVE_TO_PLAYER,PayAbility.BASE_RATIO)
	.on(EVENT_TYPE.ARRIVE_TO_ENEMY)
	.desc("상대 말에게 도착시 보유 돈의 $v%을 빼앗음")
	.setAlerts(["상대 돈 빼앗음!"])
	
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.TAKE_MONEY_ON_PLAYER_ARRIVE_TO_ME,
	new PayAbility(ABILITY_NAME.TAKE_MONEY_ON_PLAYER_ARRIVE_TO_ME, PayAbility.BASE_RATIO)
	.on(EVENT_TYPE.ENEMY_ARRIVE_TO_ME)
	.desc("상대 말이 나에게 도착시 보유 돈의 $v%을 빼앗음")
	.setAlerts(["상대 돈 빼앗음!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.TAKE_MONEY_ON_PASS_ENEMY,
	new PayAbility(ABILITY_NAME.TAKE_MONEY_ON_PASS_ENEMY, PayAbility.BASE_RATIO)
	.on(EVENT_TYPE.PASS_ENEMY)
	.desc("상대 말을 지나치면 $c%확률로 상대 보유 돈의 $v%을 빼앗음")
	.setAlerts(["상대 돈 빼앗음!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.TAKE_MONEY_ON_ENEMY_PASS_ME,
	new PayAbility(ABILITY_NAME.TAKE_MONEY_ON_ENEMY_PASS_ME, PayAbility.BASE_RATIO)
	.on(EVENT_TYPE.ENEMY_PASS_ME)
	.desc("상대 말이 나를 지나치면 $c%확률로 상대 보유 돈의 $v%을 빼앗음")
	.setAlerts(["상대 돈 빼앗음!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.ADDITIONAL_TOLL,
	new ValueModifierAbility(ABILITY_NAME.ADDITIONAL_TOLL)
	.on(EVENT_TYPE.CLAIM_TOLL)
	.desc("통행료 $v% 추가 징수")
	.setAlerts(["통행료 증가!"])

)
ABILITY_REGISTRY.set(
	ABILITY_NAME.FREE_TOLL,
	new ValueModifierAbility(ABILITY_NAME.FREE_TOLL)
	.on(EVENT_TYPE.CLAIM_TOLL)
	.desc("상대 땅 도착시 통행료 면제")
	.setAlerts(["통행료 면제!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.TRAVEL_ON_ENEMY_LAND,
	new MoveAbilty(ABILITY_NAME.TRAVEL_ON_ENEMY_LAND)
	.on(EVENT_TYPE.ARRIVE_ENEMY_LAND)
	.desc("상대 땅 도착시 $c% 확률로 세계여행")
	.setAlerts(["세계여행!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.MONEY_ON_MY_LAND,
	new PayAbility(ABILITY_NAME.MONEY_ON_MY_LAND,PayAbility.BASE_RATIO)
	.on(EVENT_TYPE.ARRIVE_MY_LAND)
	.desc("자신의 땅 도착시 건설 비용의 $v%를 지급받음")
	.setAlerts(["건설비용 지급!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.INSTANT_TRAVEL,
	new Ability(ABILITY_NAME.INSTANT_TRAVEL)
	.on(EVENT_TYPE.ARRIVE_TRAVEL)
	.desc("$c% 확률로 세계여행 도착 시 즉시 이용 가능")
	.setAlerts(["즉시 세계여행!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.GO_START_ON_THREE_HOUSE,
	new Ability(ABILITY_NAME.GO_START_ON_THREE_HOUSE)
	.on(EVENT_TYPE.BUILD)
	.desc("$c% 확률로 건물 3개 건설시 시작지점 이동")
	.setAlerts(["시작지점 이동!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.ONE_MORE_DICE_AFTER_TRAVEL,
	new DiceChanceAbility(ABILITY_NAME.ONE_MORE_DICE_AFTER_TRAVEL)
	.on(EVENT_TYPE.TRAVEL_START)
	.desc("세계여행에서 도착 시 $c% 확률로 주사위 한번 더!")
	.setAlerts(["주사위 한번더!"])
)

ABILITY_REGISTRY.set(
	ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND,
	new MoveAbilty(ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND)
	.on(EVENT_TYPE.ARRIVE_ENEMY_LAND)
	.desc("상대 땅 도착시 $c% 확률로 통행료 면제 후 세계여행")
	.setAlerts(["통행료 면제 후 세계여행!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.ONE_MORE_DICE_ON_MONOPOLY_CHANCE,
	new DiceChanceAbility(ABILITY_NAME.ONE_MORE_DICE_ON_MONOPOLY_CHANCE)
	.on(EVENT_TYPE.MONOPOLY_CHANCE)
	.desc("독점 찬스시 $c% 확률로 주사위 한번더!")
	.setAlerts(["주사위 한번더!"])
)

ABILITY_REGISTRY.set(
	ABILITY_NAME.FOLLOW_ON_ENEMY_HEALING,
	new MoveAbilty(ABILITY_NAME.FOLLOW_ON_ENEMY_HEALING)
	.on(EVENT_TYPE.ENEMY_ARRIVE_MY_LAND)
	.desc("상대가 내 땅에서 힐링 여행권 발동시 $c% 확률로 따라감")
	.setAlerts(["상대가 내 땅에서 힐링 여행권 발동시 따라감!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.TRAVEL_ON_TRIPLE_DOUBLE,
	new MoveAbilty(ABILITY_NAME.TRAVEL_ON_TRIPLE_DOUBLE)
	.on(EVENT_TYPE.THREE_DOUBLE)
	.desc("$c% 확률로 더블 3회시 세계여행")
	.setAlerts(["더블 3회시 세계여행!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL,
	new Ability(ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL)
	.on(EVENT_TYPE.TRAVEL_START)
	.desc("세계여행 도착시 $c% 확률로 즉시 랜드마크 건설 가능")
	.setAlerts(["즉시 랜드마크 건설 가능!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.DEFEND_ATTACK,
	new DefenceAbility(ABILITY_NAME.DEFEND_ATTACK)
	.on(EVENT_TYPE.BEING_ATTACKED)
	.on(EVENT_TYPE.BEING_PULLED)
	.desc("$c% 확률로 상대 공격/끌어당김 방어")
	.setAlerts(["공격 방어!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.IGNORE_ATTACK_DEFEND,
	new DefenceAbility(ABILITY_NAME.IGNORE_ATTACK_DEFEND)
	.on(EVENT_TYPE.DO_ATTACK)
	.on(EVENT_TYPE.PULL_ENEMY)
	.desc("$c% 확률로 상대 공격/끌어당김 방어 무력화")
	.setAlerts(["공격방어 무력화!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.IGNORE_ANGEL,
	new DefenceAbility(ABILITY_NAME.IGNORE_ANGEL)
	.on(EVENT_TYPE.CLAIM_TOLL)
	.desc("$c% 확률로 상대가 내 랜드마크에서 사용한 천사카드 무력화")
	.setAlerts(["천사카드 무력화!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.RANGE_PULL_ON_ARRIVE_LANDMARK,
	new ForceMoveAbilty(ABILITY_NAME.RANGE_PULL_ON_ARRIVE_LANDMARK)
	.on(EVENT_TYPE.ARRIVE_MY_LAND)
	.desc("$c% 확률로 내 랜드마크 도착 시 4칸이내 상대 끌어당김")
	.setAlerts(["주변상대 끌어당김!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.LINE_PULL_ON_ARRIVE_AND_BUILD_LANDMARK,
	new ForceMoveAbilty(ABILITY_NAME.LINE_PULL_ON_ARRIVE_AND_BUILD_LANDMARK)
	.on(EVENT_TYPE.ARRIVE_MY_LAND)
	.on(EVENT_TYPE.BUILD_LANDMARK)
	.desc("$c% 확률로 내 랜드마크 도착/건설 시 같은 라인의 상대 끌어당김")
	.setAlerts(["주변상대 끌어당김!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.RANGE_PULL_ON_BUILD_LANDMARK,
	new ForceMoveAbilty(ABILITY_NAME.RANGE_PULL_ON_BUILD_LANDMARK)
	.on(EVENT_TYPE.BUILD_LANDMARK)
	.desc("$c% 확률로 랜드마크 건설 시 4칸이내 상대 끌어당김")
	.setAlerts(["주변상대 끌어당김!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL,
	new ForceMoveAbilty(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL)
	.on(EVENT_TYPE.ARRIVE_OLYMPIC)
	.desc("올림픽 지역 도착 시 $c% 확률로 개최지 랜드마크로 업그레이드 후 4칸이내 상대 끌어당김")
	.setAlerts(["올립픽 개최 시 랜드마크로 업그레이드!","주변상대 끌어당김!"])
)

ABILITY_REGISTRY.set(
	ABILITY_NAME.ADD_MULTIPLIER_ON_ARRIVE_MY_LAND,
	new Ability(ABILITY_NAME.ADD_MULTIPLIER_ON_ARRIVE_MY_LAND)
	.on(EVENT_TYPE.ARRIVE_MY_LAND)
	.desc("내 땅 도착시 $c% 확률로 통행료 2배")
	.setAlerts(["통행료 증가!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.ADD_MULTIPLIER_ON_BUILD_LANDMARK,
	new Ability(ABILITY_NAME.ADD_MULTIPLIER_ON_BUILD_LANDMARK)
	.on(EVENT_TYPE.BUILD_LANDMARK)
	.desc("랜드마크 건설시 $c% 확률로 통행료 2,4,8배중 랜덤적용")
	.setAlerts(["랜드마크 통행료 증가!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.CALL_PLAYERS_ON_TRAVEL,
	new Ability(ABILITY_NAME.CALL_PLAYERS_ON_TRAVEL)
	.on(EVENT_TYPE.ARRIVE_MY_LAND)
	.desc("내 랜드마크 도착시 세계여행에 있는 상대들을 $c% 확률로 호출")
	.setAlerts(["세계여행에 있는 상데 호출!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.ROOT_ON_ENEMY_ARRIVE_MY_LANDMARK,
	new Ability(ABILITY_NAME.ROOT_ON_ENEMY_ARRIVE_MY_LANDMARK)
	.on(EVENT_TYPE.ENEMY_ARRIVE_MY_LAND)
	.desc("상대가 내 랜드마크 도착시 $c% 확률로 속박")
	.setAlerts(["속박!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.ADD_MULTIPLIER_ON_PASS_START,
	new Ability(ABILITY_NAME.ADD_MULTIPLIER_ON_PASS_START)
	.on(EVENT_TYPE.RECEIVE_SALARY)
	.desc("출발지 경유 시 내 땅중 한곳 배수 4배 증가")
	.setAlerts(["통행료 증가!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.BLACKHOLE_ON_BUILD_LANDMARK,
	new Ability(ABILITY_NAME.BLACKHOLE_ON_BUILD_LANDMARK)
	.on(EVENT_TYPE.BUILD_LANDMARK)
	.desc("랜드마크 건설 시 $c% 확률로 원하는 곳에 블랙홀 생성")
	.setAlerts(["원하는 곳에 블랙홀 생성!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.BLACKHOLE_ON_ARRIVE_LANDMARK,
	new Ability(ABILITY_NAME.BLACKHOLE_ON_ARRIVE_LANDMARK)
	.on(EVENT_TYPE.ARRIVE_MY_LAND)
	.desc("내 랜드마크 도착 시 $c% 확률로 원하는 곳에 블랙홀 생성")
	.setAlerts(["원하는 곳에 블랙홀 생성!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.THROW_TO_LANDMARK_ON_ENEMY_ARRIVE_TO_ME,
	new Ability(ABILITY_NAME.THROW_TO_LANDMARK_ON_ENEMY_ARRIVE_TO_ME)
	.on(EVENT_TYPE.ENEMY_ARRIVE_TO_ME)
	.desc("상대가 나에게 도착시 $c% 확률로 가장 비싼 내 랜드마크로 날려보냄")
	.setAlerts(["내 랜드마크로 날려보냄!!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.ADD_MULTIPLIER_ON_CREATE_BLACKHOLE,
	new Ability(ABILITY_NAME.ADD_MULTIPLIER_ON_CREATE_BLACKHOLE)
	.on(EVENT_TYPE.CREATE_BLACKHOLE)
	.desc("블랙홀 생성 시 화이트홀 지역 배수 2,4,8배 중 적용")
	.setAlerts(["화이트홀 지역 통행료 증가!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.STEAL_MULTIPLIER,
	new Ability(ABILITY_NAME.STEAL_MULTIPLIER)
	.on(EVENT_TYPE.ARRIVE_ENEMY_LAND)
	.desc("상대지역 도착시 $c% 확률료 배수를 내 땅으로 이전 (기본통행료만 지불)")
	.setAlerts(["배수 이전!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.STEAL_MULTIPLIER_AND_LOCK,
	new Ability(ABILITY_NAME.STEAL_MULTIPLIER_AND_LOCK)
	.on(EVENT_TYPE.ARRIVE_ENEMY_LAND)
	.desc("상대지역 도착시 $c% 확률료 배수를 내 땅으로 이전 후 배수잠금 (기본통행료만 지불)")
	.setAlerts(["배수 이전 후 배수잠금!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_AND_MY_LAND,
	new MoveAbilty(ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_AND_MY_LAND)
	.on(EVENT_TYPE.ARRIVE_ENEMY_LAND)
	.on(EVENT_TYPE.ARRIVE_MY_LAND)
	.desc("내 땅 혹은 상대 땅 도착시 $c% 확률로 통행료 면제 후 세계여행")
	.setAlerts(["세계여행!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.STOP_ENEMY_ON_MY_LANDMARK,
	new Ability(ABILITY_NAME.STOP_ENEMY_ON_MY_LANDMARK)
	.on(EVENT_TYPE.ENEMY_PASS_ME)
	.desc("내 랜드마크에 서있을시 $c% 확률로 지나가는 상대를 붙잡고 통행료 2배 징수")
	.setAlerts(["지나가는 상대 붙잡음!","통행료 2배 적용!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.INSTANT_ESCAPE_ISLAND,
	new DiceChanceAbility(ABILITY_NAME.INSTANT_ESCAPE_ISLAND)
	.on(EVENT_TYPE.ARRIVE_ISLAND)
	.desc("무인도 도착시 $c% 확률로 즉시 주사위 굴려 무인도 탈출 (더블효과 없음)")
	.setAlerts(["주사위를 굴려 무인도 탈출!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.LINE_BUYOUT_ON_BUILD,
	new Ability(ABILITY_NAME.LINE_BUYOUT_ON_BUILD)
	.on(EVENT_TYPE.BUILD)
	.on(EVENT_TYPE.BUILD_LANDMARK)
	.desc("건설시 $c% 확률로 같은 라인의 땅 인수가능")
	.setAlerts(["같은 라인의 땅 인수!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.LINE_LANDMARK_ON_BUILD,
	new Ability(ABILITY_NAME.LINE_LANDMARK_ON_BUILD)
	.on(EVENT_TYPE.BUILD)
	.desc("건설시(관광지제외) $c% 확률로 같은 라인의 내 땅 모두 랜드마크로 업그레이드")
	.setAlerts(["라인 전체 랜드마크 업그레이드!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.LINE_MOVE_ON_ARRIVE_MY_LAND,
	new MoveAbilty(ABILITY_NAME.LINE_MOVE_ON_ARRIVE_MY_LAND)
	.on(EVENT_TYPE.ARRIVE_MY_LAND)
	.desc("내 땅 도착시 $c% 확률로 라인이동")
	.setAlerts(["라인 이동!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.MY_LAND_MOVE_ON_ARRIVE_MY_LAND,
	new MoveAbilty(ABILITY_NAME.MY_LAND_MOVE_ON_ARRIVE_MY_LAND)
	.on(EVENT_TYPE.ARRIVE_MY_LAND)
	.desc("내 땅 도착시 $c% 확률로 내 땅 이동")
	.setAlerts(["원하는 내 땅으로 이동!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.MY_LAND_MOVE_AND_FREE_ON_ARRIVE_ENEMY_LAND,
	new MoveAbilty(ABILITY_NAME.MY_LAND_MOVE_AND_FREE_ON_ARRIVE_ENEMY_LAND)
	.on(EVENT_TYPE.ARRIVE_ENEMY_LAND)
	.desc("상대 땅 도착시 $c% 확률로 통행료 면제 후 내 땅 이동")
	.setAlerts(["원하는 내 땅으로 이동!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.FREE_MOVE_ON_ARRIVE_ENEMY_LAND,
	new MoveAbilty(ABILITY_NAME.FREE_MOVE_ON_ARRIVE_ENEMY_LAND)
	.on(EVENT_TYPE.ARRIVE_ENEMY_LAND)
	.desc("상대 땅 도착시 $c% 확률로 통행료 지불 후 원하는 땅 이동")
	.setAlerts(["원하는 땅으로 이동!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.MOVE_TO_PLAYER_AND_STEAL_ON_ARRIVE_MY_LAND,
	new MoveAbilty(ABILITY_NAME.MOVE_TO_PLAYER_AND_STEAL_ON_ARRIVE_MY_LAND)
	.on(EVENT_TYPE.ARRIVE_MY_LAND)
	.desc("내 땅 도착시 $c% 확률로 원하는 상대에게 이동 후 보유돈 $v% 강탈/공격카드(정전,매각,체인지) 발동")
	.setAlerts(["원하는 상대에게 이동 후 보유돈 강탈/공격카드 획득!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.LINE_MOVE_ON_TRIPLE_DOUBLE,
	new MoveAbilty(ABILITY_NAME.LINE_MOVE_ON_TRIPLE_DOUBLE)
	.on(EVENT_TYPE.THREE_DOUBLE)
	.desc("더블 3회시 $c% 확률로 라인이동")
	.setAlerts(["라인 이동!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.MY_LAND_MOVE_ON_BUILD_LANDMARK,
	new MoveAbilty(ABILITY_NAME.MY_LAND_MOVE_ON_BUILD_LANDMARK)
	.on(EVENT_TYPE.BUILD_LANDMARK)
	.desc("랜드마크 건설시 $c% 확률로 자신의 땅 선택이동")
	.setAlerts(["원하는 내 땅으로 이동!"])
)

ABILITY_REGISTRY.set(
	ABILITY_NAME.DICE_CHANCE_ON_BUILD_LANDMARK,
	new DiceChanceAbility(ABILITY_NAME.DICE_CHANCE_ON_BUILD_LANDMARK)
	.on(EVENT_TYPE.BUILD_LANDMARK)
	.desc("랜드마크 건설시 $c% 확률로 주사위 한번더(더블 효과 없음)")
	.setAlerts(["주사위 한번더!"])
)


ABILITY_REGISTRY.set(
	ABILITY_NAME.UPGRADE_LAND_AND_MULTIPLIER_ON_BUILD,
	new Ability(ABILITY_NAME.UPGRADE_LAND_AND_MULTIPLIER_ON_BUILD)
	.on(EVENT_TYPE.BUILD)
	.desc("건설시 $c% 확률로 건물 1단계 업그레이드 후 통행료 2배")
	.setAlerts(["건물 업그레이드 후 통행료 증가!"])
)

ABILITY_REGISTRY.set(
	ABILITY_NAME.MOVE_IN_PLACE_ON_BUILD,
	new MoveAbilty(ABILITY_NAME.MOVE_IN_PLACE_ON_BUILD)
	.on(EVENT_TYPE.BUILD)
	.desc("3건물 건설시 $c% 확률로 제자리 이동")
	.setAlerts(["제자리 이동!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.MY_LAND_MOVE_ON_BLACKHOLE,
	new MoveAbilty(ABILITY_NAME.MY_LAND_MOVE_ON_BLACKHOLE)
	.on(EVENT_TYPE.ARRIVE_BLACKHOLE)
	.desc("$c% 확률로 블랙홀 도착시 내 땅 선택 이동")
	.setAlerts(["원하는 내 땅으로 이동!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.CORNER_SPECIAL_MOVE_ON_ARRIVE_CORNER,
	new MoveAbilty(ABILITY_NAME.CORNER_SPECIAL_MOVE_ON_ARRIVE_CORNER)
	.on(EVENT_TYPE.ARRIVE_ISLAND)
	.on(EVENT_TYPE.ARRIVE_TRAVEL)
	.on(EVENT_TYPE.ARRIVE_START)
	.on(EVENT_TYPE.ARRIVE_OLYMPIC)
	.desc("$c% 확률로 모서리 지역 도착시 모서리 지역 혹은 특수지역 이동")
	.setAlerts(["원하는 모서리 지역 혹은 특수지역 이동!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.BLOCK_BUYOUT,
	new Ability(ABILITY_NAME.BLOCK_BUYOUT)
	.on(EVENT_TYPE.BEING_BUYOUT)
	.desc("$c% 확률로 인수 방어")
	.setAlerts(["인수 방어!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.TRAVEL_ON_PASS_TRAVEL_AND_DICE_CHANCE,
	new MoveAbilty(ABILITY_NAME.TRAVEL_ON_PASS_TRAVEL_AND_DICE_CHANCE)
	.on(EVENT_TYPE.PASS_TRAVEL)
	.on(EVENT_TYPE.ARRIVE_TRAVEL)
	.desc("세계여행에 도착하거나 지나칠 때 $c% 확률로 즉시 세계여행 발동/이동후 주사위 한번 더!")
	.setAlerts(["죽시 세계여행!","주사위 한번 더!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.ADDITIONAL_LANDMARK_ON_BUILD,
	new Ability(ABILITY_NAME.ADDITIONAL_LANDMARK_ON_BUILD)
	.on(EVENT_TYPE.BUILD)
	.on(EVENT_TYPE.BUILD_LANDMARK)
	.desc("건설시 $c% 확률로 다른곳에 랜드마크 추가생성(내 땅 우선)")
	.setAlerts(["랜드마크 추가생성!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.MOVE_IN_DICE_RANGE_AFTER_DICE,
	new MoveAbilty(ABILITY_NAME.MOVE_IN_DICE_RANGE_AFTER_DICE)
	.on(EVENT_TYPE.THROW_DICE)
	.desc("주사위를 굴린 후 $c% 확률로 이동 범위내 선택이동")
	.setAlerts(["원하는 땅으로 이동!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.THROW_TO_LANDMARK_AND_DONATE_ON_ENEMY_ARRIVE_TO_ME,
	new Ability(ABILITY_NAME.THROW_TO_LANDMARK_AND_DONATE_ON_ENEMY_ARRIVE_TO_ME)
	.on(EVENT_TYPE.ENEMY_ARRIVE_TO_ME)
	.desc("상대가 나에게 도착하면 $c% 확률로 가장비싼지역 기부받고 내 랜드마크로 날려보냄(통행료 2배)")
	.setAlerts(["가장비싼지역 기부받고 내 랜드마크로 날려보냄!","통행료 2배 적용!"])
)

ABILITY_REGISTRY.set(
	ABILITY_NAME.TOLL_REFLECTION,
	new Ability(ABILITY_NAME.TOLL_REFLECTION)
	.on(EVENT_TYPE.TOLL_CLAIMED)
	.desc("통행료 지불 시 $c% 확률로 상대가 대신 나에게 통행료를 지불")
	.setAlerts(["상대가 대신 통행료 지불!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.LOCK_MULTIPLIER_AND_DOUBLE_ON_START_BUILD,
	new Ability(ABILITY_NAME.LOCK_MULTIPLIER_AND_DOUBLE_ON_START_BUILD)
	.on(EVENT_TYPE.BUILD_LANDMARK)
	.desc("출발지에서 랜드마크 건설 시 $c% 확률로 배수잠금 후 통행료 2배 적용")
	.setAlerts(["배수 잠금 후 통행료 2배 적용!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.FREE_BUYOUT_AND_DOUBLE,
	new Ability(ABILITY_NAME.FREE_BUYOUT_AND_DOUBLE)
	.on(EVENT_TYPE.BUYOUT_PRICE_CLAIMED)
	.desc("인수 시 $c% 확률로 인수비용 면제,인수시 통행료 2배 적용")
	.setAlerts(["인수비용 면제!","통행료 2배 적용!"])
)
ABILITY_REGISTRY.set(
	ABILITY_NAME.THROW_TO_LANDMARK_WITH_MULTIPLIER,
	new Ability(ABILITY_NAME.THROW_TO_LANDMARK_WITH_MULTIPLIER)
	.on(EVENT_TYPE.ENEMY_ARRIVE_TO_ME)
	.desc("상대가 나에게 도착하면 $c% 확률로 내 랜드마크로 날려보냄(통행료 3배)")
	.setAlerts(["내 랜드마크로 날려보냄!","통행료 3배 적용!"])
)
export { ABILITY_REGISTRY }
