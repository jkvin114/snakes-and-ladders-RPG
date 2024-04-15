import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { ISLAND_POS, MAP_SIZE, START_POS, TRAVEL_POS } from "../../mapconfig"
import { BUILDING, TILE_TYPE } from "../../tile/Tile"
import {
	backwardBy,
	chooseRandom,
	clamp,
	forwardBy,
	forwardDistance,
	maxFor,
	pos2Line,
	range,
	triDist,
} from "../../util"
import { ServerRequestModel as sm } from "../../../Model/ServerRequestModel"
import { ClientResponseModel as cm } from "../../../Model/ClientResponseModel"
import { BuildChoice, TileChoice } from "../ActionChoice"
import { CARD_NAME } from "../../FortuneCard"
import { RationalRandomAgent } from "./RationalRandomActionSelector"

export class CustomAgent1 extends RationalRandomAgent {
	static readonly CONSTRUCTION_TOOLS = new Set([
		ABILITY_NAME.GO_START_ON_THREE_HOUSE,
		ABILITY_NAME.UPGRADE_LAND_AND_MULTIPLIER_ON_BUILD,
	])
	static readonly GO_STARTS = new Set([ABILITY_NAME.GO_START_ON_THREE_HOUSE])
	static readonly TRAVELS = new Set([
		ABILITY_NAME.TRAVEL_ON_ENEMY_LAND,
		ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_LAND,
		ABILITY_NAME.TRAVEL_ON_TRIPLE_DOUBLE,
		ABILITY_NAME.FREE_AND_TRAVEL_ON_ENEMY_AND_MY_LAND,
	])
	static readonly LANDMARK_PULLS = new Set([
		ABILITY_NAME.LINE_PULL_ON_ARRIVE_AND_BUILD_LANDMARK,
		ABILITY_NAME.RANGE_PULL_ON_ARRIVE_LANDMARK,
	])
	static readonly GUIDEBOOK = new Set([
		ABILITY_NAME.THROW_TO_LANDMARK_AND_DONATE_ON_ENEMY_ARRIVE_TO_ME,
		ABILITY_NAME.THROW_TO_LANDMARK_ON_ENEMY_ARRIVE_TO_ME,
	])

	static readonly TRIPLE_DOUBLE_OVERRIDER=new Set([
		ABILITY_NAME.TRAVEL_ON_TRIPLE_DOUBLE,
		ABILITY_NAME.INSTANT_ESCAPE_ISLAND,
		ABILITY_NAME.LINE_MOVE_ON_TRIPLE_DOUBLE
	])

	static readonly ANGEL = new Set([ABILITY_NAME.ANGEL_CARD])

	wrap<T>(data: T): Promise<T|null> {

		return new Promise((resolve) => resolve(data))
	}

	chooseAttackDefenceCard(req: sm.AttackDefenceCardSelection) {
		//console.log(req)
		if (req.cardname === CARD_NAME.ANGEL) return this.wrap<cm.UseCard>({ result: false, cardname: req.cardname })

		return this.wrap<cm.UseCard>({ result: true, cardname: req.cardname })
	}

	chooseTollDefenceCard(req: sm.TollDefenceCardSelection) {
		//console.log(req)
		if (req.before * triDist(1.3, 0.3) > this.game.me.money)
			return this.wrap<cm.UseCard>({ result: true, cardname: req.cardname })
		return this.wrap<cm.UseCard>({ result: false, cardname: req.cardname })
	}

	protected chooseDonateTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)
		return this.wrap(maxFor(choices, (t) => -this.game.landAt(t.pos).getToll()))
	}
	protected chooseOlympicTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let pos = this.game.mostExpensiveMyLand()
		return this.wrap<cm.SelectTile>({ pos: pos, name: req.source, result: true })
	}
	protected chooseAttackTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)
		let monopolypos = this.selectPosForMonopoly(choices.map((p) => p.pos))
		if (monopolypos !== -1) return this.wrap<cm.SelectTile>({ pos: monopolypos, name: req.source, result: true })
		return this.wrap(maxFor(choices, (t) => this.game.landAt(t.pos).getToll()))
	}

	chooseTravelTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)
		return this.selectCancelableMovePos(choices)
	}

	chooseBuild(req: sm.LandBuildSelection): Promise<number[]> {
		let choices = new BuildChoice().generate(req)

		if (this.game.me.hasOneAbilities(CustomAgent1.CONSTRUCTION_TOOLS))
			return this.wrap(maxFor(choices, (buildings) => buildings.length))
		else return super.chooseBuild(req)
	}

	ChooseDice(req: sm.DiceSelection): Promise<cm.PressDice> {
		//	console.log("ChooseDice")
		const oe = req.hasOddEven
		let validpos = range(12, 2).map((d) => (req.origin + d) % MAP_SIZE)
		let monopolypos = this.selectPosForMonopoly(validpos)
		if (monopolypos !== -1) {
			let distance = forwardDistance(req.origin, monopolypos)
			let oddeven = 0
			if (oe) oddeven = distance % 2 === 1 ? 1 : 2
			return this.wrap<cm.PressDice>({
				target: clamp(distance, 2, 12),
				oddeven: oddeven,
			})
		}
		const is3double = this.myPlayer.doubles >=2 && !this.game.hasOneAbility(this.myturn,CustomAgent1.TRIPLE_DOUBLE_OVERRIDER)
		let pos = this.selectMovePos(
			validpos.map((p) => {
				return { pos: p, name: "", result: true }
			}),
			(p, i) => {
				//reward for dice 2 and 12
				if (i + 2 === 2 || i + 2 === 12) return is3double?0:1.5
				//reward for even numbered dice
				else if (i % 2 === 0) return 1.1
				return 1
			}
		)
		//console.log(pos)
		if (pos.reward <= 0) return this.wrap({ target: 12, oddeven: 0 })
		let oddeven = 0
		let distance = forwardDistance(req.origin, pos.pos)
		if (pos.reward > 9 && oe) oddeven = distance % 2 === 1 ? 1 : 2

		return this.wrap({ target: clamp(distance, 2, 12), oddeven: oddeven })
	}

	protected chooseBuyoutTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)
		let monopolypos = this.selectPosForMonopoly(choices.map((p) => p.pos))
		if (monopolypos !== -1) return this.wrap<cm.SelectTile>({ pos: monopolypos, name: req.source, result: true })
		return super.chooseBuyoutTile(req)
	}
	protected chooseStartBuildTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)

		return this.wrap(this.chooseAddBuildTile(choices))
	}
	protected chooseGodHandBuildTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)
		let monopolypos = this.selectPosForMonopoly(choices.map((p) => p.pos))
		if (monopolypos !== -1) return this.wrap<cm.SelectTile>({ pos: monopolypos, name: req.source, result: true })

		let empty = choices.filter((p) => this.game.tileAt(p.pos).owner === -1)
		let mylands = choices.filter((p) => this.game.tileAt(p.pos).owner === this.game.myturn)
		let addbuild = this.chooseAddBuildTile(mylands)

		if (addbuild != null && this.game.landAt(addbuild.pos).getNextBuild() === BUILDING.LANDMARK) {
			return this.wrap(addbuild)
		} else if (empty.length > 0) return this.wrap(chooseRandom(empty))
		else return this.wrap(addbuild)
	}

	protected chooseAddBuildTile(avaliablePos: cm.SelectTile[]): cm.SelectTile {
		let threes = avaliablePos.filter((p) => this.game.landAt(p.pos).getNextBuild() === BUILDING.LANDMARK)
		if (threes.length === 0) return maxFor(avaliablePos, (p) => this.game.landAt(p.pos).getToll())
		return maxFor(threes, (p) => this.game.landAt(p.pos).getToll())
	}

	protected chooseBlackholeTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)
		let pos = this.selectPosForBlackhole(choices.map((p) => p.pos))
		return this.wrap<cm.SelectTile>({ pos: pos, name: choices[0].name, result: true })
	}
	protected selectNonCancelableMovePos(avaliablePos: cm.SelectTile[]): Promise<cm.SelectTile> {
		return this.wrap<cm.SelectTile>({
			pos: this.selectMovePos(avaliablePos).pos,
			name: avaliablePos[0].name,
			result: true,
		})
	}
	/**
	 * return -1 if we dont want to move anywhere
	 * @param avaliablePos
	 * @returns
	 */
	protected selectCancelableMovePos(avaliablePos: cm.SelectTile[]): Promise<cm.SelectTile> {
		let pos = this.selectMovePos(avaliablePos)
		let result = pos.reward >= 0
		return this.wrap<cm.SelectTile>({ pos: pos.pos, name: avaliablePos[0].name, result: result })
	}

	protected getMyLandmarkReward(pos: number) {
		let toll = this.game.landAt(pos).getToll() / (200 * 10000) / triDist(3, 2)
		if (this.myPlayer.hasOneAbilities(CustomAgent1.GUIDEBOOK)) toll *= 3
		if (this.myPlayer.hasOneAbilities(new Set([ABILITY_NAME.ADD_MULTIPLIER_ON_ARRIVE_MY_LAND]))) toll *= 2

		if (this.myPlayer.hasOneAbilities(new Set([ABILITY_NAME.CALL_PLAYERS_ON_TRAVEL]))) {
			toll *= 1.5
			let enemies = this.game.getPlayersAt(TRAVEL_POS).filter((p) => p.turn !== this.myturn && p.pos !== pos).length
			if (enemies > 0) return toll * enemies ** 2
		}

		let range = [0, 0]

		if (this.myPlayer.hasOneAbilities(new Set([ABILITY_NAME.LINE_PULL_ON_ARRIVE_AND_BUILD_LANDMARK]))) {
			let line = pos2Line(pos)
			range[0] = line * 8
			range[1] = ((line + 1) * 8) % MAP_SIZE
		} else if (this.myPlayer.hasOneAbilities(new Set([ABILITY_NAME.RANGE_PULL_ON_ARRIVE_LANDMARK]))) {
			range[0] = backwardBy(pos, 4)
			range[1] = forwardBy(pos, 4)
		} else return triDist(1, 1)
		
		let enemies = this.game
			.getPlayersBetween(range[0], range[1] + 1)
			.filter((p) => p.turn !== this.myturn && p.pos !== pos).length

		return toll * enemies ** 2
	}

	protected getPosReward(pos: number) {
		let reward = 0
		let tileObj = this.game.tileAt(pos)

		if (pos === ISLAND_POS) reward = -1
		else if (pos === TRAVEL_POS) reward = triDist(1.5, 1)
		else if (this.game.blackholepos === pos) reward = triDist(-1, 2)
		else if (tileObj.isLandMark()) {
			let ismine = !this.game.isEnemyLand(pos)
			if (!ismine) reward = -4
			else reward = this.getMyLandmarkReward(pos)
		} else if (tileObj.type == TILE_TYPE.SIGHT && tileObj.owner !== -1) reward = 0
		else if (tileObj.type == TILE_TYPE.SIGHT && tileObj.owner === -1) reward = triDist(1.4, 1)
		else if (tileObj.isSpecial) reward = triDist(1.5, 1)
		else if (tileObj.isCorner) reward = triDist(1, 1)
		else if (tileObj.isBuildable && tileObj.owner === -1) reward = triDist(2, 1)
		else if (tileObj.owner === this.game.myturn) {
			if (this.game.landAt(pos).getNextBuild() === BUILDING.LANDMARK) reward = triDist(1.7, 1)
			else reward = triDist(0.5, 1)
		} else if (this.game.isEnemyLand(pos) && tileObj.isBuildable) {
			reward = this.game.landAt(pos).getToll() * triDist(2.5, 0.5) < this.myPlayer.money ? triDist(1.5, 1) : -2
		} 
		//else if (tileObj.isBuildable) reward = triDist(1, 1)
		if (this.game.playerAtHasOneAbility(pos, CustomAgent1.GUIDEBOOK)) reward = -5
		if (this.game.willBeMyColorMonopoly(pos)) {
			// console.log("colormonopoly")
			reward *= 2
		}
		return reward
	}

	protected selectMovePos(
		avaliablePos: cm.SelectTile[],
		rewardMulFunc?: (pos: number, idx: number) => number
	): { pos: number; reward: number } {
		let monopolypos = this.selectPosForMonopoly(avaliablePos.map((p) => p.pos))
		if (monopolypos !== -1) return { pos: monopolypos, reward: 99 }

		let choices = avaliablePos.map((tile, i) => {
			let reward = this.getPosReward(tile.pos)
			if (rewardMulFunc) reward *= rewardMulFunc(tile.pos, i)
			return { pos: tile.pos, reward: reward }
		})

		return maxFor(choices, (r) => r.reward)
	}
	/**
	 * return -1 if there is no monopoly chance, or the chance position is occupied by non-buyable land.
	 * otherwise, return the best pos to acquire monopoly
	 * @param avaliablePos
	 */
	protected selectPosForMonopoly(avaliablePos: number[]) {
		let maxreward = 0
		let bestpos = -1
		for (const p of avaliablePos) {
			if (
				this.game.me.monopolyChancePos.has(p) &&
				this.game.tileAt(p).isBuildable &&
				this.game.landAt(p).isEmptyOrBuyable()
			) {
				//if toll is more than 3x my money and i don`t have angel card, skip this position
				if (this.game.landAt(p).getToll() * triDist(2, 0.5) > this.game.me.money) {
					if (!this.game.hasOneAbility(this.myturn, CustomAgent1.ANGEL)) continue
				}
				if (this.game.me.monopolyChancePos.get(p) > maxreward) bestpos = p
			}
		}
		return bestpos
	}

	protected selectPosForBlackhole(avaliablePos: number[]) {
		let enemylandmark = this.game.mostExpensiveEnemyLandmark()

		if (enemylandmark > -1 && this.game.landAt(enemylandmark).getToll() > this.game.me.money) {
			return enemylandmark
		} else if (this.game.enemyHasOneAbility(CustomAgent1.TRAVELS)) {
			return TRAVEL_POS
		} else if (this.game.enemyHasOneAbility(CustomAgent1.GO_STARTS)) {
			return START_POS
		} else if (enemylandmark > -1) return enemylandmark
		else return chooseRandom(avaliablePos)
	}

	chooseGodHand(req: sm.GodHandSpecialSelection): Promise<boolean> {
		if (!req.canLiftTile) return this.wrap(true)
		let buildpos = this.game.getGodHandPossibleBuildPos()
		return this.wrap(buildpos.length > 0)
	}
	protected chooseGodHandTileLift(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)
		let pos = -1
		let maxreward = -Infinity

		for (const tile of choices) {
			let before = backwardBy(tile.pos, 1)
			if (
				this.game.tileAt(before).isBuildable &&
				this.game.landAt(before).isLandMark() &&
				!this.game.isEnemyLand(before)
			) {
				let reward = this.game.landAt(before).getToll()
				if (before < this.myPlayer.pos) reward *= 2
				else if (this.game.hasOneAbility(this.myturn, CustomAgent1.LANDMARK_PULLS)) reward *= 1.5
				if (maxreward < reward) {
					pos = tile.pos
					maxreward = reward
				}
			}
		}

		return this.wrap({ pos: pos, name: req.source, result: pos !== -1 })
	}
}
