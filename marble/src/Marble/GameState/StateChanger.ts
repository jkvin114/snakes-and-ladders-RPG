import { ACTION_TYPE, Action } from "../action/Action";
import {ErrorState, Moving, Pulling, Teleporting, ThrowingDice, TurnInitializer, WaitingBuild, WaitingBuyOut, WaitingCardObtain, WaitingDefenceCardUse, WaitingDice, WaitingGodHandSpecial, WaitingIsland, WaitingLandSwap, WaitingLoan, WaitingMoveTileSelection, WaitingTileSelection} from ".";
import { RollDiceAction, TeleportAction, MoveAction, PullAction } from "../action/DelayedAction";
import { DiceChanceAction, AskBuildAction, AskGodHandSpecialAction, AskBuyoutAction, AskLoanAction, MoveTileSelectionAction, TileSelectionAction, ObtainCardAction, LandSwapAction, AskDefenceCardAction, AskIslandAction } from "../action/QueryAction";
import type { MarbleGame } from "../Game";
import type MarbleGameCycleState from "./MarbleGameCycleState";

export default function StateChanger(action:Action|null,game:MarbleGame): MarbleGameCycleState<Action>{
    if(!action) return new ErrorState(game)
        switch(action.type){
            case ACTION_TYPE.END_TURN:
                return new TurnInitializer(game,action)
            case ACTION_TYPE.DICE_CHANCE:
            case ACTION_TYPE.DICE_CHANCE_NO_DOUBLE:
                if(action instanceof DiceChanceAction)
                    return new WaitingDice(game,action)
            case ACTION_TYPE.ROLLING_DICE:
                if(action instanceof RollDiceAction)
                    return new ThrowingDice(game,action)
                break
            case ACTION_TYPE.TELEPORT:
                if(action instanceof TeleportAction)
                    return new Teleporting(game,action)
                break
            case ACTION_TYPE.WALK_MOVE:
            case ACTION_TYPE.FORCE_WALK_MOVE:
                if(action instanceof MoveAction)
                    return new Moving(game,action)
                break
            case ACTION_TYPE.CHOOSE_BUILD:
                if(action instanceof AskBuildAction)
                   return new WaitingBuild(game,action)
                break
            case ACTION_TYPE.CHOOSE_GODHAND_SPECIAL:
                if(action instanceof AskGodHandSpecialAction)
                   return new WaitingGodHandSpecial(game,action)
                break
            case ACTION_TYPE.ASK_BUYOUT:
                if(action instanceof AskBuyoutAction)
                   return new WaitingBuyOut(game,action)
                break
            case ACTION_TYPE.ASK_LOAN:
                if(action instanceof AskLoanAction)
                   return new WaitingLoan(game,action)
                break
            case ACTION_TYPE.CHOOSE_MOVE_POSITION:
                if(action instanceof MoveTileSelectionAction)
                    return new WaitingMoveTileSelection(game,action)
                 break
            case ACTION_TYPE.CHOOSE_BUILD_POSITION:
            case ACTION_TYPE.CHOOSE_OLYMPIC_POSITION:
            case ACTION_TYPE.CHOOSE_ATTACK_POSITION:
            case ACTION_TYPE.CHOOSE_DONATE_POSITION:
            case ACTION_TYPE.CHOOSE_GODHAND_TILE_LIFT:
            case ACTION_TYPE.CHOOSE_BLACKHOLE:
            case ACTION_TYPE.CHOOSE_BUYOUT_POSITION:
                if(action instanceof TileSelectionAction)
                   return new WaitingTileSelection(game,action)
                break
            case ACTION_TYPE.OBTAIN_CARD:
                if(action instanceof ObtainCardAction)
                    return new WaitingCardObtain(game,action)
                break
            case ACTION_TYPE.CHOOSE_LAND_CHANGE:
                if(action instanceof LandSwapAction)
                    return new WaitingLandSwap(game,action)
                break
            case ACTION_TYPE.CHOOSE_ATTACK_DEFENCE_CARD_USE:
            case ACTION_TYPE.CHOOSE_TOLL_DEFENCE_CARD_USE:
                if(action instanceof AskDefenceCardAction)
                    return new WaitingDefenceCardUse(game,action)
                break
            case ACTION_TYPE.CHOOSE_ISLAND:
                if(action instanceof AskIslandAction)
                   return new WaitingIsland(game,action)
                break
            case ACTION_TYPE.PULL:
                if(action instanceof PullAction)
                    return new Pulling(game,action)
                break
        }

        console.error("no next action registered")

        return new ErrorState(game)
}