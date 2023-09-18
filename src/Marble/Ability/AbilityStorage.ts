import { ActionTrace } from "../action/ActionTrace";
import { sample } from "../util";
import { Ability, AbilityExecution } from "./Ability";
import { ABILITY_NAME, ABILITY_REGISTRY } from "./AbilityRegistry";
import { AbilityAttributes, AbilityValue } from "./AbilityValues";
import { EVENT_TYPE } from "./EventType";




export class AbilityStorage {
    private readonly permanentAbility:Map<EVENT_TYPE,ABILITY_NAME[]>
    private readonly temporaryAbility:Set<ABILITY_NAME>
    private readonly abilityValues:Map<ABILITY_NAME,AbilityAttributes>

    constructor(){
        this.permanentAbility=new Map<EVENT_TYPE,ABILITY_NAME[]>()
        this.temporaryAbility=new Set<ABILITY_NAME>()
        this.abilityValues=new Map<ABILITY_NAME, AbilityAttributes>()
    }
    registerPermanent(...abilities:[ABILITY_NAME,AbilityAttributes][]){

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
    }
    getAbilityForEvent(event:EVENT_TYPE,source:ActionTrace):Map<ABILITY_NAME,AbilityValue>{
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

        let validAblities=new Map<ABILITY_NAME,AbilityValue>()
        
        for(const ability of abilities){
            let ab=ABILITY_REGISTRY.get(ability)
            let value=this.abilityValues.get(ability)
            // console.log(ab)
            // console.log(value)
            if(!ab || !value || !ab.isValidSource(source)|| !value.sample()) continue
            
            validAblities.set(ability,value.abilityValue)
        }
        // console.log(validAblities)
        return validAblities
    }
    getAbilityValueAmount(ability:ABILITY_NAME):number{
        let ab=this.abilityValues.get(ability)
        if(ab!=null) return ab.getValue()

        return 0
    }
    addTemporary(ability:ABILITY_NAME,value:AbilityAttributes){
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
    upgradeAbility(){
        let list:ABILITY_NAME[]=[]
        for(const [name,value] of this.abilityValues.entries()){
            value.upgrade()
            list.push(name)
        }
        return list
    }
    getItemDescriptions(){
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
    getAbilityStringOf(ab:AbilityExecution):{name:string,desc:string}|null{
        let ability=ABILITY_REGISTRY.get(ab.name)
        let value=this.abilityValues.get(ab.name)
        if(!ability || !value) return null

        return {
            name:value.getItemKorName(),desc:ability.getAlert(ab.id)
        }
    }
    hasOneAbilities(abilities:Set<ABILITY_NAME>){
        for(const name of this.abilityValues.keys())
            if(abilities.has(name)) return true
        for(const name of this.temporaryAbility)
            if(abilities.has(name)) return true
        return false
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
    getChanceFor(ability:ABILITY_NAME){
        let value=this.abilityValues.get(ability)
        if(!value) return -1
        return value.currentChance
    }
}