
import {PlayerAbility} from "./../src/PlayerAbility"
import {Damage,CALC_TYPE, Normalize} from "./../src/Util"
let ability=new PlayerAbility(null,[200, 20, 7, 7, 0, 0])

test('ad ', () => {
  expect(ability.get("AD")).toBe(20);
});
test('ap ', () => {
  expect(ability.get("AP")).toBe(0);
});
test('adstat ', () => {
  ability.update("adStat",30)
  expect(ability.get("AD")).toBe(50);
  ability.update("AP",60)
  expect(ability.get("AP")).toBe(90);
  expect(ability.get("AD")).toBe(20);

  expect(ability.adaptativeStat.get()).toBe(30);

});


test('add-subtract ', () => {
  ability.update("attackRange",1)
  ability.update("attackRange",2)
  expect(ability.attackRange.get()).toBe(3);
  ability.update("attackRange",-1)
  expect(ability.attackRange.get()).toBe(2);
  ability.update("attackRange",1)

  // expect(ability.attackRange.actual).toBe(3);

  ability.update("attackRange",3)
  expect(ability.attackRange.get()).toBe(PlayerAbility.MAX_ATTACKRANGE);
  // expect(ability.attackRange.actual).toBe(6);

  ability.update("attackRange",2)
  expect(ability.attackRange.get()).toBe(PlayerAbility.MAX_ATTACKRANGE);
  // expect(ability.attackRange.actual).toBe(8);

  ability.update("attackRange",-2)
  expect(ability.attackRange.get()).toBe(PlayerAbility.MAX_ATTACKRANGE);
  // expect(ability.attackRange.actual).toBe(6);

  ability.update("attackRange",-3)
  expect(ability.attackRange.get()).toBe(3);


});

test("damage",()=>{
  let dmg=new Damage(20,20,20)
  dmg.updateNormalDamage(CALC_TYPE.multiply,2)
  expect(dmg.attack).toBe(40)
  expect(dmg.magic).toBe(40)
  expect(dmg.fixed).toBe(20)

  
  expect(dmg.applyResistance({
    AR:110,MR:100,arP:10,MP:0,percentPenetration:0
  }).getTotalDmg()).toBe(60)

  expect(PlayerAbility.applySkillDmgReduction(dmg,50).getTotalDmg()).toBe(40)
})


test("normalize",()=>{
  let list=Normalize([100,60,89,50])
  console.log(list)
  expect(list[0]).toBe(1)
  expect(list[3]).toBe(0)
})
