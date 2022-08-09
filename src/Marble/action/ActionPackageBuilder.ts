import  { ABILITY_NAME } from "../Ability/AbilityRegistry"
import type { AbilityValues } from "../Ability/AbilityValues"
import { EVENT_TYPE } from "../Ability/EventType"
import { CARD_NAME } from "../FortuneCard"
import type { MarbleGame } from "../Game"
import type { MarblePlayer } from "../Player"
import type { BuildableTile } from "../tile/BuildableTile"
import { BUILDING } from "../tile/Tile"
import { TileFilter } from "../TileFilter"
import { chooseRandom, forwardBy, percentValueToMultiplier } from "../util"
import { Action, ACTION_TYPE, MOVETYPE } from "./Action"
import { ActionPackage } from "./ActionPackage"
import type { ActionTrace } from "./ActionTrace"
import { LinePullAction, RangePullAction, RollDiceAction } from "./DelayedAction"
import { AddMultiplierAction, ApplyPlayerEffectAction, BuyoutAction, ClaimBuyoutAction, ClaimTollAction, CreateBlackholeAction, EarnMoneyAction, LandModifierAction, PayPercentMoneyAction, PayTollAction, PrepareTravelAction, RequestMoveAction, StealMultiplierAction, TileAttackAction } from "./InstantAction"
import { AskAttackDefenceCardAction, AskBuyoutAction, AskTollDefenceCardAction, BlackholeTileSelectionAction, DiceChanceAction, MoveTileSelectionAction, QueryAction, TileSelectionAction } from "./QueryAction"


abstract class ActionPackageBuilder{

	protected game:MarbleGame
	protected trace:ActionTrace
	protected invoker:MarblePlayer
	protected offences:Map<ABILITY_NAME,AbilityValues>
	protected defender:MarblePlayer
	protected defences:Map<ABILITY_NAME,AbilityValues>
	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,invokerEvent:EVENT_TYPE){
		this.game=game
		this.trace=trace
		this.invoker=invoker
		this.offences=invoker.sampleAbility(invokerEvent,this.trace)
	}
	protected isTurnOf(turn:number){
		return this.game.thisturn===turn
	}
	protected setDefences(p:MarblePlayer,defenderEvent:EVENT_TYPE){
		this.defender=p
		this.defences=p.sampleAbility(defenderEvent,this.trace)
		return this
	}
	setDefender(p:MarblePlayer){
		return this
	}
	build():ActionPackage{
		return new ActionPackage(this.trace)
	}
}
export class TurnStartActionBuilder extends ActionPackageBuilder{

	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer){
		super(game,trace,invoker,EVENT_TYPE.TURN_START)
	}
	build(): ActionPackage {
		let pkg=super.build()

		let pendingActions = this.invoker.getPendingAction()
		if (pendingActions.length === 0) {
			
			pkg.addMain(new QueryAction(ACTION_TYPE.DICE_CHANCE, this.invoker.turn))
		} else {
			for(const p of pendingActions){
				pkg.addMain(p)
			}
		}
		return pkg
	}
}
export class ReceiveSalaryActionBuilder extends ActionPackageBuilder{
	private main:Action
	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,amt:number){
		super(game,trace,invoker,EVENT_TYPE.RECEIVE_SALARY)
		this.main=new EarnMoneyAction(invoker.turn, amt)
	}
	build(): ActionPackage {
		let pkg=super.build()
		this.salaryBonus(pkg)
		this.passMultiplier(pkg)
		return pkg.addMain(this.main)
	}
	passMultiplier(pkg:ActionPackage){
		const name=ABILITY_NAME.ADD_MULTIPLIER_ON_PASS_START
		let val=this.offences.get(name)
		if(!val) return false

		let lands=this.game.map.getTiles(this.invoker,TileFilter.MY_LAND())
		if(lands.length===0) return false

		pkg.addExecuted(name,this.invoker.turn)
		pkg.addAction(new AddMultiplierAction(this.invoker.turn,chooseRandom(lands),4),name)
		return true
	}
	salaryBonus(pkg:ActionPackage){
		const name=ABILITY_NAME.SALARY_BONUS
		let val=this.offences.get(name)
		if(!val) return false
		pkg.addExecuted(name,this.invoker.turn)
		this.main.applyMultiplier(1 + val.getValue() * 0.01)


		return true
	}
}

export class ThrowDiceActionBuilder extends ActionPackageBuilder{
	private dice:number
	private distance:number
	private is3double:boolean
	private main:Action
	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,dice:number,distance:number,is3Double:boolean){
		super(game,trace,invoker,EVENT_TYPE.THROW_DICE)
		this.dice=dice
		this.distance=distance
		this.is3double=is3Double
		this.main=new RollDiceAction(this.invoker.turn, invoker.pos, distance, is3Double)
	}
	build(): ActionPackage {
		let pkg=super.build()

		this.diceMoney(pkg)
		if (this.is3double) {
			//뜻초
			if(!this.tripleDoubleOverrider(pkg)){
				pkg.addAfter(new RequestMoveAction(this.invoker.turn, this.game.map.island, MOVETYPE.TELEPORT))
			}
		} else {
			pkg.addAfter(new RequestMoveAction(this.invoker.turn, forwardBy(this.invoker.pos, this.distance), MOVETYPE.WALK))
		}

		return pkg.addMain(this.main)
	}
	tripleDoubleOverrider(pkg:ActionPackage){
		let onThreeDoubleAbility=this.invoker.sampleAbility(EVENT_TYPE.THREE_DOUBLE,this.trace)
		const invitation=ABILITY_NAME.TRAVEL_ON_TRIPLE_DOUBLE
		let val=onThreeDoubleAbility.get(invitation)
		if(!val) return false
		pkg.addExecuted(invitation, this.invoker.turn)
		pkg.addAction(new RequestMoveAction(this.invoker.turn, this.game.map.travel, MOVETYPE.FORCE_WALK)
		, invitation)
		return true
	}
	diceMoney(pkg:ActionPackage):boolean{
		const name = ABILITY_NAME.MONEY_ON_DICE
		let val=this.offences.get(name)
		if(!val) return false
		pkg.addExecuted(name, this.invoker.turn)
		pkg.addAction(new EarnMoneyAction(this.invoker.turn,  val.getValue() * this.dice), name)
		return true
	}
}
export class ClaimTollActionBuilder extends ActionPackageBuilder{
	private tile:BuildableTile
	private toll:number
	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,tile:BuildableTile,baseToll:number){
		super(game,trace,invoker,EVENT_TYPE.CLAIM_TOLL)
		this.tile=tile
		this.toll=baseToll
	}
	setDefender(p: MarblePlayer): this {
		this.setDefences(p,EVENT_TYPE.TOLL_CLAIMED)
		return this
	}
	build(): ActionPackage {
		let main=new PayTollAction(this.defender.turn, this.invoker.turn, this.toll)
		let pkg=super.build()
		
		if(this.trace.useActionAndAbility(ACTION_TYPE.ARRIVE_TILE,ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND)) 
			main.applyMultiplier(0)

		if(main.amount===0) return pkg

		const atoll = ABILITY_NAME.ADDITIONAL_TOLL
		const angel = ABILITY_NAME.ANGEL_CARD
		const discount = ABILITY_NAME.DISCOUNT_CARD
		const free = ABILITY_NAME.FREE_TOLL
		const ignore_angel = ABILITY_NAME.IGNORE_ANGEL
		
		
		let value = this.offences.get(atoll)

		if (value != null) {
			pkg.addExecuted(atoll, this.invoker.turn)
			main.applyMultiplier(percentValueToMultiplier(value.getValue()))
		}
		


		if (this.defences.has(free)) {
			pkg.addExecuted(free, this.defender.turn)
			main.applyMultiplier(0)
		}
		else if (this.defences.has(angel)) {
			let blocked=false
			if(this.offences.has(ignore_angel) && this.tile.isLandMark()) 
				blocked=true

			pkg.addAction(
				new AskTollDefenceCardAction(this.defender.turn, CARD_NAME.ANGEL, main.amount, 0)
					.setBlockActionId(main.getId())
					.setAttacker(this.invoker.turn)
					.setIgnore(blocked,ignore_angel),
				angel
			)
		} else if (this.defences.has(discount)) {
				pkg.addAction(
					new AskTollDefenceCardAction(
						this.defender.turn,
						CARD_NAME.DISCOUNT,
						main.amount,
						main.amount * 0.5
					)
						.setBlockActionId(main.getId())
						.setAttacker(this.invoker.turn),
					discount
				)
			
		}
		return pkg.addMain(main)

	}
}

export class AttemptAttackActionBuilder extends ActionPackageBuilder{
	private main:TileAttackAction
	private attackName:string
	private tile:BuildableTile
	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,attackname:string,tile:BuildableTile){
		super(game,trace,invoker,EVENT_TYPE.DO_ATTACK)
		this.attackName=attackname
		this.tile=tile
	}
	setDefender(p: MarblePlayer): this {
		this.setDefences(p,EVENT_TYPE.BEING_ATTACKED)
		return this
	}
	setMain(main:TileAttackAction){
		this.main=main
		return this
	}
	build(): ActionPackage {
		let pkg=super.build().addMain(this.main)
		const angel = ABILITY_NAME.ANGEL_CARD
		const shield = ABILITY_NAME.SHIELD_CARD
		const defence = ABILITY_NAME.DEFEND_ATTACK
		const ignore_defence = ABILITY_NAME.IGNORE_ATTACK_DEFEND
		let ignored=this.offences.has(ignore_defence)

		if(this.defences.has(defence)){
			if(ignored){
				pkg.addBlocked(defence,this.defender.turn)
				pkg.addExecuted(ignore_defence,this.invoker.turn)
			}
			else{
				pkg.addExecuted(defence,this.defender.turn)
				pkg.blockMain()
			}
		}
		else if (this.defences.has(angel)) {
			pkg.addAction(
				new AskAttackDefenceCardAction(this.defender.turn, CARD_NAME.ANGEL, this.attackName)
					.setBlockActionId(this.main.getId())
					.setAttacker(this.invoker.turn)
					.setIgnore(ignored,ignore_defence),
				angel
			)
		} else if (this.defences.has(shield)) {
			pkg.addAction(
				new AskAttackDefenceCardAction(this.defender.turn, CARD_NAME.SHIELD, this.attackName)
					.setBlockActionId(this.main.getId())
					.setAttacker(this.invoker.turn)
					.setIgnore(ignored,ignore_defence),
				shield
			)
		}
		return pkg
	}
}
export class ClaimBuyoutActionBuilder extends ActionPackageBuilder{
	private tile:BuildableTile

	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,tile:BuildableTile){
		super(game,trace,invoker,EVENT_TYPE.CLAIM_BUYOUT_PRICE)
		this.tile=tile
	}
	setDefender(p: MarblePlayer): this {
		this.setDefences(p,EVENT_TYPE.BUYOUT_PRICE_CLAIMED)
		return this
	}
	build(): ActionPackage {
		let originalprice=this.tile.getBuyOutPrice()
		let price=originalprice * this.defender.getBuyoutDiscount()
		let pkg=super.build()

		if(price <= this.defender.money)
			pkg.addMain(new AskBuyoutAction(
				this.defender.turn,
				this.tile.position,
				price,
				originalprice
			))

		return pkg
	}
}
export class BuyoutActionBuilder extends ActionPackageBuilder{
	tile:BuildableTile
	main:Action

	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,tile:BuildableTile,price:number){
		super(game,trace,invoker,EVENT_TYPE.DO_BUYOUT)
		this.tile=tile
		this.main=new BuyoutAction(invoker.turn, tile, price)
	}
	setDefender(p: MarblePlayer): this {
		this.setDefences(p,EVENT_TYPE.BEING_BUYOUT)
		return this
	}
	build(): ActionPackage {
		return super.build().addMain(this.main)
	}
}
export class OnBuildActionBuilder extends ActionPackageBuilder{
	builds:BUILDING[]
	isAuto:boolean
	tile:BuildableTile
	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,tile:BuildableTile,builds:BUILDING[],isAuto:boolean){
		super(game,trace,invoker,builds.includes(BUILDING.LANDMARK)?EVENT_TYPE.BUILD_LANDMARK:EVENT_TYPE.BUILD)
		this.isAuto=isAuto
		this.builds=builds
		this.tile=tile
	}
	build(): ActionPackage {
		let pkg=super.build()
		let turn=this.invoker.turn
		const construction=ABILITY_NAME.GO_START_ON_THREE_HOUSE
		const line_mg=ABILITY_NAME.LINE_PULL_ON_ARRIVE_AND_BUILD_LANDMARK
		const mf=ABILITY_NAME.RANGE_PULL_ON_BUILD_LANDMARK
		const mul=ABILITY_NAME.ADD_MULTIPLIER_ON_BUILD_LANDMARK
		const blackhole=ABILITY_NAME.BLACKHOLE_ON_BUILD_LANDMARK
		let value=this.offences.get(construction)
		if(value!=null && this.tile.getNextBuild()===BUILDING.LANDMARK){
			pkg.addExecuted(construction,turn)
			pkg.addAction(new RequestMoveAction(turn, 0, MOVETYPE.FORCE_WALK), construction)
		}

		if(!this.isAuto && this.tile.isLandMark()){
			let mf_value=this.offences.get(mf)
			let lime_mg_value=this.offences.get(line_mg)
			let bh=this.offences.get(blackhole)

			if(bh!=null){
				pkg.addExecuted(blackhole,turn)
				pkg.addAction(new BlackholeTileSelectionAction(
					turn,this.game.map.getTiles(this.invoker,new TileFilter().setExclude([this.tile.position])),this.tile.position),blackhole)
			}
			if(lime_mg_value!=null){
				pkg.addExecuted(line_mg,turn)
				pkg.addAction(
					new LinePullAction(turn,this.tile.position),
					line_mg
				)
			}
			else if(mf_value!=null){
				pkg.addExecuted(mf,turn)
				pkg.addAction(
					new RangePullAction(turn,this.tile.position,4),
					mf
				)
			}
		}

		if(this.isAuto && this.trace.useActionAndAbility(ACTION_TYPE.CHOOSE_OLYMPIC_POSITION,ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL))
		{
			pkg.addExecuted(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL,turn)
			pkg.addAction(
				new RangePullAction(turn,this.tile.position,4),
				ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL
			)
		}
		let val=this.offences.get(mul)
		if(this.tile.isLandMark() && val!=null){
			pkg.addExecuted(mul,turn)
			pkg.addAction(new AddMultiplierAction(turn,this.tile.position,chooseRandom([2,4,8])),mul)
		}
		return pkg
	}

}
export class PassPlayerActionBuilder extends ActionPackageBuilder{
	oldpos:number
	newpos:number
	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,oldpos:number,newpos:number){
		super(game,trace,invoker,EVENT_TYPE.PASS_ENEMY)
		this.oldpos=oldpos
		this.newpos=newpos
	}
	setDefender(p: MarblePlayer): this {
		this.setDefences(p,EVENT_TYPE.ENEMY_PASS_ME)
		return this
	}
	build(): ActionPackage {
		const agreement = ABILITY_NAME.TAKE_MONEY_ON_PASS_ENEMY
		const inverse_agreement = ABILITY_NAME.TAKE_MONEY_ON_ENEMY_PASS_ME
		let pkg=super.build()
		let value = this.defences.get(inverse_agreement)
		if (value != null) {
			pkg.addExecuted(inverse_agreement, this.defender.turn)
			pkg.addAction(new PayPercentMoneyAction(this.invoker.turn, this.defender.turn, value.getValue()), inverse_agreement)
		}
		
		value = this.offences.get(agreement)
		if (value != null) {
			pkg.addExecuted(agreement, this.invoker.turn)
			pkg.addAction(new PayPercentMoneyAction(this.defender.turn, this.invoker.turn, value.getValue()),agreement)
		}
		return pkg
	}
}
export class MeetPlayerActionBuilder extends ActionPackageBuilder{
	private pos:number
	private movetype:MOVETYPE
	private stayed:MarblePlayer[]
	overrideArrival:boolean
	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,pos:number,movetype:MOVETYPE){
		super(game,trace,invoker,EVENT_TYPE.ARRIVE_TO_ENEMY)
		this.pos=pos
		this.movetype=movetype
		this.stayed=[]
		this.overrideArrival=false
	}
	addStayed(p:MarblePlayer){
		this.stayed.push(p)
	}
	build(): ActionPackage {
		let pkg=super.build()
		if(this.stayed.length===0) return pkg

		const perfume = ABILITY_NAME.TAKE_MONEY_ON_ARRIVE_TO_PLAYER
		const badge = ABILITY_NAME.TAKE_MONEY_ON_PLAYER_ARRIVE_TO_ME
		const guidebook=ABILITY_NAME.THROW_TO_LANDMARK_ON_ENEMY_ARRIVE_TO_ME

		for(const stayed of this.stayed){
			if(this.overrideArrival) break

			const defences=stayed.sampleAbility(EVENT_TYPE.ENEMY_ARRIVE_TO_ME,this.trace)
			

			let value = defences.get(badge)
			if (value != null && this.movetype!==MOVETYPE.TELEPORT && this.movetype!==MOVETYPE.BLACKHOLE) {
				pkg.addExecuted(badge, stayed.turn)
				pkg.addAction(new PayPercentMoneyAction(this.invoker.turn, stayed.turn, value.getValue()), badge)
			}
		
			value = this.offences.get(perfume)
			if (value != null && this.movetype!==MOVETYPE.PULL && this.movetype!==MOVETYPE.TELEPORT && this.movetype!==MOVETYPE.BLACKHOLE) {
				pkg.addExecuted(perfume, this.invoker.turn)
				pkg.addAction(new PayPercentMoneyAction(stayed.turn, this.invoker.turn, value.getValue()), perfume)
			}
			value=defences.get(guidebook)
			if(value!=null && !this.trace.hasTag("guidebook")){
				let pos=this.game.map.getMostExpensiveIn(stayed,TileFilter.MY_LANDMARK())
				if(pos >= 0){
					pkg.addExecuted(guidebook, stayed.turn)
					pkg.addAction(new RequestMoveAction(this.invoker.turn,pos,MOVETYPE.TELEPORT),guidebook)
					this.trace.addTag("guidebook")
					this.overrideArrival=true
				}
			}
		}
		
		return pkg
	}
}

export class ArriveMyLandActionBuilder extends ActionPackageBuilder{
	tile:BuildableTile
	main:Action
	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,tile:BuildableTile){
		super(game,trace,invoker,EVENT_TYPE.ARRIVE_MY_LAND)
		this.tile=tile
		this.main=this.game.getAskBuildAction(invoker.turn,tile,trace)
	}
	build(): ActionPackage {
		let pkg=super.build()
		const ring = ABILITY_NAME.MONEY_ON_MY_LAND
		const magnetic=ABILITY_NAME.RANGE_PULL_ON_ARRIVE_LANDMARK
		const line_magnetic=ABILITY_NAME.LINE_PULL_ON_ARRIVE_AND_BUILD_LANDMARK
		const monument=ABILITY_NAME.ADD_MULTIPLIER_ON_ARRIVE_MY_LAND
		const call=ABILITY_NAME.CALL_PLAYERS_ON_TRAVEL
		const blackhole=ABILITY_NAME.BLACKHOLE_ON_ARRIVE_LANDMARK
		const PULL_RANGE=4

		let value = this.offences.get(ring)
		if (value != null) {
			pkg.addExecuted(ring, this.invoker.turn)
			pkg.addAction(
				new EarnMoneyAction(this.invoker.turn, Math.floor(this.tile.getBuildPrice() * value.getValue() * 0.01)),
				ring
			)
		}
		
		let val=this.offences.get(monument)
		if(val!=null){
			pkg.addExecuted(monument,this.invoker.turn)
			pkg.addAction(new AddMultiplierAction(this.invoker.turn,this.tile.position,2),monument)
		}
		
		if(this.tile.isLandMark()){
			let mg=this.offences.get(magnetic)
			let linemg=this.offences.get(line_magnetic)
			let bosscall=this.offences.get(call)
			let bh=this.offences.get(blackhole)

			if(bh!=null){
				pkg.addExecuted(blackhole,this.invoker.turn)
				pkg.addAction(new BlackholeTileSelectionAction(
					this.invoker.turn,this.game.map.getTiles(this.invoker,new TileFilter().setExclude([this.tile.position])),this.tile.position),blackhole)
			}

			if(bosscall!=null && this.game.mediator.getPlayersAt([this.game.map.travel]).length>0){
				let targets=this.game.mediator.getPlayersAt([this.game.map.travel])
				pkg.addExecuted(call,this.invoker.turn)
				for(const p of targets){
					pkg.addAction(new RequestMoveAction(p.turn,this.invoker.pos,MOVETYPE.TELEPORT),call)
				}
			}
			else if(linemg!=null){
				pkg.addExecuted(line_magnetic,this.invoker.turn)
				pkg.addAction(
					new LinePullAction(this.invoker.turn,this.tile.position),
					line_magnetic
				)
			}
			else if(mg!=null){
				pkg.addExecuted(magnetic,this.invoker.turn)
				pkg.addAction(
					new RangePullAction(this.invoker.turn,this.tile.position,PULL_RANGE),
					magnetic
				)
			}
		}
		return pkg.addMain(this.main)
	}
}
export class ArriveEmptyLandActionBuilder extends ActionPackageBuilder{
	tile:BuildableTile
	main:Action

	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,tile:BuildableTile){
		super(game,trace,invoker,EVENT_TYPE.ARRIVE_MY_LAND)
		this.tile=tile
		this.main=this.game.getAskBuildAction(invoker.turn,tile,trace)
	}
	build(): ActionPackage {
		return super.build().addMain(this.main)
	}
}

export class CreateBlackholeActionBuilder extends ActionPackageBuilder{
	pos:number
	main:Action
	whiteholepos:number
	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,pos:number,whiteholepos:number){
		super(game,trace,invoker,EVENT_TYPE.CREATE_BLACKHOLE)
		this.pos=pos
		this.whiteholepos=whiteholepos
		this.main=new CreateBlackholeAction(this.invoker.turn,pos,whiteholepos)
	}
	build(): ActionPackage {
		let pkg= super.build().addMain(this.main)
		const blackhole_mul=ABILITY_NAME.ADD_MULTIPLIER_ON_CREATE_BLACKHOLE
		let val=this.offences.get(blackhole_mul)
		if(val!=null)
		{
			pkg.addExecuted(blackhole_mul,this.invoker.turn)
			pkg.addAction(new AddMultiplierAction(this.invoker.turn,this.whiteholepos,chooseRandom([2,4,8])),blackhole_mul)
		}
		return pkg
	}
}
export class ArriveEnemyLandActionBuilder extends ActionPackageBuilder{
	tile:BuildableTile

	constructor(game:MarbleGame,trace:ActionTrace,mover:MarblePlayer,tile:BuildableTile){
		super(game,trace,mover,EVENT_TYPE.ARRIVE_ENEMY_LAND)
		this.tile=tile
		//
	}
	/**
	 * 
	 * @param landowner 땅 주인
	 * @returns 
	 */
	setDefender(landowner: MarblePlayer): this {
		this.setDefences(landowner,EVENT_TYPE.ENEMY_ARRIVE_MY_LAND)
		return this
	}
	steal(ability:ABILITY_NAME,pkg:ActionPackage){
		let dest=this.game.map.getLandToMoveMultiplier(this.invoker)
		if(dest>-1) {
			pkg.addExecuted(ability,this.invoker.turn)
			pkg.addAction(new StealMultiplierAction(this.invoker.turn,this.tile.position,dest),ability)
		}
		return dest
	}
	build(): ActionPackage {
		let pkg= super.build()

		const healing = ABILITY_NAME.TRAVEL_ON_ENEMY_LAND
		const bhealing=ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND
		const follow_healing=ABILITY_NAME.FOLLOW_ON_ENEMY_HEALING
		const bubble=ABILITY_NAME.ROOT_ON_ENEMY_ARRIVE_MY_LANDMARK
		const blueprint=ABILITY_NAME.STEAL_MULTIPLIER
		const locker_blueprint=ABILITY_NAME.STEAL_MULTIPLIER_AND_LOCK


		//offence:도착한 플레이어능력
		//defence:땅주인 능력
		let healing_invoked=false
		let value=this.defences.get(bubble)
		if(value!=null && this.tile.isLandMark() && !this.trace.hasTag("bubble_root")){
			pkg.addExecuted(bubble,this.defender.turn)
			pkg.addAction(new ApplyPlayerEffectAction(this.invoker.turn,"bubble_root"),bubble)
		}

		if(this.tile.canStealMultiplier()){
			let bp=this.offences.get(blueprint)
			let bp_lock=this.offences.get(locker_blueprint)
			if(bp_lock!=null){
				let dest=this.steal(locker_blueprint,pkg)
				if(dest >=0)
					pkg.addAction(new LandModifierAction(this.invoker.turn,dest,"lock"),locker_blueprint)
			}
			else if(bp!=null){
				this.steal(blueprint,pkg)
			}
		}


		if (this.offences.has(bhealing)) {
			value = this.offences.get(bhealing)
			if (value != null) {
				pkg.addExecuted(bhealing, this.invoker.turn)
				pkg.addAction(new RequestMoveAction(this.invoker.turn, 24, MOVETYPE.FORCE_WALK)
				, bhealing)
				healing_invoked=true
			}
			this.trace.setAbilityName(ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND).setName("사힐링")
			
		}
		else if (this.offences.has(healing)) {
			value = this.offences.get(healing)
			if (value != null) {
				pkg.addExecuted(healing, this.invoker.turn)
				pkg.addAction(new RequestMoveAction(this.invoker.turn, 24, MOVETYPE.FORCE_WALK), healing)
				healing_invoked=true
			}
		}
		let val=this.defences.get(follow_healing)
		if(healing_invoked && val!=null){
			pkg.addExecuted(follow_healing,this.defender.turn)
			pkg.addAction(new RequestMoveAction(this.defender.turn, 24, MOVETYPE.FORCE_WALK), follow_healing)
		}

		pkg.addMain(new ClaimTollAction(this.invoker.turn,this.tile))
		if(this.tile.canBuyOut()) pkg.addMain(new ClaimBuyoutAction(this.invoker.turn, this.tile))
		return pkg
	}
}
export class MonopolyChanceActionBuilder extends ActionPackageBuilder{
	spots:number[]

	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,spots:number[]){
		super(game,trace,invoker,EVENT_TYPE.MONOPOLY_CHANCE)
		this.spots=spots
	}
	setDefender(p: MarblePlayer): this {
		this.setDefences(p,EVENT_TYPE.MONOPOLY_ALERT)
		return this
	}
	build(): ActionPackage {
		let pkg=super.build()
		const speaker=ABILITY_NAME.ONE_MORE_DICE_ON_MONOPOLY_CHANCE

		let val=this.offences.get(speaker)
		if(val!=null){
			pkg.addExecuted(speaker, this.invoker.turn)
			pkg.addAction(
					new QueryAction(ACTION_TYPE.DICE_CHANCE,this.invoker.turn),speaker
				)
		}
		return pkg
	}
}
export class ArriveTravelActionBuilder extends ActionPackageBuilder{

	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer){
		super(game,trace,invoker,EVENT_TYPE.ARRIVE_TRAVEL)
	}
	build(): ActionPackage {
		let pkg=super.build().addMain(new PrepareTravelAction(this.invoker.turn))
		const freepass=ABILITY_NAME.INSTANT_TRAVEL
		const taxi=ABILITY_NAME.ONE_MORE_DICE_AFTER_TRAVEL

		let value=this.offences.get(freepass)
		if(value!=null && this.isTurnOf(this.invoker.turn)){
			pkg.addExecuted(freepass, this.invoker.turn)
		}
		else{
			pkg.setMainToPendingAction()
		}

		value=this.offences.get(taxi)
		if(value!=null){
			pkg.addMain(new DiceChanceAction(this.invoker.turn).reserveAbilityIndicatorOnPop(taxi,this.invoker.turn))
		}
		return pkg
	}

}
export class ArriveOlympicActionBuilder extends ActionPackageBuilder{

	mylands:number[]
	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,mylands:number[]){
		super(game,trace,invoker,EVENT_TYPE.ARRIVE_OLYMPIC)
		this.mylands=mylands
	}
	build(): ActionPackage {
		let pkg=super.build().addMain(new TileSelectionAction(ACTION_TYPE.CHOOSE_OLYMPIC_POSITION, this.invoker.turn, this.mylands, "olympic"))

		let val=this.offences.get(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL)
		if(val!=null){
			pkg.addExecuted(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL,this.invoker.turn)
			pkg.trace.setAbilityName(ABILITY_NAME.OLYMPIC_LANDMARK_AND_PULL).setName('올림픽끌당')
		}
		return pkg

	}
}

export class PrepareTravelActionBuilder extends ActionPackageBuilder{

	pos:number[]
	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,pos:number[]){
		super(game,trace,invoker,EVENT_TYPE.TRAVEL_START)
		this.pos=pos
	}
	build(): ActionPackage {
		let pkg=super.build()
		.addMain(new MoveTileSelectionAction(this.invoker.turn, this.pos, "travel", MOVETYPE.WALK))
		const flag=ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL
		let val=this.offences.get(flag)
		if(val!=null)
		{
			this.trace.setAbilityName(ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL).setName("대지주의깃발")
			pkg.addExecuted(flag,this.invoker.turn)
		}
		return pkg

	}
	
}
export class PullActionBuilder extends ActionPackageBuilder{

	pos:number
	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,pos:number){
		super(game,trace,invoker,EVENT_TYPE.PULL_ENEMY)
		this.pos=pos
	}
	setDefender(p: MarblePlayer): this {
		this.setDefences(p,EVENT_TYPE.BEING_PULLED)
		return this
	}
	build(): ActionPackage {
		let pkg=super.build().addMain(new RequestMoveAction(this.defender.turn, this.pos, MOVETYPE.PULL))

		const defence = ABILITY_NAME.DEFEND_ATTACK
		let val=this.defences.get(defence)
		if(val!=null){
			pkg.addExecuted(defence,this.defender.turn)
			pkg.blockMain()
		}
		return pkg
	}
}
export class ArriveBlackholeActionBuilder extends ActionPackageBuilder{

	black:number
	white:number
	constructor(game:MarbleGame,trace:ActionTrace,invoker:MarblePlayer,black:number,white:number){
		super(game,trace,invoker,EVENT_TYPE.ARRIVE_BLACKHOLE)
		this.black=black
		this.white=white
	}
	build(): ActionPackage {
		let pkg=super.build().addMain(new RequestMoveAction(this.invoker.turn, this.white, MOVETYPE.BLACKHOLE))

		return pkg
	}
}