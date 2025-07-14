

import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { EVENT_TYPE } from "../../Ability/EventType"
import type { MarbleGame } from "../../Game"
import type { MarblePlayer } from "../../Player"
import { MOVETYPE } from "../Action"
import type { ActionPackage } from "../ActionPackage"
import type { ActionTrace } from "../ActionTrace"
import { IndicateDefenceAction, RequestMoveAction } from "../InstantAction"
import {  DefendableActionBuilder } from "./ActionPackageBuilder"

export class PullActionBuilder extends DefendableActionBuilder {
	pos: number
	constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer, pos: number) {
		super(game, trace, invoker, EVENT_TYPE.PULL_ENEMY)
		this.pos = pos
	}
	setDefender(p: MarblePlayer): this {
		this.setDefences(p, EVENT_TYPE.BEING_PULLED)
		return this
	}
	build(): ActionPackage {
		let pkg = super.build().addMain(new RequestMoveAction(this.defender.turn, this.pos, MOVETYPE.PULL,this.game.thisturn))

		const defence = ABILITY_NAME.DEFEND_ATTACK
        const ignore=ABILITY_NAME.IGNORE_ATTACK_DEFEND
		if (this.defences.has(defence)) {
            if(this.offences.has(ignore)){
                pkg.addExecuted(ignore, this.invoker.turn)
                pkg.addBlocked(defence,this.defender.turn)
            }
            else{
                pkg.addExecuted(defence, this.defender.turn)
                // pkg.blockMain()
				pkg.replaceMain(new IndicateDefenceAction("block",this.defender.pos)) 
            }
		}
		return pkg
	}
}