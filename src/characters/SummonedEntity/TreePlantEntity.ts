import { Entity } from "../../Entity"
import { SKILL } from "../../enum"
import { Game } from "../../Game"
import { Damage, SkillTargetSelector } from "../../Util"
import { Attackable, Damageable, SummonedEntity } from "./SummonedEntity"


class TreePlant extends SummonedEntity{
    
    
    static ATTACKRANGE=1
    static NAME="tree_plant"
    constructor(game:Game,health:number,name:string){
        super(game,health,name)
    }

    attack(): void {
        super.attack()
    }
    doDamage(source: Entity, damage: Damage): boolean {
        console.log("dodamage treeplant")

        return false
    }
    static create(game:Game,damage:Damage){

        let plant=new TreePlant(game,1,TreePlant.NAME)
        
        plant=new Damageable(plant).setReward(10)

        plant=new Attackable(plant,damage,TreePlant.ATTACKRANGE)
        .setAttackName(TreePlant.NAME)
        
        
        return plant
    }
}

export default TreePlant