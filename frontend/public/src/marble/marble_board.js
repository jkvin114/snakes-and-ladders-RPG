import { Board } from "./../game/board.js"
const TILE_IMG_SIZE = 100
const BUILDING_IMG_SIZE = 100
const PLAYER_POS_DIFF = [
	[8, 9],
	[-17, 2],
	[6, -5],
	[-12, -9],
]
const sleep = (m) => new Promise((r) => setTimeout(r, m))

export const COLORS = ["red", "blue", "green", "yellow"]
export const COLORS_LIGHT = ["#F1959B", "#7879FF", "#83D475", "#FFED73"]

const HOUSE_SCALE = 0.6
const LANDMARK_SCALE = 1.2
const FLAG_SCALE = 0.8
/**
 * up
 * -60,50
 * right
 * 120,-10
 * down
 * -60,50
 * left
 * (landmark): 0,-50
 */

function getFlagCoord(coordinate) {
	if (coordinate.rot === "right") {
		return { x: coordinate.x + 30, y: coordinate.y - 20 }
	}
	if (coordinate.rot === "left") {
		return { x: coordinate.x + 30, y: coordinate.y - 10 }
	}
	if (coordinate.rot === "up") {
		return { x: coordinate.x - 60 + 30, y: coordinate.y + 10 - 25 }
	}
	if (coordinate.rot === "down") {
		return { x: coordinate.x - 15, y: coordinate.y - 15 }
	}
	return null
}
function getHouseCoord(coordinate, level) {
	level -= 2
	if (coordinate.rot === "right") {
		return { x: coordinate.x + 30 - level * 25, y: coordinate.y - level * 14 }
	}
	if (coordinate.rot === "left") {
		return { x: coordinate.x + 30 - level * 25, y: coordinate.y - level * 16 }
	}
	if (coordinate.rot === "up") {
		return { x: coordinate.x - 30 + 8 + level * 25, y: coordinate.y - level * 14 - 8 }
	}
	if (coordinate.rot === "down") {
		return { x: coordinate.x - 30 - level * 25 + 5, y: coordinate.y + level * 14 - 10 }
	}
	return null
}
function getLandMarkCoord(coordinate) {
	if (coordinate.rot === "right") {
		return { x: coordinate.x + 20, y: coordinate.y + 5 - 20 }
	}
	if (coordinate.rot === "left") {
		return { x: coordinate.x + 20, y: coordinate.y + 5 - 25 }
	}
	if (coordinate.rot === "up") {
		return { x: coordinate.x - 40, y: coordinate.y + 10 - 35 }
	}
	if (coordinate.rot === "down") {
		return { x: coordinate.x - 10 - 20, y: coordinate.y - 40 + 25 }
	}
	return null
}
function getLandNameCoord(coordinate) {
	if (coordinate.rot === "right") {
		return { x: coordinate.x - 15, y: coordinate.y - 20 }
	}
	if (coordinate.rot === "left") {
		return { x: coordinate.x - 5, y: coordinate.y - 20 }
	}
	if (coordinate.rot === "up") {
		return { x: coordinate.x + 5, y: coordinate.y }
	}
	if (coordinate.rot === "down") {
		return { x: coordinate.x, y: coordinate.y + 10 }
	}
	if (coordinate.rot === "center") {
		return { x: coordinate.x + 10, y: coordinate.y + 20 }
	}
	return null
}
function getCenterCoord(coordinate) {
	if (coordinate.rot === "right") {
		return { x: coordinate.x + 6, y: coordinate.y - 5 }
	}
	if (coordinate.rot === "left") {
		return { x: coordinate.x - 6, y: coordinate.y - 5 }
	}
	if (coordinate.rot === "up") {
		return { x: coordinate.x - 5, y: coordinate.y }
	}
	if (coordinate.rot === "down") {
		return { x: coordinate.x - 3, y: coordinate.y + 10 }
	}
	if (coordinate.rot === "center") {
		return { x: coordinate.x + 10, y: coordinate.y - 5 }
	}
	return null
}
function getLandTollCoord(coordinate) {
	if (coordinate.rot === "right") {
		return { x: coordinate.x - 15, y: coordinate.y + 10 }
	}
	if (coordinate.rot === "left") {
		return { x: coordinate.x - 5, y: coordinate.y + 10 }
	}
	if (coordinate.rot === "up") {
		return { x: coordinate.x + 5, y: coordinate.y + 30 }
	}
	if (coordinate.rot === "down") {
		return { x: coordinate.x, y: coordinate.y + 35 }
	}
	return null
}
function getAngle(rot) {
	if (rot === "right") {
		return 270
	}
	if (rot === "left") {
		return 90
	}
	if (rot === "up") {
		return 180
	}
	if (rot === "down") {
		return 0
	}
	return 0
}

const rt2 = Math.sqrt(2)
function rotate(coord) {
	const center = { x: 700, y: 450 }
	const yscale = 0.6

	let x = coord.x / rt2 + coord.y / rt2 + 700 - 575 * rt2
	let y = -coord.x / rt2 + coord.y / rt2 + 125 * rt2 + 450

	if (y < center.y) y = center.y - (center.y - y) * yscale
	else y = center.y + (y - center.y) * yscale

	return { x: x + 60, y: y - 120, rot: coord.rot }
}

export function moneyToString(money, zero) {
	money = Math.floor(money)
	if (money <= 0) {
		if (!zero) return "0"
		else return zero
	}
	if (money < 10000) {
		return String(money)
	} else if (money >= 10000 && money < 100000) {
		let t = Math.floor(money / 10000)
		return String(t) + "만 " + (money % 10000 === 0 ? "" : String(money - t * 10000))
	} else if (money >= 10 * 10000 && money < 10000 * 10000) {
		return String(Math.floor(money / 10000)) + "만"
	} else if (money >= 10000 * 10000 && money < 10 * 10000 * 10000) {
		let t = Math.floor(money / (10000 * 10000))
		return (
			String(t) + "억 " + (money % 100000000 === 0 ? "" : String(Math.floor((money - t * 100000000) / 10000)) + "만")
		)
	} else {
		return String(Math.floor(money / 100000000)) + "억"
	}
}
function getCornerPos(uiPos, boardsize) {
	//"top-left", "bottom-left", "top-right", "bottom-right"
	//console.log("uipos" + uiPos)
	if (uiPos === -1) return { x: boardsize / 2, y: 0 }
	if (uiPos === 0) return { x: 0, y: 0 }
	if (uiPos === 1) return { x: 0, y: boardsize }
	if (uiPos === 2) return { x: boardsize, y: 0 }
	if (uiPos === 3) return { x: boardsize, y: boardsize }
	return { x: 0, y: 0 }
}
export const MONOPOLY = ["", "트리플 독점", "라인 독점", "관광지 독점"]
class Tile {
	constructor(name, pos, type, coord) {
		this.coordinate = coord
		this.type = type
		this.originalName = name
		this.multiplier = 1
		this.toll = 0
		this.pos = pos
		this.color = -1
		this.olympic = false
		this.festival = false
		this.owner = -1
		this.builds = [false, false, false, false, false] //land, house1,house2,house3,landmark
	}
	setColor(c) {
		this.color = c
		return this
	}
	hasOnlyLand() {
		return this.builds[0] && !this.builds[1] && !this.builds[2] && !this.builds[3] && !this.builds[4]
	}
	hasLandMark() {
		return this.builds[4]
	}
	clear() {
		this.multiplier = 1
		this.toll = 0
		this.owner = -1
		this.olympic = false
		this.builds = [false, false, false, false, false]
	}
	setOwner(owner) {
		this.owner = owner
	}
}
class TileObject {
	constructor(tiledata, tileimage) {
		this.data = tiledata
		this.tile = tileimage
		this.nameIndicator
		this.type = "nonbuildable"
		this.decorator
		this.effectOverlay
		this.blocker
	}
	setLandFlag(flagobj) {}
	setHouse(houseobj, num) {}
	setLandMark(landmarkObj) {}
	onTileLift() {
		if (this.nameIndicator) this.nameIndicator.bringToFront()
		if (this.decorator) this.decorator.bringToFront()
		if (this.effectOverlay) this.effectOverlay.bringToFront()
		if (this.blocker) this.blocker.bringToFront()
	}
	setOwner(owner) {
		this.data.owner = owner
	}
	setNameIndicator(name) {
		this.nameIndicator = name
	}
	setTollIndicator(toll) {}
	setDecorator(deco) {
		this.decorator = deco
		deco.bringToFront()
		return this
	}
	addBlocker(blocker) {
		this.blocker = blocker
		blocker.bringToFront()
	}
	removeBlocker() {
		this.blocker = null
	}
	changeToll(toll) {}
	clear() {}
}
class BuildableTileObject extends TileObject {
	constructor(tiledata, tile) {
		super(tiledata, tile)
		this.buildings = [null, null, null, null, null]
		this.tollIndicator
		this.type = "buildable"
	}
	setLandFlag(flagobj) {
		this.buildings[0] = flagobj
		if (!flagobj) this.data.builds[0] = false
		else this.data.builds[0] = true
	}
	setHouse(houseobj, level) {
		this.buildings[level] = houseobj
		if (!houseobj) this.data.builds[level] = false
		else {
			this.data.builds[0] = true
			this.data.builds[level] = true
		}
	}
	setLandMark(landmarkObj) {
		this.buildings[4] = landmarkObj
		if (!landmarkObj) this.data.builds[4] = false
		else {
			for (let i = 0; i < this.data.builds.length; ++i) {
				this.data.builds[i] = true
			}
		}
	}
	setTollIndicator(toll) {
		this.tollIndicator = toll
	}
	onTileLift() {
		super.onTileLift()
		if (this.tollIndicator) this.tollIndicator.bringToFront()

		for (let b of this.buildings) {
			if (!b) continue
			b.bringToFront()
		}
	}
	changeToll(toll) {
		if (this.tollIndicator) {
			if (toll.length <= 3) {
				this.tollIndicator.set({ text: toll, fontSize: 24 })
			} else {
				this.tollIndicator.set({ text: toll, fontSize: 18 })
			}
		}
	}
	clear() {
		this.tollIndicator.set({ text: "" })
		this.data.clear()

		this.buildings = [null, null, null, null, null]
	}
}

export class Player {
	constructor(turn, color, char, name, team) {
		this.pos = 0
		this.turn = turn
		this.color = COLORS[color]
		this.money = 0
		this.name = name
		this.team = team
		this.char = char
		this.retired = false

		this.playerimg
		this.nametext
		this.retired = false
		this.bubble = null
	}
	setBubble(img) {
		this.bubble = img
	}
	setObjects(player, name) {
		this.playerimg = player
		this.nametext = name
	}
	updateNameText(text) {
		if (this.nametext) this.nametext.set({ text: text })
	}
	setOpacity(isOpaque) {
		if (this.nametext) this.playerimg.set({ opacity: isOpaque ? 1 : 0.6 })
	}
}

class Money {
	/**
	 *
	 * @param {*} scene
	 * @param {*} source 플레이어 ui 위치
	 * @param {*} dest 플레이어 ui 위치
	 */
	constructor(scene, source, dest) {
		this.scene = scene
		this.source = source
		this.dest = dest
		this.image
	}
	spawnImage() {
		let image = new fabric.Image(document.getElementById("moneyimg"), {
			objectCaching: false,
			evented: false,
		})
		this.scene.lockFabricObject(image)

		let coord = getCornerPos(this.source, this.scene.boardInnerHeight)
		image.scale(1.8)
		image.set({ top: coord.y, left: coord.x })
		this.scene.canvas.add(image)
		image.bringToFront()
		this.image = image
	}
	animate1(size) {
		let randRange = 75
		if (size > 7) randRange = 150
		if (!this.image) return
		this.scene.animateX(this.image, this.scene.boardInnerWidth / 2 + (Math.random() * randRange - randRange / 2), 200)
		this.scene.animateY(this.image, this.scene.boardInnerHeight / 2 + (Math.random() * randRange - randRange / 2), 200)
	}
	animate2() {
		if (!this.image) return
		let coord = getCornerPos(this.dest, this.scene.boardInnerHeight)
		this.scene.animateX(this.image, coord.x, 200)
		this.scene.animateY(this.image, coord.y, 200)
	}
	remove() {
		this.scene.canvas.remove(this.image)
	}
}

class MapFeature {
	constructor(name) {
		this.name = name
		this.image = null
		this.pos = -1
	}
	liftIfLocatedAt(pos) {
		if (this.pos === pos && this.image != null) {
			this.image.bringToFront()
		}
	}
}

export class MarbleScene extends Board {
	constructor(game) {
		super(game)
		this.tileData = new Map() //number -> Tile
		this.tileObj = new Map() //number -> TileObject
		this.tileHighlights = new Map() // string => TileHghlightImage[]
		this.tileHighlights.set("red", [])
		this.tileHighlights.set("yellow", [])
		this.tileHighlights.set("white", [])
		this.olympic = -1
		this.moneyText
		this.moneyTextTimeout
		this.blackhole = new MapFeature("blackhole")
		this.whitehole = new MapFeature("whitehole")
		this.lock = new MapFeature("lock")
		this.tilegroup
		this.tileoutergroup

		this.tilegroup_copy
		this.tileoutergroup_copy
		this.tileshadow

		this.copiedtiles
	}
	getCoord(i) {
		return rotate(this.coordinates[i % this.mapLength()])
	}
	getUnrotatedCoord(i) {
		return this.coordinates[i % this.mapLength()]
	}
	getNameAt(pos) {
		return this.tileData.get(pos).originalName
	}
	setBoardScale() {
		const winwidth = window.innerWidth
		const winheight = window.innerHeight

		this.boardScale = (winheight - 5) / this.boardInnerHeight
		this.canvas.setWidth(winheight - 5 + 500)
		this.canvas.setHeight(winheight - 5)
		this.canvas.setZoom(this.boardScale)
		//   this.forceRender()

		$("#canvas-container").css("width", winwidth * 2)
		$("#canvas-container").css("height", winheight * 2)
		document.getElementById("canvas-container").scrollTo(400, 400)
	}

	createTileGroup(tileobj, ...deco) {
		let tilegroup = new fabric.Group([tileobj, ...deco], { evented: false })
		this.lockFabricObject(tilegroup)
		this.canvas.add(tilegroup)
		// tilegroup.set({ originX: "center", originY: "center" })
		return tilegroup
	}
	enableDebugFabricGroup() {
		// fabricjs group - always show border
		fabric.Group.prototype.initialize = (function (initialize) {
			return function () {
				initialize.apply(this, arguments)
				// prepend rect before=behind group objects
				this._objects = [
					new fabric.Rect({
						// position from group center
						left: -0.5 * this.width,
						top: -0.5 * this.height,
						width: this.width,
						height: this.height,

						stroke: "red",
						strokeWidth: 2,
						fill: false,
					}),
				].concat(this._objects)

				// TODO repaint border on group resize event

				// TODO remove border on group destroy
			}
		})(fabric.Group.prototype.initialize)
	}

	drawTiles() {
		const center = { x: 476, y: 487 }
		let tileobjects = []
		for (const land of this.Map.lands) {
			let rotatedPos = this.getUnrotatedCoord(land.pos)
			let tile = new Tile(land.name, land.pos, "land", rotatedPos).setColor(land.color)
			this.tileData.set(land.pos, tile)
			let tileobj = this.getTileOf(land.color, rotatedPos)

			this.canvas.add(tileobj)

			let name = this.getTileTextObj(
				land.name,
				getLandNameCoord(this.getUnrotatedCoord(land.pos)),
				land.name.length > 3 ? 14 : 22
			)
			let toll = this.getTileTextObj("", getLandTollCoord(this.getUnrotatedCoord(land.pos)), 18)

			const group = this.createTileGroup(tileobj, name, toll)
			let obj = new BuildableTileObject(tile, group)
			obj.setNameIndicator(name)
			obj.setTollIndicator(toll)

			this.tileObj.set(land.pos, obj)

			tileobjects.push(group)

			//tileobjects_copy[land.pos] = fabric.util.object.clone(group)
		}

		for (const sight of this.Map.sights) {
			let rotatedPos = this.getUnrotatedCoord(sight.pos)
			let tile = new Tile(sight.name, sight.pos, "sight", rotatedPos)
			this.tileData.set(sight.pos, tile)
			let tileobj = this.getTileOf(sight.type === "blue" ? 4 : 5, rotatedPos)
			this.canvas.add(tileobj)

			let name = this.getTileTextObj(
				sight.name,
				getLandNameCoord(this.getUnrotatedCoord(sight.pos)),
				sight.name.length > 3 ? 14 : 22
			)
			let toll = this.getTileTextObj("", getLandTollCoord(this.getUnrotatedCoord(sight.pos)), 18)

			const group = this.createTileGroup(tileobj, name, toll)

			let obj = new BuildableTileObject(tile, group)
			obj.setNameIndicator(name)
			obj.setTollIndicator(toll)

			this.tileObj.set(sight.pos, obj)
			tileobjects.push(group)
		}

		for (const sp of this.Map.specials) {
			let tile = new Tile("특수 지역", sp, "special", this.getUnrotatedCoord(sp))
			this.tileData.set(sp, tile)

			let tileobj = this.getTileOf(12, this.getUnrotatedCoord(sp))
			let coord = this.getUnrotatedCoord(sp)
			this.canvas.add(tileobj)

			let pos = getCenterCoord(coord)
			let column = this.getDecorator("tile_column", pos, getAngle(coord.rot), 1.1, 1)
			const group = this.createTileGroup(tileobj, column)
			this.tileObj.set(sp, new TileObject(tile, group).setDecorator(column))
			tileobjects.push(group)
		}

		for (const cn of this.Map.corners) {
			let tile
			let deco
			let coord = this.getUnrotatedCoord(cn)
			let pos = getCenterCoord(coord)

			if (cn === this.Map.start) {
				tile = new Tile(this.Map.corner_names.start, cn, "corner", this.getUnrotatedCoord(cn))
				deco = this.getDecorator("tile_start", pos, 0, 0.7, 0.6)
			}
			if (cn === this.Map.island) {
				tile = new Tile(this.Map.corner_names.island, cn, "corner", this.getUnrotatedCoord(cn))
				deco = this.getDecorator("tile_island", pos, 0, 0.7, 0.6)
			}
			if (cn === this.Map.olympic) {
				tile = new Tile(this.Map.corner_names.olympic, cn, "corner", this.getUnrotatedCoord(cn))
				deco = this.getDecorator("tile_olympic", pos, 0, 0.7, 1)
			}
			if (cn === this.Map.travel) {
				tile = new Tile(this.Map.corner_names.travel, cn, "corner", this.getUnrotatedCoord(cn))
				deco = this.getDecorator("tile_travel", pos, 0, 0.7, 0.7)
			}
			if (!tile) continue
			this.tileData.set(cn, tile)
			let tileobj = this.getTileOf(11, this.getUnrotatedCoord(cn))
			tileobj.set({ left: coord.x + 20, top: coord.y + 20 })
			deco.set({ left: deco.left + 20, top: deco.top + 20 })

			this.canvas.add(tileobj)
			let name = this.getTileTextObj(tile.originalName, getLandNameCoord(this.getUnrotatedCoord(cn)), 27, "#404040")
			name.set({ left: name.left + 20, top: name.top + 20 })

			const group = this.createTileGroup(tileobj, deco, name)
			name.moveTo(2)
			let obj = new TileObject(tile, group)
			if (deco != null) obj.setDecorator(deco)
			obj.setNameIndicator(name)
			this.tileObj.set(cn, obj)
			tileobjects.push(group)
		}

		for (const cd of this.Map.cards) {
			let tile = new Tile("포춘 카드", cd, "card", this.getUnrotatedCoord(cd))
			this.tileData.set(cd, tile)

			let coord = this.getUnrotatedCoord(cd)

			let tileobj = this.getTileOf(13, coord)

			let pos = getCenterCoord(coord)

			this.canvas.add(tileobj)
			let deco = this.getDecorator("tile_card", pos, getAngle(coord.rot), 1.2, 0.7)

			const group = this.createTileGroup(tileobj, deco)
			this.tileObj.set(cd, new TileObject(tile, group).setDecorator(deco))
			tileobjects.push(group)
		}
		for (let i = 0; i < this.mapLength(); ++i) {
			this.tiles.push(this.tileObj.get(i).tile)
		}
		// let tileshadows=[]
		// for(let i=0;i<32;++i){
		//     tileshadows.push(this.tileShadowLarge(i))
		// }
		// let tileshadowgroup = new fabric.Group(tileshadows, { evented: false })

		// // this.lockFabricObject(tileshadowgroup)
		// this.canvas.add(tileshadowgroup)
		// this.tile_shadows = tileshadowgroup'
		//	this.enableDebugFabricGroup()

		this.tilegroup = new fabric.Group(tileobjects, { evented: false })
		this.lockFabricObject(this.tilegroup)
		this.canvas.add(this.tilegroup)
		this.tilegroup.set({ left: 700, top: 450 })
		this.tilegroup.set({ originX: "center", originY: "center", angle: -45 })

		this.tileoutergroup = new fabric.Group([this.tilegroup], { evented: false })
		this.lockFabricObject(this.tileoutergroup)
		this.canvas.add(this.tileoutergroup)
		this.tileoutergroup.set({ originX: "center", originY: "center" })
		this.tileoutergroup.set({ left: 700, top: 450, scaleY: 0.6 })

		// for (let i = 0; i < this.mapLength(); ++i) {
		// 	this.tiles[i].cloneAsImage((image) => {
		// 		this.canvas.add(image)
		// 		this.copiedtiles.push(image)
		// 	})
		// }

		this.tileoutergroup.cloneAsImage((image) => {
			image.set({ left: 700, top: 450, originX: "center", originY: "center", evented: false })
			this.lockFabricObject(image)
			this.canvas.add(image)
			this.copiedtiles = image
			this.copiedtiles.sendToBack()
		})
		for (let i = 0; i < this.mapLength(); ++i) {}
		// this.tilegroup_copy = new fabric.Group(tileobjects_copy, { evented: false })
		// this.lockFabricObject(this.tilegroup_copy)
		// this.canvas.add(this.tilegroup_copy)
		// this.tilegroup_copy.set({ left: 700, top: 450 })
		// this.tilegroup_copy.set({ originX: "center", originY: "center", angle: -45 })

		// this.tileoutergroup_copy = new fabric.Group([this.tilegroup_copy], { evented: false })
		// this.lockFabricObject(this.tileoutergroup_copy)
		// this.canvas.add(this.tileoutergroup_copy)
		// this.tileoutergroup_copy.set({ originX: "center", originY: "center" })
		// this.tileoutergroup_copy.set({ left: 700, top: 450, scaleY: 0.6 })

		// for (const tileobj of this.tilegroup_copy._objects) {
		// 	tileobj.set({ visible: false })
		// }
	}

	showObjects() {
		super.showObjects()

		for (let i = 0; i < this.game.playerCount; ++i) {
			//	console.log("addplayer")
			let img = document.getElementById("playerimg" + (this.players[i].char + 1))
			let player = this.players[i]

			let p = new fabric.Image(img, {
				id: "player",
				left: this.getCoord(0).x + PLAYER_POS_DIFF[i][0],
				top: this.getCoord(0).y + PLAYER_POS_DIFF[i][1],
				objectCaching: false,
				evented: false,
				opacity: 1,
			})
			this.lockFabricObject(p)
			this.canvas.add(p.scale(0.5))

			let name = new fabric.Text("", {
				fontSize: 20,
				fill: "white",
				opacity: 1,
				evented: false,
				textBackgroundColor: "black",
				opacity: 0.8,
				left: this.getCoord(0).x + PLAYER_POS_DIFF[i][0],
				top: this.getCoord(0).y + PLAYER_POS_DIFF[i][1] - 50,
				fontFamily: "nanumB",
			})
			this.lockFabricObject(name)
			this.canvas.add(name)
			name.bringToFront()

			player.setObjects(p, name)
		}
		let text = new fabric.Text("", {
			fontSize: 50,
			fill: "white",
			stroke: "black",
			strokeWidth: 1,
			opacity: 0,
			fontWeight: "bold",
			evented: false,
			top: this.boardInnerHeight / 2 + 160,
			left: this.boardInnerWidth / 2,
			fontFamily: "nanumEB",
		})
		this.lockFabricObject(text)
		this.canvas.add(text)
		this.moneyText = text

		let blackhole = new fabric.Image(document.getElementById("blackholeimg"), {
			objectCaching: false,
			evented: false,
			opacity: 0.8,
			visible: false,
			scaleX: 0.75,
			scaleY: 0.4,
		})
		//blackhole.scale(0.75)
		this.lockFabricObject(blackhole)
		this.canvas.add(blackhole)
		this.blackhole.image = blackhole

		let whitehole = new fabric.Image(document.getElementById("whiteholeimg"), {
			objectCaching: false,
			evented: false,
			opacity: 0.8,
			visible: false,
			scaleX: 0.75,
			scaleY: 0.4,
		})
		//	whitehole.scale(0.75)
		this.lockFabricObject(whitehole)
		this.canvas.add(whitehole)
		this.whitehole.image = whitehole

		let lock = new fabric.Image(document.getElementById("lockimg"), {
			objectCaching: false,
			evented: false,
			visible: false,
		})
		lock.scale(0.8)
		this.lockFabricObject(lock)
		this.canvas.add(lock)
		this.lock.image = lock
	}
	async showDefenceIndicator(type, pos) {
		//	console.log("showDefenceIndicator" + type)
		let image = "indicateblock"
		let lightimage = "indicatelight"
		let coord = this.getCoord(pos)
		let y = coord.y - 70
		switch (type) {
			case "angel":
				image = "indicateangel"
				break
			case "discount":
				image = "indicatediscount"
				break
			case "change":
				image = "indicatechange"
				break
			case "selloff":
				image = "indicateselloff"
				lightimage = "indicatelight_yellow"
				break
			case "attack":
				image = "indicateattack"
				lightimage = "indicatelight_yellow"
				break
		}

		let p = new fabric.Image(document.getElementById(image), {
			left: coord.x,
			top: y,
			objectCaching: false,
			evented: false,
			opacity: 1,
		})
		let light = new fabric.Image(document.getElementById(lightimage), {
			left: coord.x,
			top: y,
			objectCaching: false,
			evented: false,
			opacity: 1,
		})
		this.lockFabricObject(p)
		this.canvas.add(p.scale(0.8))
		this.lockFabricObject(light)
		this.canvas.add(light.scale(0.8))
		this.render()
		p.bringToFront()
		light.bringToFront()
		this.animateAngle(light, 1000, 2500)
		await sleep(1000)

		this.animateOpacity(light, 0, 1000)
		this.animateOpacity(p, 0, 1000)
		this.removeImageAfter(light, 1500)
		this.removeImageAfter(p, 1500)
	}
	showMessage(type, pos) {
		let colorstop = ["black", "white"]
		let str = ""
		let coord = this.getCoord(pos)
		let y = coord.y - 50
		let fontsize = 50
		switch (type) {
			case "landmark":
				colorstop = ["#7FE2EB", "#3AA8CF"]
				str = "랜드마크"
				y -= 20
				break
			case "olympic":
				colorstop = ["#7FE2EB", "#3AA8CF"]
				str = "올림픽"
				break
			case "colormonopoly":
				colorstop = ["#7FE2EB", "#3AA8CF"]
				str = "컬러독점"
				break
			case "blackhole":
				colorstop = ["#7FE2EB", "#3AA8CF"]
				str = "블랙홀 발생"
				break
			case "whitehole":
				colorstop = ["#7FE2EB", "#3AA8CF"]
				str = "화이트홀 발생"
				break
			case "root":
				colorstop = ["#FFFFFF", "#fffbbd"]
				str = "속박"
				break
			case "toll_increase":
				colorstop = ["#F6E33E", "#F5AC12"]
				str = "통행료 증가!"
				y -= 40
				break
			case "lock":
				colorstop = ["#7FE2EB", "#3AA8CF"]
				str = "배수잠금"
				break
		}

		let text = new fabric.Text(str, {
			fontSize: fontsize,
			fill: "white",
			opacity: 0,
			evented: false,
			top: y,
			left: coord.x,
			fontWeight: "bold",
			fontFamily: "CookierunBlack",
			stroke: "black",
			strokeWidth: 2,
			scaleX: 0.2,
			scaleY: 0.2,
		})
		text.setGradient("fill", {
			y1: 0,
			x1: 0,
			x2: 0,
			y2: 40,
			colorStops: {
				0: colorstop[0],
				1: colorstop[1],
			},
		})
		this.lockFabricObject(text)
		this.canvas.add(text)
		text.bringToFront()
		this.render()
		this.animateScaleX(text, 1, 400)
		this.animateScaleY(text, 1, 400)
		this.animateOpacity(text, 1, 400)
		this.removeImageAfter(text, 1500)
	}

	scaleTileImage(tile, rot) {
		switch (rot) {
			case "center":
				tile.scale(1.5)
				tile.set({ flipX: true })
				break
			case "right":
				tile.set({ scaleX: 1.3, flipX: true })
				break
			case "left":
				tile.set({ scaleX: 1.3, flipX: true })
				break
			case "up":
				tile.set({ scaleY: 1.3, flipX: true })
				break
			case "down":
				tile.set({ scaleY: 1.3, flipX: true })
				break
		}
	}
	getTileOf(tile_color, coord) {
		let tile = new fabric.Image(document.getElementById("marble_tileimg"), {
			originX: "center",
			originY: "center",
			width: TILE_IMG_SIZE,
			height: TILE_IMG_SIZE,
			cropX: TILE_IMG_SIZE * tile_color,
			cropY: 0,
			objectCaching: false,
			evented: false,

			// top: coord.y,
			// left: coord.x
		})
		this.lockFabricObject(tile)
		tile.set({ top: coord.y, left: coord.x })
		this.scaleTileImage(tile, coord.rot)

		return tile
	}
	getDecorator(imageid, pos, angle, scale, opacity) {
		let deco = new fabric.Image(document.getElementById(imageid), {
			originX: "center",
			originY: "center",
			objectCaching: false,
			evented: false,
			angle: angle,
			opacity: opacity,
		})

		this.lockFabricObject(deco)

		deco.set({ top: pos.y, left: pos.x })
		deco.scale(scale)
		this.canvas.add(deco)

		return deco
	}

	getShine(coord) {
		const image = document.getElementById("shine")
		let tile = new fabric.Image(image, {
			originX: "center",
			originY: "center",
			objectCaching: false,
			evented: false,
		})
		this.lockFabricObject(tile)
		tile.set({ top: coord.y + 10, left: coord.x })
		if (coord.rot === "down" || coord.rot === "up") tile.set({ flipX: true, top: coord.y })
		return tile
	}
	getTileOverlay(coord, type) {
		let image
		if (type === "red") image = document.getElementById("tile_highlight_red")
		else if (type === "yellow") image = document.getElementById("tile_highlight_yellow")
		else if (type === "water") image = document.getElementById("tile_highlight_water")
		else if (type === "shine") return this.getShine(coord)
		else if (type === "blocker") image = document.getElementById("tile_blocker")
		else image = document.getElementById("tile_highlight_white")

		let tile = new fabric.Image(image, {
			originX: "center",
			originY: "center",
			objectCaching: false,
			evented: false,
			angle: -45,
		})
		this.lockFabricObject(tile)
		this.scaleTileImage(tile, coord.rot)
		if (coord.rot === "down" || coord.rot === "up") tile.set({ top: coord.y + 45, left: coord.x })
		else tile.set({ top: coord.y + 60, left: coord.x })
		this.canvas.add(tile)
		const group = new fabric.Group([tile], {
			scaleY: 0.6,
			evented: false,
		})
		// this.canvas.add(group)
		return tile
	}
	getTileTextObj(str, coord, fontsize, color) {
		if (!color) color = "#707070"
		let text = new fabric.Text(str, {
			fontSize: fontsize,
			fill: color,
			opacity: 1,
			fontWeight: "bold",
			evented: false,
			top: coord.y,
			left: coord.x,
			fontFamily: "nanumEB",
		})
		this.lockFabricObject(text)
		this.canvas.add(text)
		return text
	}
	getHouse(owner) {
		let house = new fabric.Image(document.getElementById("marble_buildingimg"), {
			width: BUILDING_IMG_SIZE,
			height: BUILDING_IMG_SIZE,
			cropX: BUILDING_IMG_SIZE * (4 + owner),
			cropY: 0,
			objectCaching: false,
			evented: false,
		})
		house.scale(HOUSE_SCALE)
		this.lockFabricObject(house)
		this.canvas.add(house)

		return house
	}
	getLandMark(owner) {
		let house = new fabric.Image(document.getElementById("marble_buildingimg"), {
			width: BUILDING_IMG_SIZE,
			height: BUILDING_IMG_SIZE,
			cropX: BUILDING_IMG_SIZE * (8 + owner),
			cropY: 0,
			objectCaching: false,
			evented: false,
		})
		house.scale(LANDMARK_SCALE)
		this.lockFabricObject(house)
		this.canvas.add(house)
		return house
	}
	getFlag(owner) {
		let flag = new fabric.Image(document.getElementById("marble_buildingimg"), {
			width: BUILDING_IMG_SIZE,
			height: BUILDING_IMG_SIZE,
			cropX: BUILDING_IMG_SIZE * owner,
			cropY: 0,
			objectCaching: false,
			evented: false,
		})
		flag.scale(FLAG_SCALE)
		this.lockFabricObject(flag)
		this.canvas.add(flag)
		return flag
	}

	/**
	 *
	 * @param {*} elem
	 * @param {*} coord
	 * @param {*} buildingType flag/house/landmark
	 * @param {*} animateType  fade/create
	 */
	async animateBuildingBuild(elem, coord, buildingType, animateType) {
		if (animateType === "create") {
			let offset = 40

			elem.set({ top: coord.y - offset, left: coord.x })
			this.render()
			await sleep(buildingType === "landmark" ? 400 : 200)
			elem.bringToFront()
			let easing = fabric.util.ease.easeOutBounce
			let delay = 250
			if (buildingType === "landmark") {
				easing = fabric.util.ease.easeOutCubic
				delay = 400
			}
			elem.animate("top", coord.y, {
				onChange: this.render.bind(this),
				duration: 400,
				easing: easing,
			})

			await sleep(delay)

			let flash = null
			if (buildingType === "landmark") {
				offset = 60
				flash = new fabric.Image(document.getElementById("landmarkflash"), {
					objectCaching: false,
					evented: false,
					originX: "center",
					originY: "center",
					top: coord.y,
					left: coord.x,
					opacity: 1,
				})
				flash.scale(1.5)
				this.lockFabricObject(flash)
			} else if (buildingType === "house") {
				flash = new fabric.Image(document.getElementById("houseflash"), {
					objectCaching: false,
					evented: false,
					originX: "center",
					originY: "center",
					top: coord.y,
					left: coord.x,
					opacity: 1,
				})
				flash.scale(1.5)
				this.lockFabricObject(flash)
			}
			if (flash) {
				this.canvas.add(flash)
				this.animateOpacity(flash, 0, 800)
				this.removeImageAfter(flash, 1000)
				flash.bringToFront()
				if (buildingType === "house") elem.bringToFront()
			}
		} else {
			//fade
			let scale = HOUSE_SCALE
			if (buildingType === "landmark") scale = LANDMARK_SCALE
			else if (buildingType === "flag") scale = FLAG_SCALE
			elem.set({ top: coord.y, left: coord.x, scale: 0.1 })
			elem.bringToFront()
			this.animateScale(elem, scale, 500)
		}
	}
	/**
	 *
	 * @param {*} elem
	 * @param {*} buildingType flag/house/landmark
	 * @param {*} animateType fade/destroy/delayed-fade
	 */
	async animateBuildingDestroy(elem, buildingType, animateType) {
		if (!elem) return
		// this.animateOpacity(elem, 0, 1000)
		this.animateOpacity(elem, 0, 1500)
		this.removeImageAfter(elem, 1500)

		if (animateType === "destroy") {
			this.animateMoneyParticle(elem.left, elem.top, buildingType)
		}
	}
	async animateMoneyParticle(x, y, buildingType) {
		let moneys = []
		let interval = setInterval(() => {
			for (const m of moneys) {
				if (m) m.set({ flipY: !m.flipY })
			}
		}, 150)
		let xRange = 20
		let count = 6
		if (buildingType === "landmark") {
			count = 9
			xRange = 50
		}
		for (let i = 0; i < count; ++i) {
			let posx = x + (Math.random() * xRange - xRange / 2)
			let rand = Math.floor(Math.random() * 4) + 1
			let money = new fabric.Image(document.getElementById("moneyparticle" + rand), {
				objectCaching: false,
				evented: false,
				originX: "center",
				originY: "center",
				top: y,
				left: posx,
				opacity: 1,
				scale: 0.8,
			})
			this.canvas.add(money)
			this.animateY(money, y - 130, 1000, true)
			this.animateX(money, posx + (Math.random() * 20 - 10), 1000)
			this.removeImageAfter(money, 1500)
			moneys.push(money)
			await sleep(200)
			this.animateOpacity(money, 0, 900)
		}
		await sleep(2000)
		clearInterval(interval)
		moneys = null
	}
	addLandFlag(pos, owner, animateType) {
		let flag = this.getFlag(owner)
		let coord = getFlagCoord(this.getCoord(pos))
		if (!coord) return
		this.animateBuildingBuild(flag, coord, "flag", animateType)
		// flag.set({ top: coord.y, left: coord.x })
		// flag.bringToFront()
		this.tileObj.get(pos).setLandFlag(flag)
	}
	removeLandFlag(pos, animateType) {
		let tileobj = this.tileObj.get(pos)
		if (tileobj.type === "nonbuildable") return
		let flag = tileobj.buildings[0]
		if (!flag) return
		this.animateBuildingDestroy(flag, "flag", animateType)
		// this.canvas.remove(flag)
		tileobj.setLandFlag(null)
	}
	/**
	 *
	 * @param {*} pos
	 * @param {*} owner
	 * @param {*} level 1~3
	 * @returns
	 */
	addHouse(pos, owner, level, animateType) {
		if (level < 1 || level > 3) return
		let h = this.getHouse(owner)
		let coord = getHouseCoord(this.getCoord(pos), level)
		if (!coord) return
		this.animateBuildingBuild(h, coord, "house", animateType)
		// h.set({ top: coord.y, left: coord.x })
		// h.bringToFront()

		this.tileObj.get(pos).setHouse(h, level)
		this.removeLandFlag(pos, "fade")
	}
	/**
	 *
	 * @param {*} pos
	 * @param {*} level 1~3
	 * @returns
	 */
	removeHouse(pos, level, animateType) {
		if (level < 1 || level > 3) return

		let tileobj = this.tileObj.get(pos)
		if (tileobj.type === "nonbuildable") return
		let house = tileobj.buildings[level]
		if (!house) return
		this.animateBuildingDestroy(house, "house", animateType)
		// this.canvas.remove(house)
		tileobj.setHouse(null, level)

		if (tileobj.data.hasOnlyLand()) {
			this.addLandFlag(pos, tileobj.data.owner, "fade")
		}
	}
	/*
	removeAllHouse(pos, animateType) {
		for (let i = 1; i < 4; ++i) this.removeHouse(pos, animateType)
	}
*/
	addLandMark(pos, owner, animateType) {
		let lm = this.getLandMark(owner)
		let coord = getLandMarkCoord(this.getCoord(pos))
		if (!coord) return
		this.animateBuildingBuild(lm, coord, "landmark", animateType)
		// lm.set({ top: coord.y, left: coord.x })
		// lm.bringToFront()

		if (this.tileObj.get(pos).buildings[4] != null) this.canvas.remove(this.tileObj.get(pos).buildings[4])

		this.tileObj.get(pos).setLandMark(lm)
		this.showMessage("landmark", pos)
		for (let i = 1; i < 4; ++i) {
			this.removeHouse(pos, i, "fade")
		}
		this.removeLandFlag(pos, "fade")
		this.lock.liftIfLocatedAt(pos)
	}
	removeLandMark(pos, animateType) {
		let tileobj = this.tileObj.get(pos)
		if (tileobj.type === "nonbuildable") return
		let landmark = tileobj.buildings[4]
		if (!landmark) return
		this.animateBuildingDestroy(landmark, animateType)
		// this.canvas.remove(flag)
		tileobj.setLandFlag(null)

		for (let i = 1; i < 4; ++i) {
			this.addHouse(pos, tileobj.data.owner, i, "fade")
		}
	}
	indicatePull(positions) {
		this.game.playsound("pull")
		this.showTileHighlight(positions, "white")
		setTimeout(() => this.clearTileHighlight("white"), 1500)
	}
	playerEffect(p, effect, pos, status) {
		if (effect === "bubble_root" || effect === "all") {
			if (status) this.showBubble(p, pos)
			else if (this.players[p].bubble !== null) {
				this.canvas.remove(this.players[p].bubble)
				this.players[p].setBubble(null)
			}
		}
	}
	showBubble(player, playerpos) {
		let pos = this.getCoord(playerpos)
		let bubble = new fabric.Image(document.getElementById("bubbleimg"), {
			objectCaching: false,
			evented: false,
			top: pos.y + PLAYER_POS_DIFF[player][1],
			left: pos.x + PLAYER_POS_DIFF[player][0],
		})
		bubble.scale(1.2)
		this.lockFabricObject(bubble)
		this.canvas.add(bubble)
		bubble.bringToFront()
		this.players[player].bubble = bubble
		this.showMessage("root", playerpos)
		this.render()
	}
	showTileHighlight(positions, color) {
		for (const p of positions) {
			let image = this.getTileOverlay(this.getCoord(p), color)
			//this.canvas.add(image)
			image.bringToFront()
			this.tileHighlights.get(color).push(image)
		}
		this.render()
	}
	clearTileHighlight(color) {
		this.tileHighlights.get(color).forEach((h) => this.canvas.remove(h))
		this.tileHighlights.set(color, [])
		this.render()
	}
	tileHighlightsToFront() {
		for (let color of this.tileHighlights.values()) color.forEach((h) => h.bringToFront())

		this.render()
	}
	clearBuildings(positions) {
		for (const p of positions) {
			let tileobj = this.tileObj.get(p)
			tileobj.setOwner(-1)
			if (tileobj.type === "nonbuildable") return

			let currentbuilds = this.tileData.get(p).builds
			let tiledata = this.tileData.get(p)

			for (let i = 0; i < currentbuilds.length; ++i) {
				if (!currentbuilds[i]) continue
				// this.animateBuildingDestroy(currentbuilds[i],"","destroy")
				if (i === 0 && tiledata.hasOnlyLand()) {
					this.animateBuildingDestroy(tileobj.buildings[i], "flag", "destroy")
				} else if (i === 4) {
					this.animateBuildingDestroy(tileobj.buildings[i], "landmark", "destroy")
				} else if (!tiledata.hasLandMark()) {
					this.animateBuildingDestroy(tileobj.buildings[i], "house", "destroy")
				}
			}

			// tileobj.buildings.forEach((b) => {
			// 	// this.canvas.remove(b)
			// })

			this.tileObj.get(p).clear()
		}
	}
	removeBuildings(pos, toremove) {
		toremove.forEach((b) => {
			this.removeHouse(pos, b - 1, "destroy")
		})
		this.render()
	}
	setTileStatusEffect(pos, name, dur) {
		let tileobj = this.tileObj.get(pos)
		if (!tileobj) return

		if (name === "" && tileobj.effectOverlay != null) {
			this.canvas.remove(tileobj.effectOverlay)
			tileobj.effectOverlay = null
		}
		if (name === "") return

		let img = this.getTileOverlay(this.getCoord(pos), "red")

		let color = "white"
		if (name === "pandemic") color = "green"
		if (name === "blackout") color = "black"

		let filter = new fabric.Image.filters.BlendColor({
			color: color,
			mode: "tint",
			alpha: 0.9,
		})
		img.filters = [filter]
		img.applyFilters()
		//this.canvas.add(img)
		tileobj.effectOverlay = img
	}

	setTileState(change) {
		let tile = this.tileObj.get(change.pos)
		if (!tile) return

		if (change.state === "pandemic" || change.state === "blackout") {
			this.setTileStatusEffect(change.pos, change.state, change.duration)
		} else if (change.state === "remove_effect") {
			this.setTileStatusEffect(change.pos, "", 0)
		} else if (change.state === "lift") {
			let img = this.getTileOverlay(this.getCoord(change.pos), "blocker")
			tile.addBlocker(img)
		} else if (change.state === "unlift") {
			let b = tile.blocker
			this.canvas.remove(b)
			tile.removeBlocker()
		} else if (change.state === "waterpump_on") {
			let img = this.getTileOverlay(this.getCoord(change.pos), "water")
			tile.addBlocker(img)
		} else if (change.state === "waterpump_off") {
			let b = tile.blocker
			this.canvas.remove(b)
			tile.removeBlocker()
		}
		this.render()
	}
	/**
	 *
	 * @param {*} pos
	 * @param {*} toll number
	 * @param {*} mul number
	 */
	setToll(pos, toll, mul) {
		if (this.tileObj.has(pos)) {
			if (mul > 1) {
				this.tileObj.get(pos).changeToll("X" + String(mul))

				//배수 올랐을 경우에만
				if (this.tileData.get(pos).multiplier < mul) {
					this.game.playsound("multiplier")
					let shine = this.getTileOverlay(this.getCoord(pos), "shine")
					shine.set({ opacity: 0 })

					// this.canvas.add(shine)
					// shine.bringToFront()
					this.canvas.bringToFront(shine)
					this.animateOpacity(shine, 1, 200)
					this.showMessage("toll_increase", pos)
					setTimeout(() => {
						this.canvas.remove(shine)
						this.render()
					}, 2000)
				}
			} else {
				this.tileObj.get(pos).changeToll(moneyToString(toll))
			}
			this.tileData.get(pos).toll = toll
			this.tileData.get(pos).multiplier = mul
		}
	}
	/**
	 * player:player turn
	 */
	setLandOwner(pos, player) {
		if (!this.tileData.has(pos) || this.tileData.get(pos).owner === player) return
		this.tileData.get(pos).setOwner(player)
		let currentbuilds = this.tileData.get(pos).builds
		let tiledata = this.tileData.get(pos)
		for (let i = 0; i < currentbuilds.length; ++i) {
			if (!currentbuilds[i]) continue

			if (i === 0 && tiledata.hasOnlyLand()) {
				this.removeLandFlag(pos, "delayed-fade")
				this.addLandFlag(pos, player, "fade")
			} else if (i === 4) {
				this.removeLandMark(pos, "delayed-fade")
				this.addLandMark(pos, player, "fade")
			} else if (!tiledata.hasLandMark()) {
				this.removeHouse(pos, i, "delayed-fade")
				this.addHouse(pos, player, i, "fade")
			}
		}
		this.render()
	}
	setOlympic(pos) {
		if (this.olympic !== -1) {
			this.tileData.get(this.olympic).olympic = false
		}
		this.showMessage("olympic", pos)
		this.tileData.get(pos).olympic = true
	}
	setBlackhole(blackpos, whitepos) {
		let b = this.getCoord(blackpos)
		let w = this.getCoord(whitepos)
		this.blackhole.image.set({
			left: b.x,
			top: b.y + (b.rot === "up" || b.rot === "down" ? 10 : 20),
			visible: true,
		})
		this.whitehole.image.set({
			left: w.x,
			top: w.y + (w.rot === "up" || w.rot === "down" ? 10 : 20),
			visible: true,
		})
		this.blackhole.image.bringToFront()
		this.whitehole.image.bringToFront()
		this.blackhole.pos = blackpos
		this.whitehole.pos = whitepos
		this.showMessage("blackhole", blackpos)
		this.showMessage("whitehole", whitepos)
		this.render()
	}
	removeBlackHole() {
		this.blackhole.pos = -1
		this.whitehole.pos = -1
		this.blackhole.image.set({ visible: false })
		this.whitehole.image.set({ visible: false })
		this.render()
	}
	modifyLand(pos, type, val) {
		if (type === "lock") {
			let b = getLandMarkCoord(this.getCoord(pos))
			this.lock.image.set({ left: b.x, top: b.y - 40, visible: true })
			this.lock.image.bringToFront()
			this.canvas.bringToFront(this.lock.image)
			this.lock.pos = pos
			this.showMessage("lock", pos)
		}
		if (type === "unlock") {
			this.lock.image.set({ visible: false })
			this.lock.pos = -1
		}
	}
	focusPlayer(player) {
		for (let i = 0; i < this.players.length; ++i) {
			if (this.players[i].retired) continue

			if (i === player) this.players[i].playerimg.set({ opacity: 1 })
			else this.players[i].playerimg.set({ opacity: 0.3 })
		}
		this.render()
	}
	setPlayerImgColor(player, turn) {
		let filter = new fabric.Image.filters.BlendColor({
			color: COLORS[turn],
			mode: "tint",
			alpha: 0.3,
		})
		this.players[player].playerimg.filters = [filter]
		this.players[player].playerimg.applyFilters()
	}
	onReady() {
		for (let i = 0; i < this.players.length; ++i) {
			this.setPlayerImgColor(i, this.players[i].turn)
		}
		//
		// this.arrow.scale(1.2)
		this.pin.scale(1.4)
		// this.pin.set({angle:-45})
		// this.arrow.set({angle:-45})

		this.startRenderInterval()
	}
	onStep() {
		this.game.playsound("step")
	}
	payMoney(payer, receiver, amount) {
		//"top-left", "bottom-left", "top-right", "bottom-right"'
		let count = 1
		if (amount > 50 * 10000) count = 2
		if (amount > 200 * 10000) count = Math.min(Math.floor((amount * 1.6) / 1000000), 13)
		this.moneyText.set({ opacity: 1, text: moneyToString(amount) })

		// let id=String("payment" + Math.floor(Math.random() * 10000))
		let moneys = []
		for (let i = 0; i < count; ++i) {
			let money = new Money(this, payer, receiver)
			moneys.push(money)
		}
		// this.moneyAnimations.set(id,moneys)
		this.animateMoney(moneys)
		clearTimeout(this.moneyTextTimeout)

		this.moneyTextTimeout = setTimeout(() => {
			this.moneyText.set({ opacity: 0, text: "" })
		}, 1200 + 100 * count)
	}

	async animateMoney(moneys) {
		// let moneys=this.moneyAnimations.get(id)
		// if(!moneys) return
		for (const m of moneys) {
			m.spawnImage()
			m.animate1(moneys.length)
			this.game.playsound("money")
			await sleep(50)
		}
		await sleep(1200 + 50 * moneys.length)
		for (const m of moneys) {
			m.animate2()
		}
		await sleep(600)
		for (const m of moneys) {
			m.remove()
		}

		this.render()
		// this.moneyAnimations.delete(id)
	}
	tileReset() {
		this.shadow.set({ visible: false })
		for (const tile of this.tiles) {
			tile.set({ opacity: 1 })
		}
		super.tileReset()
		this.tileHighlightsToFront()
		this.canvas.sendToBack(this.tileoutergroup)
		this.canvas.sendToBack(this.copiedtiles)
	}
	onTileClick(pos, type) {
		this.tileReset()
		this.game.onTileSelect(pos, type)
	}
	showRangeTilesByList(list, type, size) {
		this.canvas.bringToFront(this.shadow)
		this.canvas.discardActiveObject()
		this.shadow.set({ visible: true })
		this.canvas.bringToFront(this.tileoutergroup)
		for (const tile of this.tiles) {
			tile.set({ opacity: 0 })
		}
		for (let i of list) {
			this.liftTile(i, type, size)
		}
		this.playersToFront()
		//this.players[1].updateNameText("지역 매각 중입니다..")
		this.render()
	}

	liftTile(index, type, size) {
		if (this.tiles[index] === null || index >= this.tiles.length || index < 0) {
			return
		}

		let select = () => {
			this.onTileClick(index, type)
		}
		//신의손 특수지역 건설
		if (type === "") {
		}
		this.activateTile(index, select)
		//this.tiles[index].moveTo(31)

		this.tileObj.get(index).onTileLift()

		this.blackhole.liftIfLocatedAt(index)
		this.whitehole.liftIfLocatedAt(index)
		this.lock.liftIfLocatedAt(index)
	}

	activateTile(index, onSelect) {
		const tile = this.tiles[index]

		this.activetiles.push(index)

		tile.set({ opacity: 1, hoverCursor: "pointer", evented: true })
		tile.on("mousedown", onSelect)
		tile.setCoords()
	}
	async playerBlackholeMove(player, dest) {
		this.focusPlayer(player)
		this.players[player].playerimg.scale(1.5)
		this.render()
		await sleep(300)
		this.animateScaleX(this.players[player].playerimg, 0, 700)
		this.animateScaleY(this.players[player].playerimg, 0, 700)
		await sleep(1000)
		let coord = this.getCoord(dest)
		this.players[player].playerimg.set({
			left: coord.x + PLAYER_POS_DIFF[player][0],
			top: coord.y + PLAYER_POS_DIFF[player][1] + 50,
		})
		this.animateScaleX(this.players[player].playerimg, 0.5, 500)
		this.animateScaleY(this.players[player].playerimg, 0.5, 500)
		this.animateY(this.players[player].playerimg, coord.y + PLAYER_POS_DIFF[player][1], 500)
		this.removeBlackHole()
	}
	async playerWaterstreamMove(target, pos) {
		this.focusPlayer(target)
		this.render()

		pos = Math.max(pos, 0)
		let x = this.getCoord(pos).x
		let y = this.getCoord(pos).y

		this.players[target].pos = pos
		let time = 1000

		this.players[target].playerimg.animate("top", y + PLAYER_POS_DIFF[target][1], {
			onChange: this.render.bind(this),
			duration: time,
			//	easing: fabric.util.ease.easeOutBack,
		})
		this.players[target].playerimg.animate("left", x + PLAYER_POS_DIFF[target][0], {
			onChange: this.render.bind(this),
			duration: time,
			//	easing: fabric.util.ease.easeOutBack,
		})
		this.render()
	}

	removePlayer(player) {
		this.players[player].retired = true
		this.players[player].playerimg.set({ opacity: 0 })
		this.playerEffect(player, "all", false)
	}
	test() {
		this.showRangeTilesByList([0, 1, 4, 5, 7, 11, 20, 32], "", 1)
		this.players[1].updateNameText("지역 매각 중입니다..")
		this.teleportPlayer(0, 8, "levitate")
		this.movePlayerThrough([31, 30, 29, 28, 27, 26, 25], 1, (turn) => this.game.moveComplete(turn))
	}
}
