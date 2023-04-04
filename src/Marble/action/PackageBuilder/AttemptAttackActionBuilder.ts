
import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import { CARD_NAME } from "../../FortuneCard"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import type { BuildableTile } from "../../tile/BuildableTile"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import {    IndicateDefenceAction, TileAttackAction } from "../InstantAction"
import { AskAttackDefenceCardAction } from "../QueryAction"
import { ActionPackageBuilder, DefendableActionBuilder } from "./ActionPackageBuilder"


export class AttemptAttackActionBuilder extends DefendableActionBuilder {
	private main: TileAttackAction
	private attackName: string
	private tile: BuildableTile
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, attackname: string, tile: BuildableTile) {
		super(game, trace, invoker, EVENT_TYPE.DO_ATTACK)
		this.attackName = attackname
		this.tile = tile
	}
	setDefender(p: MarblePlayer): this {
		this.setDefences(p, EVENT_TYPE.BEING_ATTACKED)
		return this
	}
	setMain(main: TileAttackAction) {
		this.main = main
		return this
	}
	build(): ActionPackage {
		let pkg = super.build().addMain(this.main)
		const angel = ABILITY_NAME.ANGEL_CARD
		const shield = ABILITY_NAME.SHIELD_CARD
		const defence = ABILITY_NAME.DEFEND_ATTACK
		const ignore_defence = ABILITY_NAME.IGNORE_ATTACK_DEFEND
		let ignored = this.offences.has(ignore_defence)

		if (this.defences.has(defence)) {
			if (ignored) {
				pkg.addBlocked(defence, this.defender.turn)
				pkg.addExecuted(ignore_defence, this.invoker.turn)
			} else {
				pkg.addExecuted(defence, this.defender.turn)
				// pkg.blockMain()
				pkg.replaceMain(new IndicateDefenceAction("block",this.tile.position)) 
			}
		} else if (this.defences.has(angel)) {
			pkg.addAction(
				new AskAttackDefenceCardAction(this.defender.turn, CARD_NAME.ANGEL, this.attackName,this.tile.position)
					.setBlockActionId(this.main.getId())
					.setAttacker(this.invoker.turn)
					.setIgnore(ignored, ignore_defence),
				angel
			)
		} else if (this.defences.has(shield)) {
			pkg.addAction(
				new AskAttackDefenceCardAction(this.defender.turn, CARD_NAME.SHIELD, this.attackName,this.tile.position)
					.setBlockActionId(this.main.getId())
					.setAttacker(this.invoker.turn)
					.setIgnore(ignored, ignore_defence),
				shield
			)
		}
		return pkg
	}
}