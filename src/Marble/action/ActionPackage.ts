import e from "cors"
import { Ability, PayAbility } from "../Ability/Ability"
import { ABILITY_NAME, ABILITY_REGISTRY } from "../Ability/AbilityRegistry"
import type { AbilityValues } from "../Ability/AbilityValues"
import { CARD_NAME } from "../FortuneCard"
import type { MarblePlayer } from "../Player"
import type { BuildableTile } from "../tile/BuildableTile"
import { LandTile } from "../tile/LandTile"
import { BUILDING } from "../tile/Tile"
import { forwardDistance } from "../util"
import { Action, ACTION_TYPE, MOVETYPE } from "./Action"
import type { ActionTrace } from "./ActionTrace"
import { MoveAction } from "./DelayedAction"
import {
	EarnMoneyAction,
	PayMoneyAction,
	PayPercentMoneyAction,
	RequestMoveAction,
	TileAttackAction,
} from "./InstantAction"
import { AskAttackDefenceCardAction, AskBuyoutAction, AskTollDefenceCardAction, QueryAction } from "./QueryAction"

class ActionPackage {
	before: Action[]
	after: Action[]
	main: Action[]
	blocksMain: boolean
	blockedAbilities: { name: ABILITY_NAME; turn: number }[]
	executedAbilities: { name: ABILITY_NAME; turn: number }[]
	shouldPutMainToPending:boolean
	trace:ActionTrace
	private readonly thisturn:number
	constructor(thisturn:number,trace:ActionTrace) {
		this.trace=trace
		this.thisturn=thisturn
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
	isTurnOf(turn:number){
		return this.thisturn===turn
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
		if (ab.isAfterMain()) {
			this.addAfter(action)
		} else {
			this.addBefore(action)
		}
	}
	applyReceiveSalaryAbility(receiver: number, abilities: Map<ABILITY_NAME, AbilityValues>) {
		let main = this.main[0]

		if (abilities.has(ABILITY_NAME.SALARY_BONUS)) {
			let value = abilities.get(ABILITY_NAME.SALARY_BONUS)
			this.addExecuted(ABILITY_NAME.SALARY_BONUS, receiver)
			if (value != null) main.applyMultiplier(1 + value.getValue() * 0.01)
		}

		return this
	}
	applyThrowDiceAbility(
		invoker: number,
		abilities: Map<ABILITY_NAME, AbilityValues>,
		dice: number
	) {
		let main = this.main[0]
		for (const [name, value] of abilities) {
			if (name === ABILITY_NAME.MONEY_ON_DICE) {
				this.addExecuted(ABILITY_NAME.MONEY_ON_DICE, invoker)
				this.addAction(new EarnMoneyAction(invoker,  value.getValue() * dice), name)
			}
		}
		return this
	}
	/**
	 *
	 * @param invokerTurn 통행료 징수하는 플레이어
	 * @param eventSource
	 * @param offences
	 * @param defences
	 * @param payerTurn 통행료 내는 플레이어
	 * @returns
	 */
	applyClaimTollAbility(
		invokerTurn: number,
		offences: Map<ABILITY_NAME, AbilityValues>,
		defences: Map<ABILITY_NAME, AbilityValues>,
		payerTurn: number
	): ActionPackage {
		let main = this.main[0]
		if (!(main instanceof PayMoneyAction)) return this

		if (this.trace.hasTag("toll_free")) main.applyMultiplier(0)

		if(this.trace.hasActionAndAbility(ACTION_TYPE.ARRIVE_TILE,ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND)) 
			main.applyMultiplier(0)

		const atoll = ABILITY_NAME.ADDITIONAL_TOLL
		const angel = ABILITY_NAME.ANGEL_CARD
		const discount = ABILITY_NAME.DISCOUNT_CARD
		const free = ABILITY_NAME.FREE_TOLL

		

		if (offences.has(atoll)) {
			let ability = ABILITY_REGISTRY.get(atoll)
			let value = offences.get(atoll)

			if (ability != null && value != null) {
				this.addExecuted(atoll, invokerTurn)
				main.applyMultiplier(ability.percentValueToMultiplier(value.getValue()))
			}
		}


		if (offences.has(free)) {
			let ability = ABILITY_REGISTRY.get(free)

			if (ability != null) {
				this.addExecuted(free, payerTurn)
				main.applyMultiplier(0)
			}
		}
		else if (defences.has(angel)) {
			let ability = ABILITY_REGISTRY.get(angel)
			if (ability != null) {
				this.addAction(
					new AskTollDefenceCardAction(payerTurn, CARD_NAME.ANGEL, main.amount, 0)
						.setBlockActionId(main.getId())
						.setAttacker(invokerTurn),
					angel
				)
			}
		} else if (defences.has(discount)) {
			let ability = ABILITY_REGISTRY.get(discount)
			if (ability != null) {
				this.addAction(
					new AskTollDefenceCardAction(
						payerTurn,
						CARD_NAME.DISCOUNT,
						main.amount,
						main.amount * 0.5
					)
						.setBlockActionId(main.getId())
						.setAttacker(invokerTurn),
					discount
				)
			}
		}

		return this
	}
	/**
	 *
	 * @param invokerTurn 공격하는 플레이어
	 * @param eventSource
	 * @param offences
	 * @param defences
	 * @param attackName
	 * @param victim 공격당하는 플레이어
	 * @returns
	 */
	applyAttemptAttackAbility(
		invokerTurn: number,
		offences: Map<ABILITY_NAME, AbilityValues>,
		defences: Map<ABILITY_NAME, AbilityValues>,
		attackName: string,
		victim: number
	): ActionPackage {
		let main = this.main[0]
		if (!(main instanceof TileAttackAction)) return this

		const angel = ABILITY_NAME.ANGEL_CARD
		const shield = ABILITY_NAME.SHIELD_CARD
		if (defences.has(angel)) {
			let ability = ABILITY_REGISTRY.get(angel)

			if (ability != null) {
				this.addAction(
					new AskAttackDefenceCardAction(victim, CARD_NAME.ANGEL, attackName)
						.setBlockActionId(main.getId())
						.setAttacker(invokerTurn),
					angel
				)
			}
		} else if (defences.has(shield)) {
			let ability = ABILITY_REGISTRY.get(shield)
			if (ability != null) {
				this.addAction(
					new AskAttackDefenceCardAction(victim, CARD_NAME.SHIELD, attackName)
						.setBlockActionId(main.getId())
						.setAttacker(invokerTurn),
					shield
				)
			}
		}
		return this
	}

	applyAbilityClaimBuyout(
		invokerTurn: number,
		offences: Map<ABILITY_NAME, AbilityValues>,
		defences: Map<ABILITY_NAME, AbilityValues>,
		moneyLimit: number
	): ActionPackage {
		let main = this.main[0]
		if (!(main instanceof AskBuyoutAction)) return this

		if (main.price > moneyLimit) main.off()

		return this
	}
	applyAbilityBuyout(
		buyer: MarblePlayer,
		landOwner: MarblePlayer,
		offences: Map<ABILITY_NAME, AbilityValues>,
		defences: Map<ABILITY_NAME, AbilityValues>,
		tile: BuildableTile
	) {
		return this
	}
	applyAbilityOnBuild(
		invokerTurn: number,
		tile: BuildableTile,
		abilities: Map<ABILITY_NAME, AbilityValues>
	) {

		const construction=ABILITY_NAME.GO_START_ON_THREE_HOUSE
		let value=abilities.get(construction)
		let ab=ABILITY_REGISTRY.get(construction)
		if(value!=null && ab!=null && tile.getNextBuild()===BUILDING.LANDMARK){
			this.addExecuted(construction,invokerTurn)
			this.addAction(new RequestMoveAction(invokerTurn, 0, MOVETYPE.FORCE_WALK), construction)
		}

		return this
	}
	applyAbilityPassOther(
		mover: MarblePlayer,
		stayed: MarblePlayer,
		offences: Map<ABILITY_NAME, AbilityValues>,
		defences: Map<ABILITY_NAME, AbilityValues>,
		oldpos: number,
		newpos: number
	) {
		const agreement = ABILITY_NAME.TAKE_MONEY_ON_PASS_ENEMY
		const inverse_agreement = ABILITY_NAME.TAKE_MONEY_ON_ENEMY_PASS_ME
		if (defences.has(inverse_agreement)) {
			let value = defences.get(inverse_agreement)
			if (value != null) {
				this.addExecuted(inverse_agreement, stayed.turn)
				this.addAction(new PayPercentMoneyAction(mover.turn, stayed.turn, value.getValue()), inverse_agreement)
			}
		}
		if (offences.has(agreement)) {
			let value = offences.get(agreement)
			if (value != null) {
				this.addExecuted(agreement, mover.turn)
				this.addAction(new PayPercentMoneyAction(stayed.turn, mover.turn, value.getValue()),agreement)
			}
		}
		return this
	}
	applyAbilityArriveToPlayer(
		moverTurn: number,
		offences: Map<ABILITY_NAME, AbilityValues>,
		defences: Map<ABILITY_NAME, AbilityValues>,
		stayed: number
	): ActionPackage {
		const perfume = ABILITY_NAME.TAKE_MONEY_ON_ARRIVE_TO_PLAYER
		const badge = ABILITY_NAME.TAKE_MONEY_ON_PLAYER_ARRIVE_TO_ME

		if (defences.has(badge)) {
			let value = defences.get(badge)
			if (value != null) {
				this.addExecuted(badge, stayed)
				this.addAction(new PayPercentMoneyAction(moverTurn, stayed, value.getValue()), badge)
			}
		}
		if (offences.has(perfume)) {
			let value = offences.get(perfume)
			if (value != null) {
				this.addExecuted(perfume, moverTurn)
				this.addAction(new PayPercentMoneyAction(stayed, moverTurn, value.getValue()), perfume)
			}
		}

		return this
	}
	applyAbilityArriveMyLand(
		moverTurn: number,
		abilities: Map<ABILITY_NAME, AbilityValues>,
		tile: BuildableTile
	) {
		const ring = ABILITY_NAME.MONEY_ON_MY_LAND
		if (abilities.has(ring)) {
			let value = abilities.get(ring)
			if (value != null) {
				this.addExecuted(ring, moverTurn)
				this.addAction(
					new EarnMoneyAction(moverTurn, Math.floor(tile.getBuildPrice() * value.getValue() * 0.01)),
					ring
				)
			}
		}
		return this
	}
	applyAbilityArriveEmptyLand(
		moverTurn: number,
		abilities: Map<ABILITY_NAME, AbilityValues>,
		tile: BuildableTile
	) {
		return this
	}
	applyAbilityArriveEnemyLand(
		moverTurn: number,
		offences: Map<ABILITY_NAME, AbilityValues>,
		defences: Map<ABILITY_NAME, AbilityValues>,
		tile: BuildableTile
	) {
		const healing = ABILITY_NAME.TRAVEL_ON_ENEMY_LAND
		const bhealing=ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND

		
		if (defences.has(bhealing)) {
			let value = defences.get(bhealing)
			let ab=ABILITY_REGISTRY.get(bhealing)
			if (value != null && ab!=null) {
				this.addExecuted(bhealing, moverTurn)
				this.addAction(new RequestMoveAction(moverTurn, 24, MOVETYPE.FORCE_WALK), bhealing)
			}
			this.trace.setAbilityName(ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND).setName("사힐링")
		}
		else if (defences.has(healing)) {
			let value = defences.get(healing)
			let ab=ABILITY_REGISTRY.get(healing)
			if (value != null && ab!=null) {
				this.addExecuted(healing, moverTurn)
				this.addAction(new RequestMoveAction(moverTurn, 24, MOVETYPE.FORCE_WALK), healing)
			}
		}

		return this
	}
	applyAbilityMonopolyChance(
		player:MarblePlayer,offences: Map<ABILITY_NAME, AbilityValues>,defences: Map<ABILITY_NAME, AbilityValues>,spots:number[]
	){
		const speaker=ABILITY_NAME.ONE_MORE_DICE_ON_MONOPOLY_CHANCE

		let val=offences.get(speaker)
		if(val!=null){
			this.addExecuted(speaker, player.turn)
				this.addAction(
					new QueryAction(ACTION_TYPE.DICE_CHANCE,player.turn),speaker
				)
		}
		return this
	}
	applyAbilityArriveTravel(player:MarblePlayer,abilities: Map<ABILITY_NAME, AbilityValues>){

		const freepass=ABILITY_NAME.INSTANT_TRAVEL
		let value=abilities.get(freepass)
		if(value!=null && this.isTurnOf(player.turn)){
			this.addExecuted(freepass, player.turn)
		}
		else{
			this.setMainToPendingAction()
		}

		return this
	}
}

export { ActionPackage }
