import { ABILITY_NAME } from "../Ability/AbilityRegistry"
import { AbilityValue } from "../Ability/AbilityValues"
import { MarbleGame } from "../Game"
import { ACTION_TYPE, EmptyAction } from "../action/Action"
import { ActionStack } from "../action/ActionStack"
import { ActionTrace, ActionTraceTag } from "../action/ActionTrace"
import { ClaimBuyoutAction, InstantAction, PayTollAction, RequestMoveAction } from "../action/InstantAction"
import {
	ArriveEnemyLandActionBuilder,
	BuyoutActionBuilder,
	ClaimBuyoutActionBuilder,
	ClaimTollActionBuilder,
	OnBuildActionBuilder,
} from "../action/PackageBuilder"
import { DiceChanceAction, TileSelectionAction } from "../action/QueryAction"
import { BuildableTile } from "../tile/BuildableTile"
import { BUILDING } from "../tile/Tile"
import { ProtoPlayer, PlayerType } from "../util"
import { mockAbilityList, mockAbilityListNoValue, mockGame } from "./mockers"

describe("actionpackage-claimtoll", () => {
	const game = mockGame()
	let trace = new ActionTrace(ACTION_TYPE.EMPTY)
	trace.setAbilityName(ABILITY_NAME.THROW_TO_LANDMARK_AND_DONATE_ON_ENEMY_ARRIVE_TO_ME)
	trace = trace.setPrev(new ActionTrace(ACTION_TYPE.REQUEST_MOVE).setPrev(new ActionTrace(ACTION_TYPE.EMPTY)))

	let builder = new ClaimTollActionBuilder(
		game,
		trace,
		game.mediator.pOfTurn(0),
		game.map.buildableTileAt(1),
		100
	).setDefender(game.mediator.pOfTurn(1))

	builder.offences = mockAbilityList([ABILITY_NAME.ADDITIONAL_TOLL], [20])

	let pack = builder.build()

	test("instanceof ", () => expect(pack.main[0]).toBeInstanceOf(PayTollAction))
	test("toll ", () => expect((pack.main[0] as PayTollAction).amount).toBe(240))
})

describe("actionpackage-scenario-1", () => {
	const game = mockGame()
	let trace = new ActionTrace(ACTION_TYPE.EMPTY)
	game.autoBuild(1, 3, [BUILDING.HOTEL], trace)

	//0p arrives at 1p`s land at tile #3
	let builder = new ArriveEnemyLandActionBuilder(
		game,
		trace,
		game.mediator.pOfTurn(0),
		game.map.buildableTileAt(3)
	).setDefender(game.mediator.pOfTurn(1))

	builder.offences = mockAbilityListNoValue([ABILITY_NAME.TRAVEL_ON_ENEMY_LAND])
	game.pushActions(builder.build())

	test("actionstacks-1", () => {
		expect(game.actionAtDepth(0)).not.toBeUndefined()
		expect(game.actionAtDepth(0).type).toBe(ACTION_TYPE.CLAIM_TOLL)

		expect(game.actionAtDepth(1)).not.toBeUndefined()
		expect(game.actionAtDepth(1).type).toBe(ACTION_TYPE.CLAIM_BUYOUT)

		expect(game.actionAtDepth(2)).not.toBeUndefined()
		expect(game.actionAtDepth(2).type).toBe(ACTION_TYPE.REQUEST_MOVE)

		let action = game.nextAction()
		expect(action).not.toBeUndefined()
		expect(action.type).toBe(ACTION_TYPE.CLAIM_TOLL)
	})
	test("actionstacks-claimtoll", () => {
		//1p claims toll to 0p
		let builder = new ClaimTollActionBuilder(
			game,
			trace,
			game.mediator.pOfTurn(1),
			game.map.buildableTileAt(3),
			100
		).setDefender(game.mediator.pOfTurn(0))
		builder.defences = mockAbilityListNoValue([ABILITY_NAME.ANGEL_CARD])
		game.pushActions(builder.build())

		expect(game.actionAtDepth(0)).not.toBeUndefined()

		expect(game.actionAtDepth(1)).not.toBeUndefined()
		expect(game.actionAtDepth(1).type).toBe(ACTION_TYPE.PAY_MONEY)

		expect(game.actionAtDepth(2)).not.toBeUndefined()
		expect(game.actionAtDepth(2).type).toBe(ACTION_TYPE.CLAIM_BUYOUT)

		expect(game.actionAtDepth(3)).not.toBeUndefined()
		expect(game.actionAtDepth(3).type).toBe(ACTION_TYPE.REQUEST_MOVE)
		let action = game.nextAction()
		expect(action).not.toBeUndefined()

		action = game.nextAction()
		expect(action).not.toBeUndefined()
		expect(action.type).toBe(ACTION_TYPE.PAY_MONEY)
		action = game.nextAction()
		expect(action).not.toBeUndefined()
		expect(action.type).toBe(ACTION_TYPE.CLAIM_BUYOUT)
	})
	test("actionstacks-claim-buyout", () => {
		let builder = new ClaimBuyoutActionBuilder(
			game,
			trace,
			game.mediator.pOfTurn(0),
			game.map.buildableTileAt(3)
		).setDefender(game.mediator.pOfTurn(1))
		game.pushActions(builder.build())

		let action = game.nextAction()
		expect(action).not.toBeUndefined()
		expect(action.type).toBe(ACTION_TYPE.ASK_BUYOUT)
	})
	test("actionstacks-ask-buyout", () => {
		let builder = new BuyoutActionBuilder(
			game,
			new ActionTrace(ACTION_TYPE.EMPTY).addTag(ActionTraceTag.IGNORE_BLOCK_BUYOUT),
			game.mediator.pOfTurn(0),
			game.map.buildableTileAt(3),
			100
		).setDefender(game.mediator.pOfTurn(1))
		builder.defences = mockAbilityListNoValue([ABILITY_NAME.BLOCK_BUYOUT])

		game.pushActions(builder.build())

		let action = game.nextAction()
		expect(action).not.toBeUndefined()
		expect(action.type).toBe(ACTION_TYPE.BUYOUT)

		;(action as InstantAction).execute(game)

		action = game.nextAction()
		expect(action).not.toBeUndefined()
		expect(action.type).toBe(ACTION_TYPE.CHOOSE_BUILD)

		action = game.nextAction()
		expect(action).not.toBeUndefined()
		expect(action.type).toBe(ACTION_TYPE.REQUEST_MOVE)
	})
})




describe("actionpackage-build-autobuild", () => {
	const game = mockGame()
	let trace = new ActionTrace(ACTION_TYPE.EMPTY)

	game.autoBuild(1, 3, [BUILDING.HOTEL], trace)
	game.mediator.pOfTurn(0).pos = 1
	let builder = new OnBuildActionBuilder(
		game,
		trace,
		game.mediator.pOfTurn(0),
		game.map.buildableTileAt(1),
		[BUILDING.LAND],
		false
	)

	builder.offences = mockAbilityListNoValue([
		ABILITY_NAME.LINE_BUYOUT_ON_BUILD,
		ABILITY_NAME.DICE_CHANCE_ON_BUILD_LANDMARK,
	])

	let pack = builder.build()

	test("actionAbilities1", () => {
		expect(pack.before[0].type).toBe(ACTION_TYPE.CHOOSE_BUYOUT_POSITION)
		expect(pack.involvedAbilities).not.toContain(ABILITY_NAME.DICE_CHANCE_ON_BUILD_LANDMARK)
		expect(pack.main.length).toBe(0)
		game.pushActions(pack)
	})
	test("actionAbilities2", () => {
		game.autoBuild(1, 1, [BUILDING.LANDMARK], trace)

		let builder = new OnBuildActionBuilder(
			game,
			trace,
			game.mediator.pOfTurn(0),
			game.map.buildableTileAt(1),
			[BUILDING.LANDMARK],
			true
		)

		builder.offences = mockAbilityListNoValue([
			ABILITY_NAME.LINE_BUYOUT_ON_BUILD,
			ABILITY_NAME.DICE_CHANCE_ON_BUILD_LANDMARK,
		])
		let pack = builder.build()

		expect(pack.before.length).toBe(0)
		expect(pack.after.length).toBe(1)
		expect(pack.after[0].type).toBe(ACTION_TYPE.DICE_CHANCE_NO_DOUBLE)
		expect(pack.main.length).toBe(0)

		expect(pack.involvedAbilities).toContain(ABILITY_NAME.DICE_CHANCE_ON_BUILD_LANDMARK)
		expect(pack.involvedAbilities).not.toContain(ABILITY_NAME.LINE_BUYOUT_ON_BUILD)

		game.pushActions(pack)
	})
	test("actionstack", () => {
		let action = game.nextAction()
		expect(action).not.toBeUndefined()

		expect(action.type).toBe(ACTION_TYPE.CHOOSE_BUYOUT_POSITION)
		action = game.nextAction()
		expect(action).not.toBeUndefined()
		expect(action.type).toBe(ACTION_TYPE.DICE_CHANCE_NO_DOUBLE)

		game.pushActions(pack)
	})
})

describe("dicedouble", () => {
	const game = mockGame()

	test("double1", () => {
		game.onThrowDice(1, 1, 1, false, new DiceChanceAction(0, false))
		expect(game.mediator.pOfTurn(0).doubles).toBe(1)
        game.nextAction()
        game.nextAction()
	})
	test("double-no", () => {
		game.onThrowDice(1, 1, 1, false, new DiceChanceAction(0, true))
		expect(game.mediator.pOfTurn(0).doubles).toBe(1)
        game.nextAction()
        game.nextAction()
	})
	test("double-2", () => {
		game.onThrowDice(1, 1, 1, false, new DiceChanceAction(0, false))
		expect(game.mediator.pOfTurn(0).doubles).toBe(2)
        game.nextAction()
        game.nextAction()
	})
	test("double-3", () => {
		game.onThrowDice(1, 1, 1, false, new DiceChanceAction(0, false))
		expect(game.mediator.pOfTurn(0).doubles).toBe(0)
        
		let action = game.nextAction()
		action = game.nextAction()
        console.log(action)
		expect(action.type).toBe(ACTION_TYPE.REQUEST_MOVE)
		expect((action as RequestMoveAction).pos).toBe(8)
	})
})

describe("actionstack-aftermain", () => {
	let stack = new ActionStack()
    stack.clear()
	test("empty", () => {
        stack.clear()
        stack.pushAll(new EmptyAction("before").setToActionPackageBeforeMain(),new EmptyAction("main").setToActionPackageBeforeMain(),new EmptyAction("after").setToAfterMain())

		expect((stack.at(0) as EmptyAction).debugId).toBe("before")
        expect((stack.at(1) as EmptyAction).debugId).toBe("main")
        expect((stack.at(2) as EmptyAction).debugId).toBe("after")
	})
    test("one", () => {
        stack.clear()
        stack.pushAll(new EmptyAction("bottom"))
        stack.pushAll(new EmptyAction("before").setToActionPackageBeforeMain(),new EmptyAction("main").setToActionPackageBeforeMain(),new EmptyAction("after").setToAfterMain())

		expect((stack.at(0) as EmptyAction).debugId).toBe("before")
        expect((stack.at(1) as EmptyAction).debugId).toBe("main")
        expect((stack.at(2) as EmptyAction).debugId).toBe("after")
        expect((stack.at(3) as EmptyAction).debugId).toBe("bottom")
	})

    test("multiple", () => {
        stack.clear()
        stack.pushAll(new EmptyAction("bottom4"))
        stack.pushAll(new EmptyAction("bottom3"))
        stack.pushAll(new EmptyAction("bottom2"))
        stack.pushAll(new EmptyAction("bottom1"))
        stack.pushAll(new EmptyAction("before").setToActionPackageBeforeMain(),new EmptyAction("main").setToActionPackageBeforeMain(),new EmptyAction("after").setToAfterMain())

		expect((stack.at(0) as EmptyAction).debugId).toBe("before")
        expect((stack.at(1) as EmptyAction).debugId).toBe("main")
        expect((stack.at(2) as EmptyAction).debugId).toBe("after")
        expect((stack.at(3) as EmptyAction).debugId).toBe("bottom1")
        expect((stack.at(4)as EmptyAction).debugId).toBe("bottom2")
	})
    test("multiple-aftermain", () => {
        stack.clear()
        stack.pushAll(new EmptyAction("bottom4"))
        stack.pushAll(new EmptyAction("bottom3"))
        stack.pushAll(new EmptyAction("before1").setToActionPackageBeforeMain(),new EmptyAction("before2").setToActionPackageBeforeMain(),new EmptyAction("main1").setToActionPackageBeforeMain(),new EmptyAction("after1").setToAfterMain())

        stack.pushAll(new EmptyAction("bottom2"))
        stack.pushAll(new EmptyAction("bottom1"))
        stack.pushAll(new EmptyAction("before3").setToActionPackageBeforeMain(),new EmptyAction("main2").setToActionPackageBeforeMain(),new EmptyAction("after2").setToAfterMain())

		expect((stack.at(0) as EmptyAction).debugId).toBe("before3")
        expect((stack.at(1) as EmptyAction).debugId).toBe("main2")
        expect((stack.at(2) as EmptyAction).debugId).toBe("bottom1")
        expect((stack.at(3) as EmptyAction).debugId).toBe("bottom2")
        expect((stack.at(4) as EmptyAction).debugId).toBe("before1")
        expect((stack.at(5) as EmptyAction).debugId).toBe("before2")
        expect((stack.at(6) as EmptyAction).debugId).toBe("main1")
        expect((stack.at(7) as EmptyAction).debugId).toBe("after2")
        expect((stack.at(8) as EmptyAction).debugId).toBe("after1")
        expect((stack.at(9) as EmptyAction).debugId).toBe("bottom3")
	})

    test("stacked-aftermain", () => {
        stack.clear()
        stack.pushAll(new EmptyAction("bottom4"))
        stack.pushAll(new EmptyAction("bottom3"))
        stack.pushAll(new EmptyAction("before1").setToActionPackageBeforeMain(),new EmptyAction("main1").setToActionPackageBeforeMain(),new EmptyAction("after1-1").setToAfterMain(),new EmptyAction("after1-2").setToAfterMain())

        stack.pushAll(new EmptyAction("bottom2"))
        stack.pushAll(new EmptyAction("bottom1"))
        stack.pushAll(new EmptyAction("before3").setToActionPackageBeforeMain(),new EmptyAction("after2-1").setToAfterMain(),new EmptyAction("after2-2").setToAfterMain())

		expect((stack.at(0) as EmptyAction).debugId).toBe("before3")
        expect((stack.at(1) as EmptyAction).debugId).toBe("bottom1")
        expect((stack.at(2) as EmptyAction).debugId).toBe("bottom2")
        expect((stack.at(3) as EmptyAction).debugId).toBe("before1")
        expect((stack.at(4) as EmptyAction).debugId).toBe("main1")
        
        expect((stack.at(5) as EmptyAction).debugId).toBe("after2-1")
        expect((stack.at(6) as EmptyAction).debugId).toBe("after2-2")
        expect((stack.at(7) as EmptyAction).debugId).toBe("after1-1")
        expect((stack.at(8) as EmptyAction).debugId).toBe("after1-2")
        expect((stack.at(9) as EmptyAction).debugId).toBe("bottom3")
	})

})
describe("actionstack-build", () => {
	const game = mockGame()
	let trace = new ActionTrace(ACTION_TYPE.EMPTY)

	game.mediator.pOfTurn(0).pos = 1
	game.autoBuild(1, 3, [BUILDING.HOTEL], trace)
	game.autoBuild(1, 1, [BUILDING.LANDMARK], trace)

	let builder = new OnBuildActionBuilder(
		game,
		trace,
		game.mediator.pOfTurn(0),
		game.map.buildableTileAt(1),
		[BUILDING.LANDMARK],
		false
	)
	builder.offences = mockAbilityListNoValue([
		ABILITY_NAME.DICE_CHANCE_ON_BUILD_LANDMARK,
		ABILITY_NAME.LINE_BUYOUT_ON_BUILD,
	])

	let pack = builder.build()
	test("before-1", () => {
		expect(pack.before[0]).toBeInstanceOf(TileSelectionAction)
		expect(pack.before[0].type).toBe(ACTION_TYPE.CHOOSE_BUYOUT_POSITION)
		expect((pack.before[0] as TileSelectionAction).tiles).toContain(3)
	})
	test("after-1", () => {
		expect(pack.after[0]).toBeInstanceOf(DiceChanceAction)
		expect(pack.after[0].type).toBe(ACTION_TYPE.DICE_CHANCE_NO_DOUBLE)
	})

	test("stack-empty", () => {
		game.pushActions(pack)
		let action = game.nextAction()
		expect(action).toBeInstanceOf(TileSelectionAction)
		action = game.nextAction()
		expect(action).toBeInstanceOf(DiceChanceAction)
	})

	test("stack-double", () => {
		game.pushSingleAction(new DiceChanceAction(1, false), trace)
		game.pushActions(pack)
		let action = game.nextAction()
		expect(action).toBeInstanceOf(TileSelectionAction)
		action = game.nextAction()
		expect(action.type).toBe(ACTION_TYPE.DICE_CHANCE_NO_DOUBLE)
		action = game.nextAction()
		expect(action.type).toBe(ACTION_TYPE.DICE_CHANCE)
	})
})

describe("actiontrace", () => {
	let head = new ActionTrace(ACTION_TYPE.EMPTY)
	head = new ActionTrace(ACTION_TYPE.EMPTY).setPrev(head)
	head = new ActionTrace(ACTION_TYPE.DICE_CHANCE).setPrev(head).setAbilityName(ABILITY_NAME.BACK_DICE)
	console.log(head.toString(100))
	test("hasActionAndAbility 1 ", () =>
		expect(head.hasActionAndAbility(ACTION_TYPE.DICE_CHANCE, ABILITY_NAME.BACK_DICE)).toBe(true))
	test("hasActionAndAbility 2 ", () =>
		expect(head.lastActionTypeHasAbility(ACTION_TYPE.DICE_CHANCE, ABILITY_NAME.BACK_DICE)).toBe(true))

	test("hasActionAndAbility 3 ", () =>
		expect(head.useActionAndAbility(ACTION_TYPE.DICE_CHANCE, ABILITY_NAME.BACK_DICE)).toBe(true))

	test("hasActionAndAbility 4 ", () =>
		expect(head.hasActionAndAbility(ACTION_TYPE.DICE_CHANCE, ABILITY_NAME.BACK_DICE)).toBe(false))
})

describe("actiontrace 2", () => {
	test("lastmove 1 ", () => {
		let head = new ActionTrace(ACTION_TYPE.DICE_CHANCE).setAbilityName(ABILITY_NAME.FOLLOW_ON_ENEMY_HEALING)

		expect(head.thisMoveHasAbility(ABILITY_NAME.FOLLOW_ON_ENEMY_HEALING)).toBe(true)

		head = new ActionTrace(ACTION_TYPE.REQUEST_MOVE).setPrev(head)
		head = new ActionTrace(ACTION_TYPE.EMPTY).setPrev(head)
		expect(head.thisMoveHasAbility(ABILITY_NAME.FOLLOW_ON_ENEMY_HEALING)).toBe(true)
	})

	test("lastmove 3 ", () => {
		let head = new ActionTrace(ACTION_TYPE.DICE_CHANCE).setAbilityName(ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL)
		head = new ActionTrace(ACTION_TYPE.EMPTY).setPrev(head)
		head = new ActionTrace(ACTION_TYPE.CHOOSE_GODHAND_TILE_LIFT).setPrev(head)
		expect(head.hasAbilityInNumberOfMove(ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL, 0)).toBe(true)
		head = new ActionTrace(ACTION_TYPE.REQUEST_MOVE).setPrev(head)
		head = new ActionTrace(ACTION_TYPE.DICE_CHANCE).setPrev(head)

		console.log(head.toString())
		expect(head.thisMoveHasAbility(ABILITY_NAME.LANDMARK_ON_AFTER_TRAVEL)).toBe(false)
	})

	test("tracetag ", () => {
		let head = new ActionTrace(ACTION_TYPE.DICE_CHANCE).addTag(ActionTraceTag.BUBBLE_ROOT)

		head = new ActionTrace(ACTION_TYPE.EMPTY).setPrev(head)
		head = new ActionTrace(ACTION_TYPE.CHOOSE_GODHAND_TILE_LIFT).setPrev(head)
		expect(head.hasTag(ActionTraceTag.BUBBLE_ROOT)).toBe(true)
		expect(head.useTag(ActionTraceTag.BUBBLE_ROOT)).toBe(true)
		expect(head.hasTag(ActionTraceTag.BUBBLE_ROOT)).toBe(false)
	})
})
