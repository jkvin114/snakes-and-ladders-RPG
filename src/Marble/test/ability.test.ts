import { ABILITY_NAME, ABILITY_REGISTRY } from "../Ability/AbilityRegistry"
import { ACTION_TYPE, EmptyAction } from "../action/Action"
import { ActionPackage } from "../action/ActionPackage"
import { ActionStack } from "../action/ActionStack"
import { ActionTrace } from "../action/ActionTrace"

describe("ability-priority", () => {
    let pack=new ActionPackage(new ActionTrace(ACTION_TYPE.EMPTY))
    pack.addAction(new EmptyAction("redsticker"),ABILITY_NAME.LINE_BUYOUT_ON_BUILD)
    pack.addAction(new EmptyAction("pharaoh"),ABILITY_NAME.DICE_CHANCE_ON_BUILD_LANDMARK)
    pack.addMain(new EmptyAction("main"))

    test("after",()=>{
        expect((pack.after[0] as EmptyAction).debugId).toBe("pharaoh")
    })
    test("before",()=>{
        expect((pack.before[0] as EmptyAction).debugId).toBe("redsticker")
    })

    test("main",()=>{
        expect((pack.main[0] as EmptyAction).debugId).toBe("main")
    })

})