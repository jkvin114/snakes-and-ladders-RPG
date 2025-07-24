import { ABILITY_NAME } from "./Ability/AbilityRegistry"
import { chooseRandom, chooseWeightedRandom } from "./util"

export enum CARD_TYPE{
    ATTACK,DEFENCE,COMMAND
}
export enum CARD_NAME{
    SHIELD="shield",
    DISCOUNT="discount",
    ANGEL="angel",

    GO_START="go_start",
    OLYMPIC="olympic",
    GO_OLYMPIC="go_olympic",
    GO_SPECIAL="go_special",
    GO_TRAVEL="go_travel",
    DONATE_LAND="donate_land",
    GO_ISLAND="go_island",

    SELLOFF="selloff",
    LAND_CHANGE="land_change",
    EARTHQUAKE="earthquake",
    PANDEMIC="pandemic",
    BLACKOUT="blackout",
    PAINT = "paint"
}
export abstract class FortuneCard{
    readonly name:string
    readonly type:number  //종류: 공격,방어,명령
    readonly level:number //등급: 똥,은,금
    constructor(name:string,type:number,level:number){
        this.name=name
        this.type=type
        this.level=level

    }

}
//지진,전염병,정전,강제매각,도시체인지
export class AttackCard extends FortuneCard{
    constructor(name:string,level:number){
        super(name,CARD_TYPE.ATTACK,level)
    }

}

//출발지이동,올림픽개최,올림픽이동,세계여행이동,특수지역이동,도시기부
export class CommandCard extends FortuneCard
{
    constructor(name:string,level:number){
        super(name,CARD_TYPE.COMMAND,level)
    }
}
//방어,할인,천사
export class DefenceCard extends FortuneCard{
    constructor(name:string,level:number){
        super(name,CARD_TYPE.DEFENCE,level)
    }
    toAbility(){
        if(this.name===CARD_NAME.ANGEL) {
            return ABILITY_NAME.ANGEL_CARD
        }
            
        if(this.name===CARD_NAME.DISCOUNT) 
        return ABILITY_NAME.DISCOUNT_CARD

        if(this.name===CARD_NAME.SHIELD)
        return ABILITY_NAME.SHIELD_CARD

        return ABILITY_NAME.NONE
    }
}
export namespace FortuneCardRegistry{
    const SHIELD=new DefenceCard(CARD_NAME.SHIELD,1)
    const DISCOUNT=new DefenceCard(CARD_NAME.DISCOUNT,2)
    const ANGEL=new DefenceCard(CARD_NAME.ANGEL,2)

    const GO_START=new CommandCard(CARD_NAME.GO_START,1)
    const OLYMPIC=new CommandCard(CARD_NAME.OLYMPIC,1)
    const GO_OLYMPIC=new CommandCard(CARD_NAME.GO_OLYMPIC,0)
    const GO_SPECIAL=new CommandCard(CARD_NAME.GO_SPECIAL,1)
    const GO_TRAVEL=new CommandCard(CARD_NAME.GO_TRAVEL,2)
    const GO_ISLAND=new CommandCard(CARD_NAME.GO_ISLAND,0)
    const DONATE_LAND=new CommandCard(CARD_NAME.DONATE_LAND,0)

    const SELLOFF=new AttackCard(CARD_NAME.SELLOFF,2)
    const LAND_CHANGE=new AttackCard(CARD_NAME.LAND_CHANGE,2)
    const EARTHQUAKE=new AttackCard(CARD_NAME.EARTHQUAKE,1)
    const PANDEMIC=new AttackCard(CARD_NAME.PANDEMIC,1)
    const BLACKOUT=new AttackCard(CARD_NAME.BLACKOUT,1)
    const PAINT=new AttackCard(CARD_NAME.PAINT,2)

    export const LIST:FortuneCard[]=[
        SHIELD,DISCOUNT,ANGEL,GO_OLYMPIC,GO_SPECIAL,GO_ISLAND,
        GO_START,GO_TRAVEL,OLYMPIC,DONATE_LAND,SELLOFF,
        LAND_CHANGE,EARTHQUAKE,PANDEMIC,BLACKOUT,PAINT
    ]
    export function drawAmong(list:CARD_NAME[]){
        return chooseRandom(LIST.filter((card)=>list.includes(card.name as CARD_NAME)))
    }
    export function draw(goldCardChance:number,ability:ABILITY_NAME){


        if(ability===ABILITY_NAME.GET_TRAVEL_ON_DRAW_CARD) return GO_TRAVEL


        let weights=LIST.map((card)=>{
            if(card.level===2) return 1 + goldCardChance
            else return 1
        })
        // console.log(weights)
      return LIST[chooseWeightedRandom(weights)] 
       // return chooseRandom([EARTHQUAKE])
    }
}

