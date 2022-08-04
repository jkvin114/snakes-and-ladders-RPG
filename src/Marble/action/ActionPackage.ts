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
import type { ActionSource } from "./ActionSource"
import { MoveAction } from "./DelayedAction"
import {
	EarnMoneyAction,
	PayMoneyAction,
	PayPercentMoneyAction,
	RequestMoveAction,
	TileAttackAction,
} from "./InstantAction"
import { AskAttackDefenceCardAction, AskBuyoutAction, AskTollDefenceCardAction } from "./QueryAction"

class ActionPackage {
	before: Action[]
	after: Action[]
	main: Action[]
	blocksMain: boolean
	blockedAbilities: { name: ABILITY_NAME; turn: number }[]
	executedAbilities: { name: ABILITY_NAME; turn: number }[]
	shouldPutMainToPending:boolean
	private readonly thisturn:number
	constructor(thisturn:number) {
		this.thisturn=thisturn
		this.main = []
		this.before = []
		this.after = []
		this.blockedAbilities = []
		this.executedAbilities = []
		this.blocksMain = false
		this.shouldPutMainToPending=false
	}
	setMain(...main: Action[]) {
		this.main = main
		return this
	}
	addBefore(a: Action) {
		this.before.push(a)
		return this
	}
	addAfter(a: Action) {
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
	applyReceiveSalaryAbility(receiver: number, source: ActionSource, abilities: Map<ABILITY_NAME, AbilityValues>) {
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
		source: ActionSource,
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
		eventSource: ActionSource,
		offences: Map<ABILITY_NAME, AbilityValues>,
		defences: Map<ABILITY_NAME, AbilityValues>,
		payerTurn: number
	): ActionPackage {
		let main = this.main[0]
		if (!(main instanceof PayMoneyAction)) return this

		if (eventSource.hasFlag("toll_free")) main.applyMultiplier(0)

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
					.setSource(ability.getSource())
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
					).setSource(ability.getSource())
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
		eventSource: ActionSource,
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
					.setSource(ability.getSource())
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
					.setSource(ability.getSource())
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
		eventSource: ActionSource,
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
		tile: BuildableTile,
		source: ActionSource
	) {
		return this
	}
	applyAbilityOnBuild(
		invokerTurn: number,
		tile: BuildableTile,
		abilities: Map<ABILITY_NAME, AbilityValues>,
		eventSource: ActionSource
	) {

		const construction=ABILITY_NAME.GO_START_ON_THREE_HOUSE
		let value=abilities.get(construction)
		let ab=ABILITY_REGISTRY.get(construction)
		if(value!=null && ab!=null && tile.getNextBuild()===BUILDING.LANDMARK){
			this.addExecuted(construction,invokerTurn)
			this.addAction(new RequestMoveAction(invokerTurn, 0, MOVETYPE.FORCE_WALK).setSource(ab.getSource()), construction)
		}

		return this
	}
	applyAbilityPassOther(
		mover: MarblePlayer,
		stayed: MarblePlayer,
		offences: Map<ABILITY_NAME, AbilityValues>,
		defences: Map<ABILITY_NAME, AbilityValues>,
		oldpos: number,
		newpos: number,
		source: ActionSource
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
		eventSource: ActionSource,
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
		source: ActionSource,
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
		source: ActionSource,
		abilities: Map<ABILITY_NAME, AbilityValues>,
		tile: BuildableTile
	) {
		return this
	}
	applyAbilityArriveEnemyLand(
		moverTurn: number,
		source: ActionSource,
		offences: Map<ABILITY_NAME, AbilityValues>,
		defences: Map<ABILITY_NAME, AbilityValues>,
		tile: BuildableTile
	) {
		const healing = ABILITY_NAME.TRAVEL_ON_ENEMY_LAND

		if (defences.has(healing)) {
			let value = defences.get(healing)
			let ab=ABILITY_REGISTRY.get(healing)
			if (value != null && ab!=null) {
				this.addExecuted(healing, moverTurn)
				this.addAction(new RequestMoveAction(moverTurn, 24, MOVETYPE.FORCE_WALK).setSource(ab.getSource()), healing)
			}
		}
		return this
	}
	applyAbilityMonopolyChance(
		player:MarblePlayer,offences: Map<ABILITY_NAME, AbilityValues>,defences: Map<ABILITY_NAME, AbilityValues>,spots:number[]
	){
		return this
	}
	applyAbilityArriveTravel(player:MarblePlayer,abilities: Map<ABILITY_NAME, AbilityValues>,source:ActionSource){

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
