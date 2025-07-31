import { ABILITY_NAME } from "../../Ability/AbilityRegistry"
import { ISLAND_POS, MAP_SIZE, OLYMPIC_POS, START_POS, TRAVEL_POS } from "../../mapconfig"
import { BUILDING, TILE_TYPE } from "../../tile/Tile"
import {
	backwardBy,
	backwardDistance,
	clamp,
	forwardBy,
	forwardDistance,
	getSameLineTiles,
	getTilesBewteen,
	maxFor,
	pos2Line,
	range,
} from "../../util"
import { ServerRequestModel as sm } from "../../../Model/ServerRequestModel"
import { ClientResponseModel as cm } from "../../../Model/ClientResponseModel"
import { BuildChoice, TileChoice } from "../ActionChoice"
import { CARD_NAME } from "../../FortuneCard"
import { RationalRandomAgent } from "./RationalRandomActionSelector"
import { AbilityTag, AbilityTags } from "../../Tags"
import { MOVETYPE } from "../../action/Action"
import { Logger } from "../../../logger"
import { MONOPOLY } from "../../GameMap"
import { factory } from "typescript"

interface EnemyMonopoly {
	type: MONOPOLY
	turn: number
	pos: number
}
interface ForceMoveSelection {
	target: number
	targetPos: number
	reward: number
}

export class CustomAgent1 extends RationalRandomAgent {
	wrap<T>(data: T): Promise<T | null> {
		return new Promise((resolve) => resolve(data))
	}

	chooseAttackDefenceCard(req: sm.AttackDefenceCardSelection) {
		//console.log(req)
		if (req.cardname === CARD_NAME.ANGEL) return this.wrap<cm.UseCard>({ result: false, cardname: req.cardname })

		return this.wrap<cm.UseCard>({ result: true, cardname: req.cardname })
	}

	chooseTollDefenceCard(req: sm.TollDefenceCardSelection) {
		//console.log(req)
		if (req.before * this.game.rand.triDist(1.3, 0.3) > this.myPlayer.money)
			return this.wrap<cm.UseCard>({ result: true, cardname: req.cardname })
		return this.wrap<cm.UseCard>({ result: false, cardname: req.cardname })
	}

	protected chooseDonateTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)
		return this.wrap(maxFor(choices, (t) => -this.game.toll(t.pos)))
	}
	protected chooseOlympicTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let pos = this.game.mostExpensiveMyLand()
		return this.wrap<cm.SelectTile>({ pos: pos, name: req.source, result: true })
	}
	protected chooseAttackTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)
		let monopolypos = this.selectPosForMonopoly(choices.map((p) => p.pos))
		if (monopolypos !== -1) return this.wrap<cm.SelectTile>({ pos: monopolypos, name: req.source, result: true })

		return this.wrap(maxFor(choices, (t) => this.game.toll(t.pos)))
	}

	chooseMoveTileFor(req: sm.MoveTileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)
		if (req.moveType === MOVETYPE.TRAVEL || req.moveType === MOVETYPE.WALK) {
			const specialPos = this.game.specialPos()
			if (specialPos.lifted !== -1) {
				let unreachable = [...getTilesBewteen(specialPos.lifted, req.sourcePos), specialPos.lifted, req.sourcePos]
				let available = choices.filter((p) => !unreachable.includes(p.pos))
				if (available.length > 0) choices = available
			}
		}
		return this.selectCancelableMovePos(choices,req.ability)
	}

	chooseBuild(req: sm.LandBuildSelection): Promise<number[]> {
		let choices = new BuildChoice().generate(req)
		//[3건, 건설암함,2건] or [건, 건설암함] or [랜마,] or [관광지,]
		//console.log(choices)
		if (this.myPlayer.hasOneAbilities(AbilityTags.CONSTRUCTION_TOOLS) && choices.length > 0)
			return this.wrap(maxFor(choices, (buildings) => buildings.length))
		else if (choices.length === 2) {
			if(choices[0].includes(BUILDING.LANDMARK) || choices[0].includes(BUILDING.SIGHT)|| choices[0].includes(BUILDING.LAND)){
				return this.wrap(choices[0])
			}

			//아무 건설시에 발동되는 능력있으면 최대한 추가건설. 아닐시 20%로
			if (this.myPlayer.hasOneAbilities(AbilityTags.ON_ANY_BUILD_ABILITY) || this.game.rand.randBool(5)) {
				return this.wrap(choices[0])
			}
			else{
				return this.wrap(choices[1])
			}
		} else if (!this.game.rand.randBool(10) && choices.length > 2 && choices[2].length > 0) {
			//90%
			return this.wrap(choices[2])
		}

		return super.chooseBuild(req)
	}

	ChooseDice(req: sm.DiceSelection): Promise<cm.PressDice> {
		//	console.log("ChooseDice")
		const oe = req.hasOddEven
		let validpos = range(12, 2).map((d) => (req.origin + d) % MAP_SIZE)

		if (this.myPlayer.hasEffect("bubble_root")) {
			return this.wrap({ target: this.game.rand.randBool(2) ? 2 : 12, oddeven: 0 })
		}

		let monopolypos = this.selectPosForMonopoly(validpos)
		if (monopolypos !== -1 && this.isReachable(monopolypos)) {
			let distance = forwardDistance(req.origin, monopolypos)
			let oddeven = 0
			if (oe) oddeven = distance % 2 === 1 ? 1 : 2
			return this.wrap<cm.PressDice>({
				target: clamp(distance, 2, 12),
				oddeven: oddeven,
			})
		}
		const is3double =
			this.myPlayer.doubles >= 2 && !this.game.hasOneAbility(this.myturn, AbilityTags.TRIPLE_DOUBLE_OVERRIDER)
		let pos = this.selectMovePos(
			validpos.map((p) => {
				return { pos: p, name: "", result: true }
			}),
			(p, i) => {
				//reward for dice 2 and 12
				if (i + 2 === 2 || i + 2 === 12) return is3double ? 0 : 1.5
				//reward for even numbered dice
				else if (i % 2 === 0) return 1.1
				return 1
			}
		)
		//console.log(pos)
		if (pos.reward <= 0) return this.wrap({ target: 12, oddeven: 0 })
		let oddeven = 0
		let distance = forwardDistance(req.origin, pos.pos)
		if (pos.reward > 5 && oe) oddeven = distance % 2 === 1 ? 1 : 2

		return this.wrap({ target: clamp(distance, 2, 12), oddeven: oddeven })
	}

	protected chooseBuyoutTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)
		let monopolypos = this.selectPosForMonopoly(choices.map((p) => p.pos))
		if (monopolypos !== -1) return this.wrap<cm.SelectTile>({ pos: monopolypos, name: req.source, result: true })

		let colormonopoly = choices.filter((p) => this.game.willBeMyColorMonopoly(p.pos))
		if (colormonopoly.length > 0)
			return this.wrap<cm.SelectTile>({ pos: colormonopoly[0].pos, name: req.source, result: true })

		return super.chooseBuyoutTile(req)
	}
	protected chooseStartBuildTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)

		return this.wrap(this.chooseAddBuildTile(choices))
	}
	protected chooseGodHandBuildTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)
		let empty = choices.filter((p) => this.game.tileAt(p.pos).owner === -1)

		let monopolypos = this.selectPosForMonopoly(choices.map((p) => p.pos))

		if (monopolypos !== -1 && empty.some((p) => p.pos === monopolypos))
			return this.wrap<cm.SelectTile>({ pos: monopolypos, name: req.source, result: true })

		let mylands = choices.filter((p) => this.game.tileAt(p.pos).owner === this.game.myturn)
		let addbuild = this.chooseAddBuildTile(mylands)

		let colormonopoly = empty.filter((p) => this.game.willBeMyColorMonopoly(p.pos))
		if (colormonopoly.length > 0 && this.game.rand.randBool(2)) {
			return this.wrap(colormonopoly[0])
		}

		if (addbuild != null && this.game.landAt(addbuild.pos).getNextBuild() === BUILDING.LANDMARK) {
			return this.wrap(addbuild)
		} else if (empty.length > 0) return this.wrap(this.game.rand.chooseRandom(empty))
		else return this.wrap(addbuild)
	}

	protected chooseAddBuildTile(avaliablePos: cm.SelectTile[]): cm.SelectTile {
		let threes = avaliablePos.filter((p) => this.game.landAt(p.pos).getNextBuild() === BUILDING.LANDMARK)
		if (threes.length === 0) return maxFor(avaliablePos, (p) => this.game.toll(p.pos))
		return maxFor(threes, (p) => this.game.toll(p.pos))
	}

	protected chooseBlackholeTile(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)
		let pos = this.selectPosForBlackhole(choices.map((p) => p.pos))
		return this.wrap<cm.SelectTile>({ pos: pos, name: choices[0].name, result: pos !== -1 })
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
	protected selectCancelableMovePos(avaliablePos: cm.SelectTile[],ability?:ABILITY_NAME): Promise<cm.SelectTile> {
		let pos = this.selectMovePos(avaliablePos, null,false,AbilityTags.IGNORES_GUIDEBOOK.has(ability))
		let result = pos.reward >= 0
		return this.wrap<cm.SelectTile>({ pos: pos.pos, name: avaliablePos[0].name, result: result })
	}

	protected getMyLandmarkReward(pos: number) {
		//1000만: 2
		//1억: 3
		let toll = this.game.logToll(pos) * this.game.rand.triDist(1, 0.3)

		if (this.myPlayer.hasOneAbilities(new Set([ABILITY_NAME.ADD_MULTIPLIER_ON_ARRIVE_MY_LAND]))) toll += 0.3

		if (this.myPlayer.hasOneAbilities(new Set([ABILITY_NAME.CALL_PLAYERS_ON_TRAVEL]))) {
			toll *= 1.5

			let enemies = this.game.getPlayersAt(TRAVEL_POS).filter((p) => p.turn !== this.myturn && p.pos !== pos).length
			if (enemies > 0) {
				if (this.myPlayer.hasOneAbilities(AbilityTags.GUIDEBOOK)) toll *= 2
				return toll * Math.max(1, enemies * 2)
			}
		}

		let range = [0, 0]

		if (this.myPlayer.hasOneAbilities(new Set([ABILITY_NAME.LINE_PULL_ON_ARRIVE_AND_BUILD_LANDMARK]))) {
			let line = pos2Line(pos)
			range[0] = line * 8
			range[1] = ((line + 1) * 8) % MAP_SIZE
		} else if (this.myPlayer.hasOneAbilities(new Set([ABILITY_NAME.RANGE_PULL_ON_ARRIVE_LANDMARK]))) {
			range[0] = backwardBy(pos, 4)
			range[1] = forwardBy(pos, 4)
		} else return this.game.rand.triDist(0.6, 0.3)

		if (this.myPlayer.hasOneAbilities(AbilityTags.GUIDEBOOK)) toll *= 1.5

		let enemies = this.game
			.getPlayersBetween(range[0], range[1] + 1)
			.filter((p) => p.turn !== this.myturn && p.pos !== pos).length
		if (enemies === 0) {
			return 0.5
		}
		return toll * Math.max(1, enemies * 2)
	}

	protected getPosReward(pos: number, enemyMonopoly: EnemyMonopoly[],isForcemove:boolean,ignoreGuidebook:boolean) {
		let reward = 0

		let specials = this.game.specialPos()

		if (specials.waterStreams.includes(pos) && specials.waterStreamTarget !== -1) pos = specials.waterStreamTarget

		if (this.game.blackholepos === pos) {
			pos = this.game.whiteholepos
		}

		let tileObj = this.game.tileAt(pos)

		if (pos === ISLAND_POS) reward = -1
		else if (tileObj.type === TILE_TYPE.CARD) {
			//reward = this.game.rand.uniDist(0.5, 1.3)
		} else if (pos === TRAVEL_POS) reward = this.game.rand.uniDist(0.5, 1.3)
		else if (tileObj.isBuildable && tileObj.isLandMark()) {
			// let ismine = !this.game.isEnemyLand(pos)
			if (!this.game.isMyLand(pos)) {
				if(this.myPlayer.hasOneAbilities(AbilityTags.LANDMARK_PAINT)){
					if(this.myPlayer.monopolyChancePos.has(pos)) reward = 10
					else reward = this.game.rand.triDist(-1,1)
				}
				else{
					reward = -4
				}
			}
			else reward = this.getMyLandmarkReward(pos)
		} else if (tileObj.type == TILE_TYPE.SIGHT) {
			if (tileObj.owner !== -1) reward = 0
			else if (tileObj.type == TILE_TYPE.SIGHT && tileObj.owner === -1) {
				if (enemyMonopoly.some((m) => m.type === MONOPOLY.SIGHT)) {
					reward = this.game.rand.triDist(6, 0.5)
				} else if (enemyMonopoly.some((m) => m.type === MONOPOLY.LINE)) {
					reward = this.game.rand.triDist(3, 0.5)
				} else {
					reward = this.game.rand.triDist(1.5, 0.5)
				}
			}
		} else if (tileObj.isSpecial && !isForcemove) {
			let specialpos = this.getGoodSpecialSelectionFromPos(pos)
			if (specialpos !== -1) reward = this.game.rand.triDist(3, 0.5)
			else reward = this.specialBuildReward(pos)
		} else if (pos === START_POS) {
			if (this.game.has3BuildLands()) reward = this.game.rand.triDist(1.7, 0.5)
			else reward = 0.1
		} else if (pos === OLYMPIC_POS) {
			reward = 0.3
		} else if (tileObj.isBuildable && this.game.landAt(pos).isEmpty()) {
			reward = this.game.rand.triDist(1.5, 0.5)
		} else if (this.game.isMyLand(pos)) {
			if (this.game.is3Build(pos)) reward = this.game.rand.triDist(1.7, 0.5)
			else reward = this.game.rand.triDist(0.3, 0.3)
		} else if (tileObj.isBuildable && this.game.isEnemyLand(pos)) {
			const hasEnoughMoneyForBuyout = this.hasEnoughMoneyForBuyout(pos)

			if (hasEnoughMoneyForBuyout && enemyMonopoly.some((m) => m.type === MONOPOLY.LINE && m.turn === tileObj.owner)) {
				if (
					enemyMonopoly.some(
						(m) => m.type === MONOPOLY.LINE && m.turn === tileObj.owner && this.game.isColorMonopolyOf(pos, m.turn)
					)
				)
					reward = this.game.rand.triDist(4, 0.5)
				else reward = this.game.rand.triDist(2, 0.5)
			} else if (
				hasEnoughMoneyForBuyout &&
				enemyMonopoly.some((m) => m.type === MONOPOLY.TRIPLE && m.turn === tileObj.owner)
			) {
				if (
					enemyMonopoly.some(
						(m) => m.type === MONOPOLY.TRIPLE && m.turn === tileObj.owner && this.game.isColorMonopolyOf(pos, m.turn)
					)
				)
					reward = this.game.rand.triDist(5, 0.5)
				else {
					reward = this.game.rand.triDist(3, 0.5)
				}
			} else {
				reward = hasEnoughMoneyForBuyout ? this.game.rand.triDist(1.5, 0.5) : -2
			}
			if (this.game.is3Build(pos)) {
				reward *= 1.5
			}
		}
		//else if (tileObj.isBuildable) reward = this.game.rand.triDist(1, 1)
		if (this.game.playerAtHasOneAbility(pos, AbilityTags.GUIDEBOOK) && !ignoreGuidebook) reward -= 6
		if (this.game.willBeMyColorMonopoly(pos)) {
			// console.log("colormonopoly")
			reward *= 2
		}
		if (
			pos === specials.waterStreamTarget &&
			!this.game.isEnemyLand(pos) &&
			this.game.hasOneAbility(this.myturn, AbilityTags.GUIDEBOOK)
		) {
			reward += this.game.rand.triDist(1, 1)
		}

		return reward
	}
	protected hasEnoughMoneyForBuyout(pos: number) {
		return this.game.toll(pos) * this.game.rand.triDist(2.5, 0.5) < this.myPlayer.money
	}

	protected isReachable(pos: number) {
		if (this.game.playerAtHasOneAbility(pos, AbilityTags.GUIDEBOOK)) return false
		if (this.game.blackholepos === pos) return false
		if (this.game.specialPos().waterStreams.includes(pos)) return false
		return true
	}

	protected selectMovePos(
		avaliablePos: cm.SelectTile[],
		rewardMulFunc?: (pos: number, idx: number) => number
		,isForcemove:boolean = false,ignoreGuidebook:boolean = false

	): { pos: number; reward: number } {
		let unreachables = this.game.specialPos().waterStreams

		let monopolypos = this.selectPosForMonopoly(avaliablePos.map((p) => p.pos).filter((p) => !unreachables.includes(p)))
		if (monopolypos !== -1 && this.isReachable(monopolypos)) return { pos: monopolypos, reward: 9999 }

		const enemyMonopoly = this.game.getEnemyMonopolyAlerts()

		let choices = avaliablePos.map((tile, i) => {
			let reward = this.getPosReward(tile.pos, enemyMonopoly,isForcemove,ignoreGuidebook)
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
	protected selectPosForMonopoly(avaliablePos: number[], needToBuy: boolean = true) {
		let maxreward = 0
		let bestpos = -1
		for (const p of avaliablePos) {
			if (
				this.myPlayer.monopolyChancePos.has(p) &&
				this.game.tileAt(p).isBuildable &&
				this.game.landAt(p).isEmptyOrBuyable()
			) {
				//if toll is more than 3x my money and i don`t have angel card, skip this position
				if (needToBuy && this.game.toll(p) * this.game.rand.triDist(2, 0.5) > this.myPlayer.money) {
					if (!this.game.hasOneAbility(this.myturn, AbilityTags.ANGEL)) continue
				}
				if (this.myPlayer.monopolyChancePos.get(p) > maxreward) bestpos = p
			}
		}
		return bestpos
	}
	protected selectPosForMonopolyNoBuyout(avaliablePos: number[]) {
		let maxreward = 0
		let bestpos = -1
		for (const p of avaliablePos) {
			if (this.myPlayer.monopolyChancePos.has(p) && this.game.isEmptyLand(p)) {
				if (this.myPlayer.monopolyChancePos.get(p) > maxreward) bestpos = p
			}
		}
		return bestpos
	}
	protected selectPosForBlackhole(avaliablePos: number[]) {
		// 2/3 chance
		let enemyMonopolyAlert = this.game.getWorstEnemyMonopolyAlertPosition(true)
		if (enemyMonopolyAlert !== -1 && avaliablePos.includes(enemyMonopolyAlert)) {
			return enemyMonopolyAlert
		}
		

		if (this.game.rand.randBool(2)) {
			const specials = this.game.specialPos()
			let candidate = -1
			if (specials.waterStreamTarget !== -1 && avaliablePos.includes(specials.waterStreamTarget)) {
				candidate = specials.waterStreamTarget
			}
			if (specials.lifted !== -1 && avaliablePos.includes(specials.lifted)) {
				candidate = backwardBy(specials.lifted, 1)
			}
			if (candidate !== -1) {
				let tileObj = this.game.tileAt(candidate)
				if (this.game.isEnemyLand(candidate) && (tileObj.isLandMark() || tileObj.type == TILE_TYPE.SIGHT))
					return candidate
			}
		}

		let enemylandmark = this.game.mostExpensiveEnemyLandmark()
		if (enemylandmark > -1 && this.game.toll(enemylandmark) > this.myPlayer.money) {
			return enemylandmark
		} else if (this.game.enemyHasOneAbility(AbilityTags.TRAVELS)) {
			return TRAVEL_POS
		} else if (this.game.enemyHasOneAbility(AbilityTags.GO_STARTS)) {
			return START_POS
		} else if (enemylandmark > -1) return enemylandmark
		else {
			//내땅은 무조건 제외
			let vaild = avaliablePos.filter((p) => !this.game.isMyLand(p))
			if (vaild.length === 0) return -1
			return this.game.rand.chooseRandom(vaild)
		}
	}

	chooseGodHand(req: sm.GodHandSpecialSelection): Promise<boolean> {
		if (!req.canLiftTile) return this.wrap(true)
		let buildpos = this.game.getPossibleBuildPosInLine()
		return this.wrap(this.shouldBuildOnSpecial(buildpos))
	}
	protected specialBuildReward(pos:number){
		let buildpos = this.game.getPossibleBuildPosInLineFrom(pos)
		if(buildpos.length===0) return this.game.rand.uniDist(0,0.5)

		let monopolypos = this.selectPosForMonopolyNoBuyout(buildpos)

		if (monopolypos !== -1) return 9999

		if(buildpos.some(p=>this.game.willBeMyColorMonopoly(p))) return this.game.rand.triDist(2,0.5)
		if(buildpos.some(p=>this.game.isMyLand(p) && this.game.is3Build(p))) return this.game.rand.triDist(1.6,0.5)
		if(buildpos.some(p=>this.game.isEmptyLand(p))) return this.game.rand.triDist(1.3,0.5)
		return this.game.rand.triDist(0.5, 0.5)
	}

	protected shouldBuildOnSpecial(list: number[]): boolean {
		let monopolypos = this.selectPosForMonopolyNoBuyout(list)

		if (monopolypos !== -1) return true
		if (this.myPlayer.money < 500000) return false

		for (const pos of list) {
			if (this.game.willBeMyColorMonopoly(pos)) return true

			if (this.game.isMyLand(pos) && this.game.is3Build(pos)) {
				if (this.game.mapName !== "water" && this.game.rand.randBool(2)) return true
			}
		}

		if (list.length === 0) return false

		if (this.getGoodSpecialSelectionFromPos(this.myPlayer.pos) !== -1) return false

		return true
	}
	protected getGoodSpecialSelectionFromPos(pos: number) {
		if(!this.game.canUseSpecial) return -1
		if (this.game.mapName === "god_hand") {
			return this.getGoodSpecialSelection(getSameLineTiles(pos), pos, "godhand_special_tile_lift")
		} else if (this.game.mapName === "water") {
			return this.getGoodSpecialSelection(this.game.getVaildWaterPumpTargets(pos), pos, "waterpump")
		} else if (this.game.mapName === "magicgarden") {
			return this.getGoodForceMoveSelection(pos).target
		}
		return -1
	}

	protected getGoodSpecialSelection(
		list: number[],
		sourcePos: number,
		source: string,
		requireSelection: boolean = false
	) {
		let _pos = -1
		let _maxreward = -Infinity
		if (!requireSelection && this.game.rand.randBool(5)) return -1

		try {
			const trySetMax = (newreward: number, newpos: number) => {
				if (newreward === 0) return
				newreward *= this.game.rand.triDist(1, 0.3)
				if (_maxreward <= newreward) {
					_pos = newpos
					_maxreward = newreward
				}
			}
			const has_guidebook = this.game.hasOneAbility(this.myturn, AbilityTags.GUIDEBOOK)
			const mostexpensive = this.game.mostExpensiveMyLandmark()

			if (source === "waterpump") {
				for (const pos of list) {
					let targetPos = pos
					let reward = 0

					let enemiesInRange = this.game.getOtherPlayersBetween(backwardBy(sourcePos, 2), targetPos).length

					if (enemiesInRange === 0 && !requireSelection) continue

					if (this.game.tileAt(targetPos).isBuildable) {
						if (this.game.tileAt(targetPos).isLandMark() && this.game.isMyLand(targetPos)) {
							reward = this.game.logToll(targetPos)
						} else if (this.game.is3Build(targetPos) && this.game.isMyLand(targetPos)) {
							reward = this.game.logToll(targetPos) * 5
						} else if (
							this.game.is3Build(targetPos) &&
							this.game.isEnemyLand(targetPos) &&
							this.hasEnoughMoneyForBuyout(targetPos)
						) {
							reward = this.game.logToll(targetPos) * 3
						} else if (!this.game.isEnemyLand(targetPos) && requireSelection) reward = 1
					}

					if (!this.game.isEnemyLand(targetPos) && has_guidebook) {
						if (mostexpensive !== -1) {
							reward += 1
							reward *= 2
							reward *= Math.max(1, enemiesInRange * 2) //make sure not to multiply by 0
						}

						trySetMax(reward, targetPos)
					} else if (requireSelection) {
						trySetMax(reward, targetPos)
					} else if (this.game.rand.randBool(2)) trySetMax(reward, targetPos)
				}
			}
			if (source === "godhand_special_tile_lift") {
				for (const pos of list) {
					let targetPos = backwardBy(pos, 1)
					let reward = 0
					if (
						this.game.tileAt(targetPos).isLandMark() && this.game.isMyLand(targetPos) && 
						(this.game.blackholepos !== targetPos || requireSelection) &&
						(this.game.countPlayersNearby(targetPos, 0, this.game.rand.randInt(4) + 6) > 0  || requireSelection)
					) {
						reward = this.game.logToll(targetPos)
						if (targetPos < sourcePos) reward *= 1.2 //현재위치보다 뒤에 세울경우
						//else if (this.game.hasOneAbility(this.myturn, AbilityTags.LANDMARK_PULLS)) reward *= 1.5
						trySetMax(reward, pos)
					}

					if (
						this.game.blackholepos === targetPos &&
						this.game.isMyLand(this.game.whiteholepos) &&
						(requireSelection || this.game.rand.randBool(1))
					) {
						reward = this.game.logToll(targetPos)
						trySetMax(reward, pos)
					}
					if (
						targetPos === sourcePos &&
						has_guidebook &&
						this.myPlayer.doubles === 0 &&
						this.game.countPlayersNearby(targetPos, 0, this.game.rand.randInt(4) + 4) > 0  &&
						(requireSelection || !this.game.rand.randBool(3))
					) {
						// 2/3 prob

						if (mostexpensive !== -1) {
							reward = this.game.logToll(targetPos) * this.game.rand.triDist(1.5, 0.5)
							trySetMax(reward, pos)
						}
					}
				}
			}
			if (_maxreward < 2 && !requireSelection) return -1

			return _pos
		} catch (e) {
			Logger.error("", e)
			return _pos
		}
	}

	protected chooseSpecial(req: sm.TileSelection): Promise<cm.SelectTile> {
		let choices = new TileChoice().generateNoCancel(req)

		var pos = this.getGoodSpecialSelection(
			choices.map((c) => c.pos),
			this.myPlayer.pos,
			req.source,
			true
		)
		return this.wrap({ pos: pos, name: req.source, result: pos !== -1 })
	}
	chooseLandSwap(mylands: number[], enemyLands: number[]): Promise<cm.SelectLandSwap> {
	
		let mymonopolypos = [...this.myPlayer.monopolyChancePos.entries()].filter((p) => enemyLands.includes(p[0]))

		//독점찬스 없으면
		if (mymonopolypos.length === 0) {
			return this.chooseLandSwapNoMonopolyAlert(mylands, enemyLands)
		}

		//check best monopolies first
		mymonopolypos.sort((a, b) => b[1] - a[1])

		let currentlands = this.game.myLands()
		for (const toTake of mymonopolypos) {
			for (const toGive of mylands) {
				//변경 후에 독점자리 유지할수 있는지 체크
				if (this.game.canMakeMonopolyAfterSwap(toGive, toTake[0], currentlands)) {
					return this.wrap({ result: true, enemyLand: toTake[0], myland: toGive })
				}
			}
		}

		return this.chooseLandSwapNoMonopolyAlert(mylands, enemyLands)
	}
	protected chooseLandSwapNoMonopolyAlert(mylands: number[], enemyLands: number[]): Promise<cm.SelectLandSwap> {
		let enemymonopolyalerts = this.game.getEnemyMonopolyAlerts()

		let vaildMyLands = mylands.filter((p) => enemymonopolyalerts.some((a) => a.pos === p))
		if (vaildMyLands.length === 0) return this.wrap({ result: false, enemyLand: -1, myland: -1 })

		return this.wrap({ result: false, enemyLand: -1, myland: -1 })
	}
	protected getGoodForceMoveSelection(mypos: number, requireSelection: boolean = false): ForceMoveSelection {
		//playerposition,targetpos,reward
		let enemypos = this.game.enemyPos()
		const landmark = this.game.mostExpensiveMyLandmark()
		const has_guidebook = this.game.hasOneAbility(this.myturn, AbilityTags.GUIDEBOOK) && landmark !== -1
		let _pos = -1
		let _targetPos = -1
		let _maxreward = -Infinity
		const trySetMax = (newreward: number, newpos: number, newTargetpos: number) => {
			if (newreward === 0) return
			newreward *= this.game.rand.triDist(1, 0.3)
			if (_maxreward <= newreward) {
				_pos = newpos
				_targetPos = newTargetpos
				_maxreward = newreward
			}
		}

		//가장 비싼 내땅 통행료
		const maxLandmarkToll = landmark !== -1 ? this.game.logToll(landmark) : 0

		if (!requireSelection) {
			if (maxLandmarkToll < this.game.rand.uniDist(2.1, 3)) return { reward: 0, target: -1, targetPos: -1 }
		} else if (maxLandmarkToll < 2) {
			//자신 이동
			let candidates = range(12, 2).map((d) => (mypos + d) % MAP_SIZE)
			let pos = this.selectMovePos(
				candidates.map((p) => {
					return { pos: p, name: "", result: true }
				}),null,true
			)
			return { reward: pos.reward, target: mypos, targetPos: pos.pos }
		}

		//적  : 내 랜마 혹은 나(잘가북시)
		//적+나(잘가북) : 1. 내 3건 혹은 2. 내 랜마 혹은 3. 적땅,포춘카드 제외 모든땅
		//적+나(잘가북x): 내 랜마
		for (const p of new Set(enemypos)) {
			const enemyCount = this.game.getEnemiesAt(p).length
			for (const dist of range(12, 2)) {
				const target = forwardBy(p, dist)
				const diceUtility = ((5 - Math.abs(7-dist))/5) * 0.2 + 0.9 //2,12: 0.9,  7: 1.1
				const ismylandmark = this.game.isMyLand(target) && this.game.landAt(target).isLandMark() && this.game.blackholepos !== target

				if (mypos === p) {
					//블랙홀 있는곳은 자신이동 안함
					if (this.game.blackholepos === target && this.game.isEnemyLand(this.game.whiteholepos)) {
						continue
					}
					//적+나(잘가북) : 1. 내 3건 혹은 2. 내 랜마 혹은 3. 적땅,포춘카드 제외 모든땅
					if (has_guidebook) {
						//내 3건
						if (this.game.is3Build(target) && this.game.isMyLand(target)) {
							//잘가북으로 날릴곳 존재
							if (landmark !== -1) trySetMax(maxLandmarkToll * enemyCount * diceUtility, p, target)
							else trySetMax((this.game.logToll(target) + 1) * enemyCount * diceUtility, p, target) //날릴곳 없을경우 3건땅 통행료 사용
						} else if (ismylandmark && landmark !== -1) {
							trySetMax(maxLandmarkToll * enemyCount * diceUtility, p, target)
						} else if (!this.game.isEnemyLand(target)) {
							trySetMax(this.game.rand.triDist(1, 0.5), p, target)
						}
					} else if (ismylandmark) {
						//적+나(잘가북x): 내 랜마
						trySetMax(this.game.logToll(target) * enemyCount * diceUtility, p, target)
					}
				} else {

					//적  : 내 랜마 혹은 나(잘가북시)
					if (has_guidebook && landmark !== -1 && target === mypos) {
						//잘가북으로 날릴곳 존재
						trySetMax(maxLandmarkToll  * enemyCount * diceUtility, p, target)
					} else if(ismylandmark){
						trySetMax(this.game.logToll(target) * enemyCount * diceUtility, p, target)
					}
				}
			}
		}
		if (_maxreward < 2.5 && !requireSelection) return { reward: 0, target: -1, targetPos: -1 }
		//if(requireSelection) console.log(_maxreward)
		return { reward: _maxreward, target: _pos, targetPos: _targetPos }
	}

	chooseForcemove(playerPos: number[]): Promise<cm.SelectForcemove> {
		try{
			let selection = this.getGoodForceMoveSelection(this.myPlayer.pos, true)
			console.log(selection)

			if (selection.target === -1 || !playerPos.includes(selection.target)) {
				return this.wrap({ result: false, targetDice: 2, oddeven: 0, playerPos: -1 })
			}

			let oddeven = 0
			let distance = forwardDistance(selection.target, selection.targetPos)
			if (selection.reward > 5) oddeven = distance % 2 === 1 ? 1 : 2

			if(distance<2 || distance>12) {
				Logger.err(`invaild forcemove distance. from ${selection.target} to ${selection.targetPos}`)
				return this.wrap({ result: false, targetDice: 2, oddeven: 0, playerPos: -1 })
			}


			return this.wrap({ result: true, targetDice: distance, oddeven: oddeven, playerPos: selection.target })
		}
		catch(e){
			Logger.error("",e)
			console.log(new Error().stack)
			return this.wrap({ result: false, targetDice: 2, oddeven: 0, playerPos: -1 })
		}
		
	}
}
