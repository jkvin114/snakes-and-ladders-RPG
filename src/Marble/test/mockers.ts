import { BaseProtoPlayer } from "../../Room/BaseProtoPlayer";
import { ABILITY_NAME } from "../Ability/AbilityRegistry";
import { AbilityValue } from "../Ability/AbilityValues";
import { MarbleGame } from "../Game";
import { PlayerType } from "../util";

export function mockGame():MarbleGame{
    let players:BaseProtoPlayer[]=[
        {
            type:PlayerType.AI,name:"",team:true,champ:0,ready:true,userClass:0
        },{
            type:PlayerType.AI,name:"",team:true,champ:1,ready:true,userClass:0
        },
        {
            type:PlayerType.AI,name:"",team:true,champ:2,ready:true,userClass:0
        }
    ]



    let game=new MarbleGame(players,"",false,0)

    game.setTurns();
    game.thisturn=0
    return game
}  

export function mockAbilityListNoValue(abilities:ABILITY_NAME[],values?:number[])
{
    let ab=new Map<ABILITY_NAME,AbilityValue>()
    for(const [i,a] of abilities.entries()){
        ab.set(a,{value:0})
    }
    return ab
}

export function mockAbilityList(abilities:ABILITY_NAME[],values:number[])
{
    let ab=new Map<ABILITY_NAME,AbilityValue>()
    for(const [i,a] of abilities.entries()){
        ab.set(a,{value:values[i]})
    }
    return ab
}
