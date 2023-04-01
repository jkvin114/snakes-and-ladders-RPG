import { ABILITY_NAME } from "../Ability/AbilityRegistry"
import { AbilityStorage } from "../Ability/AbilityStorage"
import { AbilityAttributes } from "../Ability/AbilityValues"

describe("abilitystorage", () => {
    let storage=new AbilityStorage()
    let list:[ABILITY_NAME, AbilityAttributes][]=[]
    list.push([ABILITY_NAME.ADDITIONAL_TOLL,new AbilityAttributes().setValue(20)])
    list.push([ABILITY_NAME.ADDITIONAL_TOLL,new AbilityAttributes().setValue(40)])

    storage.registerPermanent(...list)
    test('overwrite value',()=>expect(storage.getValueFor(ABILITY_NAME.ADDITIONAL_TOLL)).toBe(40));
    list=[]
    list.push([ABILITY_NAME.DICE_CONTROL_ACCURACY,new AbilityAttributes().setChance(20)])
    list.push([ABILITY_NAME.DICE_CONTROL_ACCURACY,new AbilityAttributes().setChance(40)])
    storage.registerPermanent(...list)
    test('overwrite chance',()=>expect(storage.getChanceFor(ABILITY_NAME.DICE_CONTROL_ACCURACY)).toBe(40));
})

describe("abilityattribute",()=>{
    
    test("limited",()=>{
        let val=new AbilityAttributes().setLimit(1).setChance(100)
        expect(val.sample()).toBe(true)
        expect(val.sample()).toBe(false)
    })


    test("firstonly",()=>{
        let val=new AbilityAttributes().setChance(0).setFirstOnly()
        expect(val.sample()).toBe(false)
        expect(val.sample()).toBe(false)
    })

    
    test("upgrade",()=>{
        let val=new AbilityAttributes().setValue(10,20)
        val.upgrade()
        expect(val.getValue()).toBe(20)
    })



})

