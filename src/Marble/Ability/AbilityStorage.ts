import { Ability } from "./Ability";
import { ABILITY_NAME, ABILITY_REGISTRY } from "./AbilityRegistry";
import { EVENT_TYPE } from "./EventType";

export class AbilityStorage {
    private readonly permanentAbility:Map<EVENT_TYPE,ABILITY_NAME[]>
    private readonly temporaryAbility:Set<ABILITY_NAME>
    constructor(){
        this.permanentAbility=new Map<EVENT_TYPE,ABILITY_NAME[]>()
        this.temporaryAbility=new Set<ABILITY_NAME>()
    }
    registerPermanent(...abilities:ABILITY_NAME[]){
        for(const ability of abilities){
            let ab=ABILITY_REGISTRY.get(ability)
            if(!ab) continue

            for(const event of ab.getEvents()){
                if(this.permanentAbility.has(event))
                    this.permanentAbility.get(event)?.push(ability)
                else{
                    this.permanentAbility.set(event,[ability])
                }
            }
        }
    }
    getAbilityForEvent(event:EVENT_TYPE):Set<ABILITY_NAME>{
        let abilities:ABILITY_NAME[]=[]
        if(this.permanentAbility.has(event)){
            let actions=this.permanentAbility.get(event)
            if(actions!=null)
            {
                abilities.concat(actions)
            }
        }
        for(const ability of this.temporaryAbility.values()){
            let abi=ABILITY_REGISTRY.get(ability)
            if(!abi) continue

            if(abi.hasEvent(event)) abilities.push(ability)
        }

        let validAblities=new Set<ABILITY_NAME>()
        for(const ability of abilities){
            let ab=ABILITY_REGISTRY.get(ability)
            if(!ab || !ab.sample()) continue
            
            validAblities.add(ability)
        }
        return validAblities
    }

    addTemporary(ability:ABILITY_NAME){
        this.temporaryAbility.add(ability)
    }
    removeTemporary(id:ABILITY_NAME){
        this.temporaryAbility.delete(id)
    }
}