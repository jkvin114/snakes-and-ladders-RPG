import { ABILITY_NAME } from "../../Ability/AbilityRegistry";
import { EVENT_TYPE } from "../../Ability/EventType";
import type { MarbleGame } from "../../Game";
import type { MarblePlayer } from "../../Player";
import { ACTION_TYPE, MOVETYPE } from "../Action";
import { ActionPackage } from "../ActionPackage";
import { ActionTrace, ActionTraceTag } from "../ActionTrace";
import { PrepareTravelAction } from "../InstantAction";
import {  DiceChanceAction, TileSelectionAction } from "../QueryAction";
import { ActionPackageBuilder } from "./ActionPackageBuilder";

export class PassTravelActionBuilder extends ActionPackageBuilder{
    constructor(game: MarbleGame, trace: ActionTrace, invoker: MarblePlayer) {
		super(game, trace, invoker, EVENT_TYPE.PASS_TRAVEL)
	}
    build(): ActionPackage {
        let pkg = super.build()
        const sophie=ABILITY_NAME.TRAVEL_ON_PASS_TRAVEL_AND_DICE_CHANCE
        if(this.offences.has(sophie))
        {
            // this.trace.addTag(ActionTraceTag.SOPHIE_TRAVEL).setName("소피")
            pkg.addExecuted(sophie,this.invoker.turn)
            pkg.addAction(new PrepareTravelAction(this.invoker.turn),sophie)
        }
        return pkg
    }
}