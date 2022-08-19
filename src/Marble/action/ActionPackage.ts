import { ABILITY_NAME, ABILITY_REGISTRY } from "../Ability/AbilityRegistry"
import { Action } from "./Action"
import type { ActionTrace } from "./ActionTrace"
class ActionPackage {
	before: Action[]
	after: Action[]
	main: Action[]
	blocksMain: boolean
	blockedAbilities: { name: ABILITY_NAME; turn: number }[]
	executedAbilities: { name: ABILITY_NAME; turn: number }[]
	shouldPutMainToPending:boolean
	trace:ActionTrace
	constructor(trace:ActionTrace) {
		this.trace=trace
		this.main = []
		this.before = []
		this.after = []
		this.blockedAbilities = []
		this.executedAbilities = []
		this.blocksMain = false
		this.shouldPutMainToPending=false
	}
	addMain(main: Action) {
		main.setPrevActionTrace(this.trace)
		this.main.push(main)
		return this
	}
	addBefore(a: Action) {
		a.setPrevActionTrace(this.trace)
		this.before.push(a)
		return this
	}
	addAfter(a: Action) {
		a.setPrevActionTrace(this.trace)
		this.after.push(a)
		return this
	}
	setMainToPendingAction(){
		this.shouldPutMainToPending=true
		return this
	}
	
	addBlocked(a: ABILITY_NAME, turn: number) {
		this.blockedAbilities.push({ name: a, turn: turn })
		return this
	}
	addExecuted(a: ABILITY_NAME, abilityOwner: number) {
		this.executedAbilities.push({ name: a, turn: abilityOwner })
		return this
	}
	blockMain() {
		this.blocksMain = true
		return this
	}
	hasAfter() {
		return this.after.length !== 0
	}
	hasBefore() {
		return this.before.length !== 0
	}
	mainOnly() {
		return !this.hasAfter() && !this.hasBefore()
	}
	/**
	 * 늦게 추가하면 먼저 실행됨
	 * @param action
	 * @param ability
	 * @returns
	 */
	addAction(action: Action, ability: ABILITY_NAME) {
		let ab = ABILITY_REGISTRY.get(ability)
		if (!ab) return
		action.addAbilityToActionTrace(ability)
		if (ab.isAfterMain()) {
			this.addAfter(action)
		} else {
			this.addBefore(action)
		}
	}
	// applyAbilityTurnStart(invoker:MarblePlayer){
	// 	let pendingActions = invoker.getPendingAction()
	// 	if (pendingActions.length === 0) {
	// 		let abilities=invoker.sampleAbility(EVENT_TYPE.TURN_START,this.trace)
	// 		this.addMain(new QueryAction(ACTION_TYPE.DICE_CHANCE, invoker.turn))
	// 	} else {
	// 		for(const p of pendingActions){
	// 			this.addMain(p)
	// 		}
	// 	}
	// 	return this
	// }
	// applyReceiveSalaryAbility(receiver: number, abilities: Map<ABILITY_NAME, AbilityValues>) {
	// 	let main = this.main[0]

	// 	if (abilities.has(ABILITY_NAME.SALARY_BONUS)) {
	// 		let value = abilities.get(ABILITY_NAME.SALARY_BONUS)
	// 		this.addExecuted(ABILITY_NAME.SALARY_BONUS, receiver)
	// 		if (value != null) main.applyMultiplier(1 + value.getValue() * 0.01)
	// 	}

	// 	return this
	// }
	// applyThrowDiceAbility(
	// 	invoker: number,
	// 	abilities: Map<ABILITY_NAME, AbilityValues>,
	// 	dice: number
	// ) {
	// 	let main = this.main[0]
	// 	for (const [name, value] of abilities) {
	// 		if (name === ABILITY_NAME.MONEY_ON_DICE) {
	// 			this.addExecuted(ABILITY_NAME.MONEY_ON_DICE, invoker)
	// 			this.addAction(new EarnMoneyAction(invoker,  value.getValue() * dice), name)
	// 		}
	// 	}
	// 	return this
	// }
	// applyAfterDiceAbility(invoker: MarblePlayer,
	// 	is3double:boolean,
	// 	onThreeDoubleAbility: Map<ABILITY_NAME, AbilityValues>,
	// 	distance: number){
	// 		if (is3double) {
	// 			const invitation=ABILITY_NAME.TRAVEL_ON_TRIPLE_DOUBLE
	// 			let val=onThreeDoubleAbility.get(invitation)
	// 			//뜻초
	// 			if(val!=null){
	// 				this.addExecuted(invitation, invoker.turn)
	// 				this.addAction(new RequestMoveAction(invoker.turn, 24, MOVETYPE.FORCE_WALK)
	// 				, invitation)
	// 			}
	// 			else{
	// 				this.addAfter(new RequestMoveAction(invoker.turn, 8, MOVETYPE.TELEPORT))
	// 			}
	// 		} else {
	// 			this.addAfter(new RequestMoveAction(invoker.turn, forwardBy(invoker.pos, distance), MOVETYPE.WALK))
	// 		}
	// 	return this
	// }
	// /**
	//  *
	//  * @param invokerTurn 통행료 징수하는 플레이어
	//  * @param eventSource
	//  * @param offences
	//  * @param defences
	//  * @param payerTurn 통행료 내는 플레이어
	//  * @returns
	//  */
	// applyClaimTollAbility(
	// 	invokerTurn: number,
	// 	offences: Map<ABILITY_NAME, AbilityValues>,
	// 	defences: Map<ABILITY_NAME, AbilityValues>,
	// 	payerTurn: number,
	// 	tile:BuildableTile
	// ): ActionPackage {
	// 	let main = this.main[0]
	// 	if (!(main instanceof PayMoneyAction)) return this

	// //	if (this.trace.hasTag("toll_free")) main.applyMultiplier(0)

	// 	if(this.trace.hasActionAndAbility(ACTION_TYPE.ARRIVE_TILE,ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND)) 
	// 		main.applyMultiplier(0)

	// 	if(main.amount===0) return this

	// 	const atoll = ABILITY_NAME.ADDITIONAL_TOLL
	// 	const angel = ABILITY_NAME.ANGEL_CARD
	// 	const discount = ABILITY_NAME.DISCOUNT_CARD
	// 	const free = ABILITY_NAME.FREE_TOLL
	// 	const ignore_angel = ABILITY_NAME.IGNORE_ANGEL
		

	// 	if (offences.has(atoll)) {
	// 		let value = offences.get(atoll)

	// 		if (value != null) {
	// 			this.addExecuted(atoll, invokerTurn)
	// 			main.applyMultiplier(percentValueToMultiplier(value.getValue()))
	// 		}
	// 	}


	// 	if (offences.has(free)) {
	// 		this.addExecuted(free, payerTurn)
	// 		main.applyMultiplier(0)
	// 	}
	// 	else if (defences.has(angel)) {
	// 		let blocked=false
	// 		if(offences.has(ignore_angel) && tile.isLandMark()) 
	// 			blocked=true

	// 		this.addAction(
	// 			new AskTollDefenceCardAction(payerTurn, CARD_NAME.ANGEL, main.amount, 0)
	// 				.setBlockActionId(main.getId())
	// 				.setAttacker(invokerTurn)
	// 				.setIgnore(blocked,ignore_angel),
	// 			angel
	// 		)
	// 	} else if (defences.has(discount)) {
	// 			this.addAction(
	// 				new AskTollDefenceCardAction(
	// 					payerTurn,
	// 					CARD_NAME.DISCOUNT,
	// 					main.amount,
	// 					main.amount * 0.5
	// 				)
	// 					.setBlockActionId(main.getId())
	// 					.setAttacker(invokerTurn),
	// 				discount
	// 			)
			
	// 	}

	// 	return this
	// }
	// /**
	//  *
	//  * @param invokerTurn 공격하는 플레이어
	//  * @param eventSource
	//  * @param offences
	//  * @param defences
	//  * @param attackName
	//  * @param victim 공격당하는 플레이어
	//  * @returns
	//  */
	// applyAttemptAttackAbility(
	// 	invokerTurn: number,
	// 	offences: Map<ABILITY_NAME, AbilityValues>,
	// 	defences: Map<ABILITY_NAME, AbilityValues>,
	// 	attackName: string,
	// 	victim: number
	// ): ActionPackage {
	// 	let main = this.main[0]
	// 	if (!(main instanceof TileAttackAction)) return this

	// 	const angel = ABILITY_NAME.ANGEL_CARD
	// 	const shield = ABILITY_NAME.SHIELD_CARD
	// 	const defence = ABILITY_NAME.DEFEND_ATTACK
	// 	const ignore_defence = ABILITY_NAME.IGNORE_ATTACK_DEFEND
	// 	let ignored=offences.has(ignore_defence)

	// 	if(defences.has(defence)){
	// 		if(ignored){
	// 			this.addBlocked(defence,victim)
	// 			this.addExecuted(ignore_defence,invokerTurn)
	// 		}
	// 		else{
	// 			this.addExecuted(defence,victim)
	// 			this.blockMain()
	// 		}
	// 	}
	// 	else if (defences.has(angel)) {
	// 		this.addAction(
	// 			new AskAttackDefenceCardAction(victim, CARD_NAME.ANGEL, attackName)
	// 				.setBlockActionId(main.getId())
	// 				.setAttacker(invokerTurn)
	// 				.setIgnore(ignored,ignore_defence),
	// 			angel
	// 		)
	// 	} else if (defences.has(shield)) {
	// 		this.addAction(
	// 			new AskAttackDefenceCardAction(victim, CARD_NAME.SHIELD, attackName)
	// 				.setBlockActionId(main.getId())
	// 				.setAttacker(invokerTurn)
	// 				.setIgnore(ignored,ignore_defence),
	// 			shield
	// 		)
	// 	}
	// 	return this
	// }

	// applyAbilityClaimBuyout(
	// 	invokerTurn: number,
	// 	offences: Map<ABILITY_NAME, AbilityValues>,
	// 	defences: Map<ABILITY_NAME, AbilityValues>,
	// 	moneyLimit: number
	// ): ActionPackage {
	// 	let main = this.main[0]
	// 	if (!(main instanceof AskBuyoutAction)) return this

	// 	if (main.price > moneyLimit) main.off()

	// 	return this
	// }
	// applyAbilityBuyout(
	// 	buyer: MarblePlayer,
	// 	landOwner: MarblePlayer,
	// 	offences: Map<ABILITY_NAME, AbilityValues>,
	// 	defences: Map<ABILITY_NAME, AbilityValues>,
	// 	tile: BuildableTile
	// ) {
	// 	return this
	// }
	// applyAbilityOnBuild(
	// 	invokerTurn: number,
	// 	tile: BuildableTile,
	// 	abilities: Map<ABILITY_NAME, AbilityValues>,
	// 	isAuto:boolean
	// ) {

	// 	const construction=ABILITY_NAME.GO_START_ON_THREE_HOUSE
	// 	const line_mg=ABILITY_NAME.LINE_PULL_ON_ARRIVE_AND_BUILD_LANDMARK
	// 	const mf=ABILITY_NAME.RANGE_PULL_ON_BUILD_LANDMARK
	// 	const mul=ABILITY_NAME.ADD_MULTIPLIER_ON_BUILD_LANDMARK
	// 	let value=abilities.get(construction)
	// 	if(value!=null && tile.getNextBuild()===BUILDING.LANDMARK){
	// 		this.addExecuted(construction,invokerTurn)
	// 		this.addAction(new RequestMoveAction(invokerTurn, 0, MOVETYPE.FORCE_WALK), construction)
	// 	}

	// 	if(!isAuto && tile.isLandMark()){
	// 		let mf_value=abilities.get(mf)
	// 		let lime_mg_value=abilities.get(line_mg)

	// 		if(lime_mg_value!=null){
	// 			this.addExecuted(line_mg,invokerTurn)
	// 			this.addAction(
	// 				new LinePullAction(invokerTurn,tile.position),
	// 				line_mg
	// 			)
	// 		}
	// 		else if(mf_value!=null){
	// 			this.addExecuted(mf,invokerTurn)
	// 			this.addAction(
	// 				new RangePullAction(invokerTurn,tile.position,4),
	// 				mf
	// 			)
	// 		}
	// 	}

	// 	if(isAuto && this.trace.hasActionAndAbility(ACTION_TYPE.ARRIVE_TILE,ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL))
	// 	{
	// 		this.addExecuted(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL,invokerTurn)
	// 		this.addAction(
	// 			new RangePullAction(invokerTurn,tile.position,4),
	// 			ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL
	// 		)
	// 	}
	// 	let val=abilities.get(mul)
	// 	if(tile.isLandMark() && val!=null){
	// 		this.addExecuted(mul,invokerTurn)
	// 		this.addAction(new AddMultiplierAction(invokerTurn,tile.position,chooseRandom([2,4,8])),mul)
	// 	}
	// 	return this
	// }
	// applyAbilityPassOther(
	// 	mover: MarblePlayer,
	// 	stayed: MarblePlayer,
	// 	offences: Map<ABILITY_NAME, AbilityValues>,
	// 	defences: Map<ABILITY_NAME, AbilityValues>,
	// 	oldpos: number,
	// 	newpos: number
	// ) {
	// 	const agreement = ABILITY_NAME.TAKE_MONEY_ON_PASS_ENEMY
	// 	const inverse_agreement = ABILITY_NAME.TAKE_MONEY_ON_ENEMY_PASS_ME
	// 	if (defences.has(inverse_agreement)) {
	// 		let value = defences.get(inverse_agreement)
	// 		if (value != null) {
	// 			this.addExecuted(inverse_agreement, stayed.turn)
	// 			this.addAction(new PayPercentMoneyAction(mover.turn, stayed.turn, value.getValue()), inverse_agreement)
	// 		}
	// 	}
	// 	if (offences.has(agreement)) {
	// 		let value = offences.get(agreement)
	// 		if (value != null) {
	// 			this.addExecuted(agreement, mover.turn)
	// 			this.addAction(new PayPercentMoneyAction(stayed.turn, mover.turn, value.getValue()),agreement)
	// 		}
	// 	}
	// 	return this
	// }
	// applyAbilityArriveToPlayer(
	// 	moverTurn: number,
	// 	offences: Map<ABILITY_NAME, AbilityValues>,
	// 	defences: Map<ABILITY_NAME, AbilityValues>,
	// 	stayed: number,
	// 	movetype:MOVETYPE
	// ): ActionPackage {
	// 	const perfume = ABILITY_NAME.TAKE_MONEY_ON_ARRIVE_TO_PLAYER
	// 	const badge = ABILITY_NAME.TAKE_MONEY_ON_PLAYER_ARRIVE_TO_ME

	// 	if (defences.has(badge) && movetype!==MOVETYPE.TELEPORT) {
	// 		let value = defences.get(badge)
	// 		if (value != null) {
	// 			this.addExecuted(badge, stayed)
	// 			this.addAction(new PayPercentMoneyAction(moverTurn, stayed, value.getValue()), badge)
	// 		}
	// 	}
	// 	if (offences.has(perfume) && movetype!==MOVETYPE.PULL && movetype!==MOVETYPE.TELEPORT) {
	// 		let value = offences.get(perfume)
	// 		if (value != null) {
	// 			this.addExecuted(perfume, moverTurn)
	// 			this.addAction(new PayPercentMoneyAction(stayed, moverTurn, value.getValue()), perfume)
	// 		}
	// 	}

	// 	return this
	// }
	// applyAbilityArriveMyLand(
	// 	moverTurn: number,
	// 	abilities: Map<ABILITY_NAME, AbilityValues>,
	// 	tile: BuildableTile
	// ) {
	// 	const ring = ABILITY_NAME.MONEY_ON_MY_LAND
	// 	const magnetic=ABILITY_NAME.RANGE_PULL_ON_ARRIVE_LANDMARK
	// 	const line_magnetic=ABILITY_NAME.LINE_PULL_ON_ARRIVE_AND_BUILD_LANDMARK
	// 	const monument=ABILITY_NAME.ADD_MULTIPLIER_ON_ARRIVE_MY_LAND
	// 	const PULL_RANGE=4
	// 	if (abilities.has(ring)) {
	// 		let value = abilities.get(ring)
	// 		if (value != null) {
	// 			this.addExecuted(ring, moverTurn)
	// 			this.addAction(
	// 				new EarnMoneyAction(moverTurn, Math.floor(tile.getBuildPrice() * value.getValue() * 0.01)),
	// 				ring
	// 			)
	// 		}
	// 	}
	// 	let val=abilities.get(monument)
	// 	if(val!=null){
	// 		this.addExecuted(monument,moverTurn)
	// 		this.addAction(new AddMultiplierAction(moverTurn,tile.position,2),monument)
	// 	}
		
	// 	if(tile.isLandMark()){
	// 		let mg=abilities.get(magnetic)
	// 		let linemg=abilities.get(line_magnetic)
	// 		if(linemg!=null){
	// 			this.addExecuted(line_magnetic,moverTurn)
	// 			this.addAction(
	// 				new LinePullAction(moverTurn,tile.position),
	// 				line_magnetic
	// 			)
	// 		}
	// 		else if(mg!=null){
	// 			this.addExecuted(magnetic,moverTurn)
	// 			this.addAction(
	// 				new RangePullAction(moverTurn,tile.position,PULL_RANGE),
	// 				magnetic
	// 			)
	// 		}
	// 	}

	// 	return this
	// }
	// applyAbilityPull(invoker:MarblePlayer,victim:MarblePlayer){
	// 	let defences=victim.sampleAbility(EVENT_TYPE.BEING_PULLED,this.trace)
	// 	let offences=invoker.sampleAbility(EVENT_TYPE.PULL_ENEMY,this.trace)

	// 	const defence = ABILITY_NAME.DEFEND_ATTACK
	// 	let val=defences.get(defence)
	// 	if(val!=null){
	// 		this.addExecuted(defence,victim.turn)
	// 		this.blockMain()
	// 	}

	// 	return this
	// }
	// applyAbilityArriveEmptyLand(
	// 	moverTurn: number,
	// 	abilities: Map<ABILITY_NAME, AbilityValues>,
	// 	tile: BuildableTile
	// ) {
	// 	return this
	// }
	// applyAbilityArriveEnemyLand(
	// 	moverTurn: number,
	// 	offences: Map<ABILITY_NAME, AbilityValues>,
	// 	defences: Map<ABILITY_NAME, AbilityValues>,
	// 	tile: BuildableTile
	// ) {
	// 	const healing = ABILITY_NAME.TRAVEL_ON_ENEMY_LAND
	// 	const bhealing=ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND
	// 	const follow_healing=ABILITY_NAME.FOLLOW_ON_ENEMY_HEALING
	// 	let healing_invoked=false
		
	// 	if (defences.has(bhealing)) {
	// 		let value = defences.get(bhealing)
	// 		if (value != null) {
	// 			this.addExecuted(bhealing, moverTurn)
	// 			this.addAction(new RequestMoveAction(moverTurn, 24, MOVETYPE.FORCE_WALK)
	// 			, bhealing)
	// 			healing_invoked=true
	// 		}
	// 		this.trace.setAbilityName(ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND).setName("사힐링")
			
	// 	}
	// 	else if (defences.has(healing)) {
	// 		let value = defences.get(healing)
	// 		if (value != null) {
	// 			this.addExecuted(healing, moverTurn)
	// 			this.addAction(new RequestMoveAction(moverTurn, 24, MOVETYPE.FORCE_WALK), healing)
	// 			healing_invoked=true
	// 		}
	// 	}
	// 	let val=offences.get(follow_healing)
	// 	if(healing_invoked && val!=null){
	// 		this.addExecuted(follow_healing,tile.owner)
	// 		this.addAction(new RequestMoveAction(tile.owner, 24, MOVETYPE.FORCE_WALK), follow_healing)
	// 	}
	// 	return this
	// }
	// applyAbilityMonopolyChance(
	// 	player:MarblePlayer,offences: Map<ABILITY_NAME, AbilityValues>,defences: Map<ABILITY_NAME, AbilityValues>,spots:number[]
	// ){
	// 	const speaker=ABILITY_NAME.ONE_MORE_DICE_ON_MONOPOLY_CHANCE

	// 	let val=offences.get(speaker)
	// 	if(val!=null){
	// 		this.addExecuted(speaker, player.turn)
	// 			this.addAction(
	// 				new QueryAction(ACTION_TYPE.DICE_CHANCE,player.turn),speaker
	// 			)
	// 	}
	// 	return this
	// }
	// applyAbilityArriveTravel(player:MarblePlayer,abilities: Map<ABILITY_NAME, AbilityValues>){

	// 	const freepass=ABILITY_NAME.INSTANT_TRAVEL
	// 	const taxi=ABILITY_NAME.ONE_MORE_DICE_AFTER_TRAVEL

	// 	let value=abilities.get(freepass)
	// 	if(value!=null ){
	// 		this.addExecuted(freepass, player.turn)
	// 	}
	// 	else{
	// 		this.setMainToPendingAction()
	// 	}

	// 	value=abilities.get(taxi)
	// 	if(value!=null){
	// 		this.addMain(new DiceChanceAction(player.turn).reserveAbilityIndicatorOnPop(taxi,player.turn))
	// 	}

	// 	return this
	// }
	// applyAbilityarriveOlympic(player:MarblePlayer){
	// 	let val=player.sampleAbility(EVENT_TYPE.ARRIVE_OLYMPIC,this.trace)
	// 	.get(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL)
	// 	if(val!=null){
	// 		this.addExecuted(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL,player.turn)
	// 		this.trace.setAbilityName(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL).setName('올림픽끌당')
	// 	}
	// 	return this
	// }

	// applyAbilityPrepareTravel(player:MarblePlayer){
	// 	let abilities=player.sampleAbility(EVENT_TYPE.TRAVEL_START,this.trace)
	// 	const flag=ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL
	// 	let val=abilities.get(flag)
	// 	if(val!=null)
	// 	{
	// 		this.trace.setAbilityName(ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL).setName("대지주의깃발")
	// 		this.addExecuted(flag,player.turn)
	// 	}
	// 	return this
	// }
}

export { ActionPackage }
