import { ObstacleHelper } from "./../src/helpers"
import { EntityFilter } from "./../src/EntityFilter"
import { Game, GameSetting } from "./../src/Game"

describe("game", () => {
	let game = new Game(
		0,
		"",
		new GameSetting(
			{
				itemLimit: 6,
				extraResistanceAmount: 1,
				additionalDiceAmount: 1,
				useAdditionalLife: false,
				AAOnForceMove: false,
				AAcounterAttackStrength: 1,
				autoNextTurnOnSilent: false,
				diceControlItemFrequency: 1,
				shuffleObstacle: true,

				killRecord: false,
				itemRecord: false,
				positionRecord: false,
				moneyRecord: false,
				summaryOnly: true
			},
			false,
			false
		)
	)

	game.addPlayer(true, 0, "hi")
	game.addPlayer(true, 2, "hi2")
	game.addPlayer(true, 1, "hi3")

	test("getallplayer", () => {
		// expect(game.entityMediator.storage.getPlayer(0).turn).toBe(0)
		// expect(game.entityMediator.storage.getPlayer(1).turn).toBe(1)
		// expect(game.entityMediator.storage.getPlayer(2).turn).toBe(2)

		expect(game.entityMediator.allPlayer().length).toBe(3)
		expect(game.pOfTurn(0).pos).toBe(0)
		expect(game.pOfTurn(1).name).toBe("hi2")
	})

	test("filter", () => {
		game.pOfTurn(0).pos = 10
		game.pOfTurn(1).pos = 11
		let p1 = game.pOfTurn(1)
		let p2 = game.pOfTurn(2)
		p1.invulnerable = false
		p2.invulnerable = false

		expect(game.entityMediator.selectAllFrom(EntityFilter.ALL(game.pOfTurn(0)).inRadius(2).notMe())[0]).toBe(
			game.pOfTurn(1)
		)
		expect(game.entityMediator.selectAllFrom(EntityFilter.ALL_ENEMY_PLAYER(game.pOfTurn(0)).inRadius(2))[0]).toBe(
			game.pOfTurn(1)
		)
		expect(game.entityMediator.selectAllFrom(EntityFilter.ALL_ATTACKABLE_PLAYER(game.pOfTurn(0))).length).toBe(2)

		expect(p1.isEnemyOf(p2)).toBe(true)
		expect(p1.isTargetableFrom(p2)).toBe(true)
		expect(p1.isEnemyOf(p1)).toBe(false)
	})
	test("basicattack", () => {
		let p1 = game.pOfTurn(1)
		let p2 = game.pOfTurn(2)
		p1.pos = 5
		p2.pos = 1
		expect(p1.HP).toBe(170)

		p1.ability.update("attackRange", 2)
		p1.ability.update("attackRange", 2)
		expect(p1.ability.attackRange.get()).toBe(4)
		expect(
			game.entityMediator.selectAllFrom(EntityFilter.ALL(p1).inRadius(p1.ability.attackRange.get()).notMe()).length
		).toBe(1)
		p1.basicAttack()
		p2.basicAttack()

		console.log(p2.HP)
		expect(p2.HP).toBeLessThan(250)
		expect(p1.HP).toBe(170)
	})

	test("condition", () => {
		let p1 = game.pOfTurn(1)
		let p2 = game.pOfTurn(2)
		p1.pos = 1
		p1.HP = 200
		p2.pos = 10
		p2.HP = 100

		expect(
			game.entityMediator.selectAllFrom(
				EntityFilter.ALL_ATTACKABLE_PLAYER(p1)
					.inRadius(5)
					.onlyIf(function () {
						return this.HP === 100
					})
			).length
		).toBe(0)

		expect(
			game.entityMediator.selectAllFrom(
				EntityFilter.ALL_ATTACKABLE_PLAYER(p1)
					.inRadius(10)
					.onlyIf(function () {
						return this.HP === 100
					})
			).length
		).toBe(1)
	})
	test("obstacle", () => {
		let p1 = game.pOfTurn(1)
		let p2 = game.pOfTurn(2)
		p1.pos = 1
		p2.pos = 2
		p1.HP = 200
		p2.HP = 200

		ObstacleHelper.applyObstacle(p2,52,false)

		expect(
			p1.HP
		).toBe(125)
	})
})
