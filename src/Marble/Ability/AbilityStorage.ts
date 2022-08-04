import { ActionTrace } from "../action/ActionTrace";
import { sample } from "../util";
import { Ability } from "./Ability";
import { ABILITY_NAME, ABILITY_REGISTRY } from "./AbilityRegistry";
import { AbilityValues } from "./AbilityValues";
import { EVENT_TYPE } from "./EventType";




export class AbilityStorage {
    private readonly permanentAbility:Map<EVENT_TYPE,ABILITY_NAME[]>
    private readonly temporaryAbility:Set<ABILITY_NAME>
    private readonly abilityValues:Map<ABILITY_NAME,AbilityValues>

    constructor(){
        this.permanentAbility=new Map<EVENT_TYPE,ABILITY_NAME[]>()
        this.temporaryAbility=new Set<ABILITY_NAME>()
        this.abilityValues=new Map<ABILITY_NAME, AbilityValues>()
    }
    registerPermanent(...abilities:[ABILITY_NAME,AbilityValues][]){

        for(const ability of abilities){
            if(!ability) continue

            let ab=ABILITY_REGISTRY.get(ability[0])
            if(!ab) continue
            this.abilityValues.set(ability[0],ability[1])
            for(const event of ab.getEvents()){
                if(this.permanentAbility.has(event))
                    this.permanentAbility.get(event)?.push(ability[0])
                else{
                    this.permanentAbility.set(event,[ability[0]])
                }
            }
        }
        console.log(this.permanentAbility)
    }
    getAbilityForEvent(event:EVENT_TYPE,source:ActionTrace):Map<ABILITY_NAME,AbilityValues>{
        let abilities:ABILITY_NAME[]=[]

        if(this.permanentAbility.has(event)){
            let ab=this.permanentAbility.get(event)
            // console.log(ab)
            if(ab!=null)
            {
                abilities=abilities.concat(ab)
            }
        }

        for(const ability of this.temporaryAbility.values()){
            let abi=ABILITY_REGISTRY.get(ability)
            if(!abi) continue

            if(abi.hasEvent(event)) abilities.push(ability)
        }

        let validAblities=new Map<ABILITY_NAME,AbilityValues>()
        
        for(const ability of abilities){
            let ab=ABILITY_REGISTRY.get(ability)
            let value=this.abilityValues.get(ability)
            // console.log(ab)
            // console.log(value)
            if(!ab || !value || !ab.isValidSource(source)|| !value.sample()) continue
            
            validAblities.set(ability,value)
        }
        // console.log(validAblities)
        return validAblities
    }

    addTemporary(ability:ABILITY_NAME,value:AbilityValues){
        if(ability===ABILITY_NAME.NONE) return

        this.temporaryAbility.add(ability)
        this.abilityValues.set(ability,value)
    }
    removeTemporary(id:ABILITY_NAME){
        if(id===ABILITY_NAME.NONE) return
        this.temporaryAbility.delete(id)
        this.abilityValues.delete(id)
    }
    use(name:ABILITY_NAME){
        this.abilityValues.get(name)?.use()
    }
    getAbilityString(){
        let arr:{name:string,desc:string}[]=[]
        for(const [name,value] of this.abilityValues.entries()){
            let ability=ABILITY_REGISTRY.get(name)
            if(!ability || this.temporaryAbility.has(name)) continue

            arr.push({
                name:value.getItemKorName(),desc:value.getDescription(ability.description)
            })
        }
        return arr
    }
    getAbilityStringOf(name:ABILITY_NAME):{name:string,desc:string}|null{
        let ability=ABILITY_REGISTRY.get(name)
        let value=this.abilityValues.get(name)
        if(!ability || !value) return null

        return {
            name:value.getItemKorName(),desc:value.getDescription(ability.description)
        }
    }
    /**
     * 
     * @param ability 
     * @returns -1 if ability does not exist
     */
    getValueFor(ability:ABILITY_NAME){
        let value=this.abilityValues.get(ability)
        if(!value) return -1

        return value.getValue()
    }
}