import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import { ServerEventModel } from "../../../Model/ServerEventModel"
import type { MarblePlayer } from "../../Player"
import { ISLAND_POS } from "../../mapconfig"
import { TileFilter } from "../../tile/TileFilter"
import { forwardBy } from "../../util"
import { MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { RollDiceAction } from "../DelayedAction"
import { EarnMoneyAction, RequestMoveAction } from "../InstantAction"
import { MoveTileSelectionAction } from "../QueryAction"
import { ActionPackageBuilder } from "./ActionPackageBuilder"

export class ThrowDiceActionBuilder extends ActionPackageBuilder {
	private data: ServerEventModel.ThrowDiceData
	private distance: number
	private is3double: boolean
	private main: RollDiceAction
	private totaldice: number
	constructor(
		game: MarbleGame,
		trace: ActionTrace,
		invoker: MarblePlayer,
		data: ServerEventModel.ThrowDiceData,
		distance: number,
		is3Double: boolean
	) {
		super(game, trace, invoker, EVENT_TYPE.THROW_DICE)
		this.data = data
		this.distance = distance
		this.is3double = is3Double
		this.main = new RollDiceAction(this.invoker.turn, data)
		this.totaldice = this.data.dice[0] + this.data.dice[1]
	}
	build(): ActionPackage {
		let pkg = super.build()

		this.diceMoney(pkg)
		if (this.is3double) {
			//뜻초
			if (!this.tripleDoubleOverrider(pkg)) {
				pkg.addAfter(new RequestMoveAction(this.invoker.turn, ISLAND_POS, MOVETYPE.TELEPORT,this.game.thisturn))
			}
		} else {
			if(!this.diceOverrider(pkg)){
				pkg.addAfter(new RequestMoveAction(this.invoker.turn, forwardBy(this.invoker.pos, this.distance), MOVETYPE.WALK,this.game.thisturn))
			}
		}
		return pkg.addMain(this.main)
	}
	private diceOverrider(pkg:ActionPackage){
		const levataine=ABILITY_NAME.MOVE_IN_DICE_RANGE_AFTER_DICE
		if(this.offences.has(levataine)){
			let range:number[]=[]
			for(let i=1;i<=this.totaldice;++i){
				range.push(forwardBy(this.invoker.pos,i))
			}
			// pkg.addExecuted(levataine,this.invoker.turn)
			pkg.addAction(new MoveTileSelectionAction(this.invoker.turn,range,MOVETYPE.TELEPORT)
			.reserveAbilityIndicatorOnPop(levataine,this.invoker.turn),levataine)
			return true
		}
		return false
	}
	private tripleDoubleOverrider(pkg: ActionPackage) {
		let onThreeDoubleAbility = this.invoker.sampleAbility(EVENT_TYPE.THREE_DOUBLE, this.trace)
		const invitation = ABILITY_NAME.TRAVEL_ON_TRIPLE_DOUBLE
		const teleport = ABILITY_NAME.LINE_MOVE_ON_TRIPLE_DOUBLE

		if (onThreeDoubleAbility.has(teleport)) {
			pkg.addExecuted(teleport, this.invoker.turn)
			pkg.addAction(
				new MoveTileSelectionAction(
					this.invoker.turn,
					this.game.map.getTiles(this.invoker, TileFilter.ALL_EXCLUDE_MY_POS().setSameLineOnly()),
					MOVETYPE.TELEPORT
				),
				teleport
			)	
            return true

		} else if (onThreeDoubleAbility.has(invitation)) {
			pkg.addExecuted(invitation, this.invoker.turn)
			pkg.addAction(new RequestMoveAction(this.invoker.turn, this.game.map.travel, MOVETYPE.FORCE_WALK,this.game.thisturn), invitation)
            return true
		}
        return false
	}
	private diceMoney(pkg: ActionPackage): boolean {
		const name = ABILITY_NAME.MONEY_ON_DICE
		let val = this.offences.get(name)
		if (!val) return false
		pkg.addExecuted(name, this.invoker.turn)
		pkg.addAction(new EarnMoneyAction(this.invoker.turn, val.value * this.totaldice), name)
		return true
	}
}
