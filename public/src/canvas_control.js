const ZOOM_BTN_SCALES = [0.8, 1, 1.2, 1.4, 1.6, 1.8]
const PLAYER_POS_DIFF = [
	[8, 9],
	[-17, 2],
	[6, -5],
	[-12, -9],
] //플레이어별 위치 차이
export const COLOR_LIST = ["blue", "red", "green", "yellow"] //플레이어별 색상
const PROJ_DIFF = [-2, 4, 2, -4] //플레이어별 투사체범위 위치 차이
const TILE_IMG_SIZE = 100
const BOARD_MARGIN = 200
const FRAME = 30 //milisecond
const TILE_SHADOW_THICKNESS_RIGHT = 5
const TILE_SHADOW_THICKNESS_BOTTOM = 10
const VISUAL_EFFECT_SPRITE_SIZE = 128
export const sleep = (m) => new Promise((r) => setTimeout(r, m))
export const COLOR_LIST_BG = ["#a6c8ff", "#ff7070", "#95ff80", "#fdff80"] //플레이어별 연한 색상

const BIGGER_OBSTACLES = [9, 12, 13, 14, 17, 38, 46, 58, 74]
const DEFAULT_PROJ_TRAJECTORY_SPEED = 300
const HEALTHBAR_OFFSET_Y = 48
const HEALTHBAR_OFFSET_X = 78
const HEALTHBAR_FRAME_OFFSET_Y = 50
const HEALTHBAR_FRAME_OFFSET_X = 80

const HPBAR_OFFSET_Y = 30
const HPBAR_OFFSET_X = 30

const HEALTHBAR_LOST_DISAPPEAR_DELAY = 400
const HEALTHBAR_FRAME_DISAPPEAR_DELAY = 1300
const ATTACK_EFFECT_INTERVAL = 100
import { Board } from "./board.js"
// import { this.game } from "./script.js"
function distance(pos1, pos2) {
	return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2)
}
function midpoint(pos1, pos2) {
	return { x: (pos1.x + pos2.x) / 2, y: (pos1.y + pos2.y) / 2 }
}

class SummonedEntity {
	constructor(scene, sourceTurn, pos, name, id, img) {
		this.scene = scene
		this.pos = pos
		this.name = name
		this.sourceTurn = sourceTurn
		this.UEID = id
		this.img = img
		this.deathEffect = null
		this.defaultEffect = null
		this.coordX = 0
		this.coordY = 0
		this.animateMove = false

		if (name === "tree_plant") {
			this.animateMove = true
		}
	}
	show() {
		let origin = this.scene.getPlayerPos(this.sourceTurn)
		this.img.set({
			left: origin.x,
			top: origin.y,
			visible: true,
			evented: true,
		})
		this.moveTo(this.pos)
		this.scene.render()
	}
	moveTo(pos) {
		let source = this.sourceTurn === -1 ? 0 : this.sourceTurn
		let randoffset = Math.floor(Math.random() * 10)
		this.pos = pos
		this.coordX = this.scene.Map.coordinates[this.pos].x + BOARD_MARGIN + PLAYER_POS_DIFF[source][0] + randoffset
		this.coordY = this.scene.Map.coordinates[this.pos].y + 20 + BOARD_MARGIN + PLAYER_POS_DIFF[source][1] + randoffset
		const time = this.scene.getMoveSpeed("entity_move")
		this.scene.animateX(this.img, this.coordX, time)
		this.scene.animateY(this.img, this.coordY, time)

		this.scene.canvas.bringToFront(this.img)
	}
	setDeathEffectTreePlant() {
		this.deathEffect = this.scene.createCroppedEffectImage("tree_plant_death")
		this.scene.setEffectImageAttr(this.deathEffect, 0, 0, 1, 1, 0, 0)

		this.defaultEffect = this.scene.createCroppedEffectImage("hit")
		this.scene.setEffectImageAttr(this.defaultEffect, 0, 0, 0.8, 0.8, 0, 0)

		return this
	}

	killed() {
		// if(!this.defaultEffect || !this.deathEffect) return

		if (this.name === "tree_plant") {
			this.setDeathEffectTreePlant()

			this.scene.defaultEffectAt(this.defaultEffect, this.coordX, this.coordY)
			this.scene.game.playSound("hit")
			this.scene.game.playSound("tree_plant")
			this.scene.setEffectImageAttr(this.deathEffect, this.coordX, this.coordY, 0.6, 0.6, 0.9, 0)
			this.scene.animateOpacity(this.deathEffect, 0, 2500)

			this.scene.animateScaleX(this.deathEffect, 1.6, 1000)
			this.scene.animateScaleY(this.deathEffect, 1.6, 1000)
			this.scene.removeImageAfter(this.deathEffect, 2500)
			this.scene.removeImageAfter(this.defaultEffect, 2500)
			setTimeout(() => {
				this.scene.render()
			}, 2600)
		}
	}

	remove(isKilled) {
		if (isKilled) {
			this.killed()
		}

		this.img.set({ visible: false, evented: false })
		this.scene.canvas.remove(this.img)

		this.scene.canvas.renderAll()
	}
}

class PassProjectile {
	/**
	 *
	 * @param {*} pos 위치
	 * @param {*} name 종류
	 * @param {*} tile 타일 오브젝트
	 * @param {*} icon 아이콘 오브젝트
	 * @param {*} id UPID
	 */
	constructor(scene, pos, name, tile, icon, id, stop = null) {
		this.scene = scene
		this.pos = pos
		this.name = name
		this.tile = tile
		this.stop = stop

		this.UPID = id
		this.icon = icon
	}
	show() {
		this.tile.set({
			left: this.scene.Map.coordinates[this.pos].x + BOARD_MARGIN,
			top: this.scene.Map.coordinates[this.pos].y + BOARD_MARGIN,
			visible: true,
			evented: true,
		})

		this.icon.set({
			left: this.scene.Map.coordinates[this.pos].x + BOARD_MARGIN,
			top: this.scene.Map.coordinates[this.pos].y + 25 + BOARD_MARGIN,
			visible: true,
			evented: true,
		})
		if (this.stop) {
			this.stop.set({
				left: this.scene.Map.coordinates[this.pos].x + BOARD_MARGIN,
				top: this.scene.Map.coordinates[this.pos].y + BOARD_MARGIN,
				visible: true,
				evented: true,
			})
		}
		this.bringToFront()
		this.scene.playersToFront()
		this.scene.canvas.renderAll()
	}
	bringToFront() {
		if (this.stop) {
			this.scene.canvas.bringToFront(this.stop)
		}
		this.scene.canvas.bringToFront(this.tile)
		this.scene.canvas.bringToFront(this.icon)
	}
	remove() {
		if (this.stop) {
			this.stop.set({ visible: false, evented: false })
			this.scene.canvas.remove(this.stop)
		}
		this.tile.set({ visible: false, evented: false })
		this.icon.set({ visible: false, evented: false })
		this.scene.canvas.remove(this.tile)
		this.scene.canvas.remove(this.icon)

		this.scene.canvas.renderAll()
	}
}

class ActiveProjectile {
	/**
	 * @param {*} scope int[] 범위
	 * @param {*} scopeTiles 타일 오브젝트들
	 * @param {*} id UPID
	 */
	constructor(scene, scope, scopeTiles, id, owner, icon) {
		this.scene = scene
		this.scope = scope
		this.scopeTiles = scopeTiles
		this.UPID = id
		this.icon = icon
		this.owner = owner
	}

	show() {
		this.scene.game.playSound("place")

		for (let i = 0; i < this.scope.length; ++i) {
			if (this.scene.Map.coordinates.length <= this.scope[i]) continue
			this.scopeTiles[i].set({
				left: this.scene.Map.coordinates[this.scope[i]].x + BOARD_MARGIN + PROJ_DIFF[this.owner],
				top: this.scene.Map.coordinates[this.scope[i]].y + BOARD_MARGIN + PROJ_DIFF[this.owner],
				visible: true,
				evented: true,
			})
		}
		this.icon.set({
			left: this.scene.Map.coordinates[this.scope[0]].x + BOARD_MARGIN + PROJ_DIFF[this.owner],
			top: this.scene.Map.coordinates[this.scope[0]].y + 25 + BOARD_MARGIN + PROJ_DIFF[this.owner],
			visible: true,
			evented: true,
		})
		this.bringToFront()
		this.scene.playersToFront()
		this.scene.canvas.renderAll()
	}

	bringToFront() {
		this.scene.canvas.bringToFront(this.icon)
		for (let i of this.scopeTiles) {
			this.scene.canvas.bringToFront(i)
		}
	}

	remove() {
		for (let i of this.scopeTiles) {
			i.set({ visible: false, evented: false })
			this.scene.canvas.remove(i)
		}

		this.icon.set({ visible: false, evented: false })
		this.scene.canvas.remove(this.icon)

		this.scene.render()
	}
}

/**
 * depreciated
 */
class HpChangeHelper {
	constructor(scene) {
		if (HpChangeHelper._instance) {
			return HpChangeHelper._instance
		}
		HpChangeHelper._instance = this
		this.interval = null
		this.durationTimeout = null
		this.hpChangeQueue = []
		this.hpChangeFrequency = 400
		this.scene = scene
		this.isIntervalOn = false

		//death data for each player that waiting for damage data (when death data comes first)
		this.pendingDieData = [null, null, null, null]

		//damage data for each player that waiting for death data  (when damage data dequeued first), indicate death immediately if exists
		this.pendingDamageData = [null, null, null, null]
	}
	startInterval() {
		if (this.isIntervalOn) {
			clearTimeout(this.durationTimeout)
			//		//console.log("extendtimeout")
			this.durationTimeout = setTimeout(
				function () {
					clearInterval(this.interval)
					this.isIntervalOn = false
				}.bind(this),
				2000
			)
		} else {
			this.isIntervalOn = true
			this.dequeueHpChange()
			//	//console.log("invervalstarts")
			this.interval = setInterval(
				function () {
					this.dequeueHpChange()
				}.bind(this),
				this.hpChangeFrequency
			)
			this.durationTimeout = setTimeout(
				function () {
					clearInterval(this.interval)
					this.isIntervalOn = false
				}.bind(this),
				2000
			)
		}
	}
	/**
	 * queue up hp changes
	 *
	 */
	async dequeueHpChange() {
		if (this.hpChangeQueue.length === 0) return
		let changeData = this.hpChangeQueue.shift()

		//already have damage data that need delay but no die data yet
		if (changeData.killed && this.pendingDieData[changeData.turn] == null) {
			//	//console.log("no killdata yet" + changeData.turn)
			this.pendingDamageData[changeData.turn] = changeData
			return
		}

		if (changeData.skillTrajectorySpeed > 0) {
			//console.log("dequeueHpChange" + changeData.skillTrajectorySpeed)
			this.scene.animateTrajectory(
				changeData.turn,
				changeData.skillfrom,
				changeData.type,
				changeData.skillTrajectorySpeed
			)
			await sleep(changeData.skillTrajectorySpeed)
		}
		await this.scene.animateDamage(changeData)
		if (changeData.willRevive) {
			this.scene.showSoul(changeData.turn)
		}
		this.indicateDeath(changeData.turn) //already have die data and damage need delay
	}
	/**
	 * digest hp change queue
	 * @param {*} data
	 */
	async enqueueHpChange(data) {
		//damage that dont need delay
		if (!data.needDelay) {
			//	//console.log("showdamage instant" + data.turn)
			//console.log("enqueueHpChange" + data.skillTrajectorySpeed)
			if (data.skillTrajectorySpeed > 0) {
				this.scene.animateTrajectory(data.turn, data.skillfrom, data.type, data.skillTrajectorySpeed)
				await sleep(data.skillTrajectorySpeed)
			}
			await this.scene.animateDamage(data)

			if (data.willRevive) {
				this.scene.showSoul(data.turn)
			}

			if (!data.killed) return
			let success = this.indicateDeath(data.turn) //already have die data and damage dont need delay
			if (!success) {
				//			//console.log("waitingdiedata" + data.turn)
				this.pendingDamageData[data.turn] = data //received die data that dont need delay and dont have die data yet
			}
		} //damage that need delay
		else {
			//	//console.log("pushdmg" + data.turn)
			this.hpChangeQueue.push(data)
			this.startInterval()
		}
	}
	async saveDieData(info) {
		//received damage data that dont need delay and just received die data
		if (this.pendingDamageData[info.turn] !== null) {
			//		//console.log("show diedata instant" + info.turn)
			//console.log(this.pendingDamageData)
			let data = this.pendingDamageData[info.turn]

			if (info.skillTrajectorySpeed > 0) {
				this.scene.animateTrajectory(data.turn, data.skillfrom, data.type, info.skillTrajectorySpeed)
				await sleep(info.skillTrajectorySpeed)
			}
			await this.scene.animateDamage(data)

			this.game.onPlayerDie(info.turn, info.location, info.killer, info.isShutDown, info.killerMultiKillCount)
			this.pendingDamageData[info.turn] = null
		} else {
			//	//console.log("save diedata" + info.turn)
			this.pendingDieData[info.turn] = info
		}
	}
	indicateDeath(turn) {
		let info = this.pendingDieData[turn]
		if (info == null) return false
		//	//console.log("show diedata", turn)
		//	//console.log(info)
		this.game.onPlayerDie(info.turn, info.location, info.killer, info.isShutDown, info.killerMultiKillCount)

		this.pendingDieData[turn] = null
		return true
	}
	doHeal(data) {
		this.scene.animateHeal(data)
	}
}

export class Scene extends Board {
	constructor(game) {
		super(game)
		this.effectindicator = []

		this.line = null //스킬사용시 선
		this.heal = null //힐 효과
		this.tooltip = null //장애물 설명 툴팁
		this.tileselectimgs = [] //타일 선택시 뜨는 효과

		this.activeProjectileList = new Map()
		this.summonedEntityList = new Map()
		// this.effectlist = [] //이펙트이미지 리스트
		// this.visualEffects = new Map()
		this.overlapSelectorImgs = []

		this.dcItemIndicator = null
		this.subwayTrain = null
		this.tempFinish = null
		//this.hpChanger = new HpChangeHelper(this)
	}

	//===========================================================================================================================

	/**
	 * check if a projectile can be placed on the tile
	 * @param {} c tile index
	 * @returns
	 */
	canPlaceProj(c) {
		let coor = this.Map.coordinates
		if (c >= coor.length || coor[c].obs === -1 || coor[c].obs === 0) {
			return false
		}
		return true
	}
	//===========================================================================================================================

	isInSubwayRange(c) {
		return c > this.Map.subway.start && c < this.Map.subway.end
	}
	//===========================================================================================================================

	summonEntity(entity) {
		// if (entity.throwSpeed > 0) {
		// 	await sleep(proj.throwSpeed)
		// }

		let newEntity = new SummonedEntity(
			this,
			entity.sourceTurn,
			entity.pos,
			entity.name,
			entity.UEID,
			this.createEntityImg(entity.name, entity.sourceTurn)
		)

		this.summonedEntityList.set(entity.UEID, newEntity)
		newEntity.show()
	}
	//===========================================================================================================================

	async placeProj(proj) {
		//console.log(proj)
		if (proj.trajectorySpeed > 0 && proj.owner >= 0) {
			this.animateProjTrajectory(proj, proj.trajectorySpeed)
			await sleep(proj.trajectorySpeed)
		}

		let newProj = new ActiveProjectile(
			this,
			proj.scope,
			this.createProjScopeTiles(proj.scope.length, this.game.getPlayerColor(proj.owner)),
			proj.UPID,
			proj.owner,
			this.createProjIcon(proj.name)
		)

		this.activeProjectileList.set(proj.UPID, newProj)
		newProj.show()
	}
	//===========================================================================================================================

	async placePassProj(proj) {
		if (proj.trajectorySpeed > 0) {
			this.animateProjTrajectory(proj, proj.trajectorySpeed)
			await sleep(proj.trajectorySpeed)
		}

		let color = "red"
		if (proj.name === "submarine") {
			color = "skyblue"
		} else if (proj.name === "dicecontrol") {
			color = "blackwhite"
		} else if (proj.owner >= 0) {
			color = this.game.getPlayerColor(proj.owner)
		}

		let newProj = new PassProjectile(
			this,
			proj.scope[0],
			proj.name,
			this.createPassProjScopeTiles(color),
			this.createProjIcon(proj.name),
			proj.UPID,
			proj.stopPlayer ? this.createStopProj() : null
		)

		this.activeProjectileList.set(proj.UPID, newProj)
		newProj.show()
	}

	//===========================================================================================================================

	moveEntityTo(UEID, pos) {
		if (this.summonedEntityList.has(UEID)) {
			this.summonedEntityList.get(UEID).moveTo(pos)
		}
	}
	//===========================================================================================================================

	//delete projectile by upid
	removeEntity(UEID, isKilled) {
		try {
			//console.log("Destroyentity" + UEID)
			let toDestroy = this.summonedEntityList.get(UEID)
			if (toDestroy != null) {
				toDestroy.remove(isKilled)
				this.summonedEntityList.delete(UEID)
			}
		} catch (e) {
			console.error(e)
		}
	}
	//===========================================================================================================================

	//delete projectile by upid
	destroyProj(UPID) {
		try {
			//console.log("Destroyproj" + UPID)
			let toDestroy = this.activeProjectileList.get(UPID)
			if (toDestroy != null) {
				toDestroy.remove()
				this.activeProjectileList.delete(UPID)
				// this.activeProjectileList = this.activeProjectileList.filter((proj) => proj.UPID !== UPID)
			}
		} catch (e) {
			console.error(e)
		}
	}
	//===========================================================================================================================

	createStopProj() {
		let l = new fabric.Image(document.getElementById("select_stop"), {
			left: 0,
			top: 0,
			lockMovementX: true,
			lockMovementY: true,
			visible: false,
			hasControls: false,
			hasBorders: false,
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,
			originX: "center",
			originY: "center",
			objectCaching: false,
		})

		this.canvas.add(l)

		return l
	}

	createPassProjScopeTiles(color) {
		let tileImage = 0
		switch (color) {
			case "red":
				tileImage = 5
				break
			case "blue":
				tileImage = 4
				break
			case "green":
				tileImage = 6
				break
			case "yellow":
				tileImage = 7
				break
			case "skyblue":
				tileImage = 9
				break
			case "blackwhite":
				tileImage = 8
				break
		}

		return this.createCroppedProjectileRangeImage(tileImage)
	}

	//===========================================================================================================================

	createProjScopeTiles(size, color) {
		let imglist = []
		let tileImage = 0
		switch (color) {
			case "red":
				tileImage = 1
				break
			case "blue":
				tileImage = 0
				break
			case "green":
				tileImage = 2
				break
			case "yellow":
				tileImage = 3
				break
		}

		for (let i = 0; i < size; ++i) {
			let l = this.createCroppedProjectileRangeImage(tileImage)

			imglist.push(l)
		}
		return imglist
	}
	//===========================================================================================================================

	createProjIcon(type) {
		//console.log("projicon" + type)
		let icon = 0
		switch (type) {
			case "submarine":
				icon = 1
				break
			case "reaper_w":
				icon = 2
				break
			case "ghost_r":
				icon = 3
				break
			case "sniper_w":
				icon = 4
				break
			case "magician_r":
				icon = 5
				break
			case "kraken_q":
				icon = 6
				break
			case "bird_r_trace":
				icon = 7
				break
			case "dicecontrol":
				icon = 0
				break
			case "tree_w":
				icon = 8
				break
		}

		return this.createCroppedProjectileImage(icon)
	}
	//===========================================================================================================================

	createEntityImg(name, sourceTurn) {
		//	//console.log("projicon" + type)
		let icon = null
		switch (name) {
			case "tree_plant":
				icon = document.getElementById("tree_plant_enemy")
				if (!this.game.isEnemy(sourceTurn)) {
					icon = document.getElementById("tree_plant_ally")
				}
				break
			default:
				return null
		}

		let l = new fabric.Image(icon, {
			left: 0,
			top: 0,
			lockMovementX: true,
			lockMovementY: true,
			visible: false,
			hasControls: false,
			hasBorders: false,
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,
			originX: "center",
			originY: "center",
			objectCaching: false,
		})
		l.scale(0.4)
		return l
	}
	//===========================================================================================================================

	drawboard(resolveFunc) {
		if (this.board_drawn) return

		this.board_drawn = true
		super.drawBoard(resolveFunc)

		this.forceRender()
		resolveFunc()
		//console.log("resolve")
	}

	//===========================================================================================================================

	setBoardScale(boardimg) {
		this.boardInnerWidth = boardimg.naturalWidth - BOARD_MARGIN * 2
		this.boardInnerHeight = boardimg.naturalHeight - BOARD_MARGIN * 2
		const winwidth = window.innerWidth
		const winheight = window.innerHeight

		let win_ratio = winwidth / winheight
		// if(win_ratio <1) win_ratio=1.3
		let board_ratio = this.boardInnerWidth / this.boardInnerHeight

		//map image has vertically longer ratio than the viewport
		if (win_ratio >= board_ratio) {
			this.boardScale = winwidth / this.boardInnerWidth
			//console.log("vertically longer map, scale" + this.boardScale)
		}
		//map image has horizontally longer ratio than the viewport
		else {
			this.boardScale = winheight / this.boardInnerHeight
			//console.log("horizontally longer map, scale" + this.boardScale)
		}
		const max_boardscale = win_ratio < 0.7 ? 0.5 : 2
		//console.log(win_ratio)
		this.boardScale = Math.min(max_boardscale, this.boardScale)
		//console.log(this.boardScale)
		$("#canvas-container").css("width", winwidth * 2)
		$("#canvas-container").css("height", winheight * 2)

		this.canvas.setZoom(this.boardScale)

		this.boardOriginalHeight = (this.boardInnerHeight + BOARD_MARGIN * 2) * this.boardScale
		this.boardOriginalWidth = (this.boardInnerWidth + BOARD_MARGIN * 2) * this.boardScale
		this.canvas.setWidth(this.boardOriginalWidth)
		this.canvas.setHeight(this.boardOriginalHeight)
		// //console.log(this.boardOriginalHeight)
		// //console.log(this.boardOriginalWidth)

		//	this.canvas.forceRender()
		this.zoomScale = 1
		$("#boardwrapper").css("margin", "1300px")

		document
			.getElementById("canvas-container")
			.scrollTo(BOARD_MARGIN * this.boardScale + 1200, BOARD_MARGIN * this.boardScale + 1200)
	}

	drawTiles() {
		let obsimg = document.getElementById("obstacles")

		let tile_img
		if (this.mapname === "ocean") {
			tile_img = document.getElementById("tiles_ocean")
		}
		if (this.mapname === "casino" || this.mapname === "marble" || this.mapname === "rapid") {
			tile_img = document.getElementById("tiles_casino")
		} else {
			tile_img = document.getElementById("tiles_3d")
		}
		let tileshadows = []
		for (let i = 0; i < this.Map.coordinates.length; ++i) {
			this.drawWay(i, obsimg, tile_img, tileshadows)
		}
		let tileshadowgroup = new fabric.Group(tileshadows, { evented: false })

		// this.lockFabricObject(tileshadowgroup)
		this.canvas.add(tileshadowgroup)
		this.tile_shadows = tileshadowgroup
	}
	/**	//===========================================================================================================================

	 *
	 * @param {*} i 칸 번호
	 * @param {*} isMain 메인 길인지 갈림길인지
	 */
	drawWay(i, obsimg, tileimg, tileshadows) {
		let obs_id = 0

		obs_id = this.game.shuffledObstacles[i]

		//  let index=num;
		if (obs_id === -1 || obs_id === 0) {
			if (obs_id === 0) {
				let storeimg = new fabric.Image(document.getElementById("storeimg"), {
					originX: "center",
					originY: "center",
					width: 64,
					height: 64,
					objectCaching: false,
					evented: false,
					top: this.Map.coordinates[i].y + BOARD_MARGIN,
					left: this.Map.coordinates[i].x + BOARD_MARGIN,
				})
				this.lockFabricObject(storeimg)
				this.canvas.add(storeimg)
				storeimg.scale(0.7)
			}
			this.tiles.push(null)
			return
		} //-1,0
		else {
			tileshadows.push(this.tileShadow(i))
		}
		// let img=this.obsimglist.item(index)

		let o = new fabric.Image(obsimg, {
			originX: "center",
			originY: "center",
			width: 50,
			height: 50,
			cropX: 50 * obs_id,
			cropY: 0,
			objectCaching: false,
		})

		//열매, 마법성, 흡혈귀, 카지노,빙산, 어뢰는 확대
		if (BIGGER_OBSTACLES.includes(obs_id)) {
			o.scale(0.55)
		} else {
			o.scale(0.45)
		}

		let tile_id = this.chooseTile(i)

		let t = new fabric.Image(tileimg, {
			originX: "center",
			originY: "center",
			width: TILE_IMG_SIZE,
			height: TILE_IMG_SIZE,
			cropX: TILE_IMG_SIZE * tile_id,
			cropY: 0,
			objectCaching: false,
			top: this.Map.coordinates[i].y + BOARD_MARGIN,
			left: this.Map.coordinates[i].x + BOARD_MARGIN,
		})
		t.scale(0.5)
		o.set({ top: this.Map.coordinates[i].y + BOARD_MARGIN - 2, left: this.Map.coordinates[i].x + BOARD_MARGIN - 2 })
		t.set({ top: this.Map.coordinates[i].y + BOARD_MARGIN, left: this.Map.coordinates[i].x + BOARD_MARGIN })
		let group

		if (tile_id !== 0 && this.Map.muststop.includes(i)) {
			let l = new fabric.Image(document.getElementById("tilelock"), {
				originX: "center",
				originY: "center",
				objectCaching: false,
			})
			l.scale(0.5)
			l.set({ top: this.Map.coordinates[i].y + BOARD_MARGIN, left: this.Map.coordinates[i].x + BOARD_MARGIN })

			group = new fabric.Group([t, o, l], { evented: false })
		} else {
			group = new fabric.Group([t, o], { evented: false })
		}

		this.lockFabricObjectNoOrigin(group)

		this.canvas.add(group)
		this.tiles.push(group)

		group.sendToBack()
	}
	//===========================================================================================================================

	showObjects() {
		super.showObjects()
		//주컨아이템 표시 ================================
		let diceimg = this.createCroppedProjectileImage(0)
		this.setEffectImageAttr(diceimg, -20, 15, 0.7, 0.7, 1, 0)

		let indicator = new fabric.Text("", {
			fontSize: 30,
			fill: "white",
			opacity: 1,
			evented: false,
			stroke: "black",
			strokeWidth: 1,
			top: 0,
			left: 0,
			fontFamily: "Cookierun Black",
		})
		let group = new fabric.Group([indicator, diceimg])
		this.lockFabricObject(group)
		this.canvas.add(group)
		this.dcItemIndicator = group
		this.dcItemIndicator.set({ opacity: 0 })

		//공격선=================================================================

		////console.log("tilelength"+this.tiles.length)
		let line = new fabric.Line([0, 0, 300, 300], {
			evented: false,
			originX: "left",
			fill: "red",
			stroke: "red",
			strokeWidth: 6,
			opacity: 0,
			objectCaching: false,
		})
		this.lockFabricObject(line)
		this.canvas.add(line)
		this.line = line
		//장애물 툴팁=================================================================

		let tooltip = new fabric.Text("", {
			fontSize: 20,
			fill: "white",
			textBackgroundColor: "black",
			opacity: 1,
			evented: false,
			strokeWidth: 1,
			top: 0,
			left: 0,
			fontFamily: "Do Hyeon",
		})
		this.lockFabricObject(tooltip)
		this.canvas.add(tooltip)
		this.tooltip = tooltip

		//console.log("showobjest")

		//힐=================================================================

		let healimg = document.getElementById("healimg")
		let heal = new fabric.Image(healimg, {
			evented: false,
			opacity: 0,
			left: 0,
			top: 0,
			objectCaching: false,
		})

		this.lockFabricObject(heal)
		this.canvas.add(heal)
		this.heal = heal

		//타일선택=================================================================

		for (let i = 0; i < 4; ++i) {
			let tileselectimg = new fabric.Image(document.getElementById("tileselectimg"), {
				evented: false,
				opacity: 0,
				left: 0,
				top: 0,
				objectCaching: false,
			})

			this.lockFabricObject(tileselectimg)
			this.canvas.add(tileselectimg)
			this.tileselectimgs.push(tileselectimg)
		}
		for (let i = 0; i < this.tiles.length; ++i) {
			if (this.tiles[i] === null) {
				continue
			}

			// this.tiles[i].set({
			// 	top: this.Map.coordinates[i].y + BOARD_MARGIN,
			// 	left: this.Map.coordinates[i].x + BOARD_MARGIN
			// })
		}

		// this.canvas.renderAll()

		//플레이어별 오브젝트=================================================================

		for (let i = 0; i < this.game.playerCount; ++i) {
			let img = document.getElementById("playerimg" + (this.players[i].champ + 1))
			let player = this.players[i]

			let p = new fabric.Image(img, {
				id: "player",
				left: this.Map.coordinates[0].x + PLAYER_POS_DIFF[i][0] + BOARD_MARGIN,
				top: this.Map.coordinates[0].y + PLAYER_POS_DIFF[i][1] + BOARD_MARGIN,
				objectCaching: false,
				evented: false,
				// scaleX:0.35,
				// scaleY:0.35
			})
			this.lockFabricObject(p)
			this.canvas.add(p.scale(0.35))
			// p.bringToFront()
			let playergroup = new fabric.Group([p], { evented: false })
			this.lockFabricObject(playergroup)
			this.canvas.add(playergroup)
			// playergroup.bringToFront()
			//this.playerimgs.push(p)
			player.playerimg = playergroup
			//터지는효과=================================================================

			img = document.getElementById("boom")
			let e = new fabric.Image(img, {
				evented: false,
				top: 10,
				left: 10,
				opacity: 0,
			})
			this.lockFabricObject(e)
			this.canvas.add(e.scale(0.8))
			e.bringToFront()
			player.boom = e
			// this.boom.push(e)
			//souls=================================================================

			img = document.getElementById("soul")
			let sl = new fabric.Image(img, {
				evented: false,
				top: 10,
				left: 10,
				opacity: 0.8,
				visible: false,
			})
			this.lockFabricObject(sl)
			this.canvas.add(sl.scale(0.7))
			sl.bringToFront()
			// this.souls.push(sl)
			player.soul = sl
			//coffins=================================================================

			img = document.getElementById("coffin")
			let cf = new fabric.Image(img, {
				evented: false,
				top: 10,
				left: 10,
				opacity: 0.6,
				visible: false,
			})
			this.lockFabricObject(cf)
			this.canvas.add(cf.scale(0.5))
			cf.bringToFront()
			// this.coffins.push(cf)
			player.coffin = cf
			//플레이어이름=================================================================

			let name = new fabric.Text("", {
				fontSize: 20,
				fill: "white",
				opacity: 1,
				evented: false,
				stroke: "black",
				strokeWidth: 1,
				top: 0,
				left: 0,
				fontFamily: "nanumB",
			})
			this.lockFabricObject(name)
			this.canvas.add(name)
			name.bringToFront()
			// this.nametexts.push(name)
			player.nametext = name

			//타겟선택=================================================================

			let target = new fabric.Image(document.getElementById("targetimg"), {
				opacity: 0,
				width: 128,
				height: 128,
				visible: false,
				hoverCursor: "pointer",
				objectCaching: false,
			})
			this.lockFabricObject(target)

			this.canvas.add(target.scale(0.6))
			// this.targetimgs.push(target)
			player.targetimg = target
			target.bringToFront()

			//heal=================================================================

			let heal = new fabric.Text("", {
				fontSize: 20,
				fill: "#D81B60",
				opacity: 1,
				fontWeight: "bold",
				width: 500,
				height: 500,
				evented: false,
				top: 100,
				left: 100,
				fontFamily: "Cookierun Black",
				stroke: "black",
				strokeWidth: 1,
			})
			this.lockFabricObject(heal)
			this.canvas.add(heal)
			heal.bringToFront()
			// this.dmgindicator.push(d)
			player.healindicator = heal
			//shield=================================================================

			let sd = new fabric.Text("", {
				fontSize: 40,
				fill: "#696969",
				opacity: 1,
				fontWeight: "bold",
				width: 500,
				height: 500,
				evented: false,
				top: 100,
				left: 100,
				fontFamily: "Cookierun Black",
				stroke: "black",
				strokeWidth: 1,
			})
			this.lockFabricObject(sd)
			this.canvas.add(sd)
			sd.bringToFront()
			// this.shieldindicator.push(sd)
			player.shieldindicator = sd
			//돈=================================================================

			let m = new fabric.Text("", {
				fontSize: 40,
				fill: "orange",
				opacity: 1,
				fontWeight: "bold",
				width: 500,
				height: 500,
				evented: false,
				top: 100,
				left: 100,
				fontFamily: "Cookierun Black",
				stroke: "black",
				strokeWidth: 1,
			})
			this.lockFabricObject(m)
			this.canvas.add(m)
			m.bringToFront()
			// this.moneyindicator.push(m)
			player.moneyindicator = m
			//HP frame=================================================================

			let hp_frame = new fabric.Rect({
				left: 0,
				top: 0,
				width: 204,
				height: 20,
				fill: "black",
				id: "hp_frame" + i,
				lockMovementX: true,
				lockMovementY: true,
				visible: true,
				hasControls: false,
				hasBorders: false,
				evented: false,
				lockScalingX: true,
				lockScalingY: true,
				lockRotation: true,
			})
			let hp_remain = new fabric.Rect({
				left: 2,
				top: 2,
				width: 200,
				height: 16,
				id: "hp_remain" + i,
				fill: "#08a803",
				lockMovementX: true,
				lockMovementY: true,
				visible: true,
				hasControls: false,
				hasBorders: false,
				evented: false,
				lockScalingX: true,
				lockScalingY: true,
				lockRotation: true,
			})
			let hp_lost = new fabric.Rect({
				left: 2,
				top: 2,
				width: 0,
				height: 16,
				fill: "#ff5c21",
				id: "hp_lost" + i,
				lockMovementX: true,
				lockMovementY: true,
				visible: true,
				hasControls: false,
				hasBorders: false,
				evented: false,
				lockScalingX: true,
				lockScalingY: true,
				lockRotation: true,
			})
			let hp_lost_bg = new fabric.Rect({
				left: 2,
				top: 2,
				width: 0,
				height: 16,
				fill: "#ffe699",
				id: "hp_lost_bg" + i,
				lockMovementX: true,
				lockMovementY: true,
				visible: true,
				hasControls: false,
				hasBorders: false,
				evented: false,
				lockScalingX: true,
				lockScalingY: true,
				lockRotation: true,
			})
			let hp_bg = new fabric.Rect({
				left: 2,
				top: 2,
				width: 200,
				height: 16,
				fill: "black",
				id: "hp_bg" + i,
				lockMovementX: true,
				lockMovementY: true,
				visible: true,
				hasControls: false,
				hasBorders: false,
				evented: false,
				lockScalingX: true,
				lockScalingY: true,
				lockRotation: true,
			})
			this.canvas.add(hp_frame)
			this.canvas.add(hp_remain)
			this.canvas.add(hp_lost)
			this.canvas.add(hp_bg)
			hp_frame.bringToFront()
			hp_bg.bringToFront()
			hp_lost.bringToFront()
			hp_remain.bringToFront()

			// player.hpIndicator = {
			// 	remain: hp_remain,
			// 	lost: hp_lost,
			// 	frame: hp_frame,
			// 	bg: hp_bg,
			// }
			let hpindicatorGroup = new fabric.Group([hp_frame, hp_bg, hp_lost, hp_lost_bg, hp_remain], { evented: false })
			this.lockFabricObject(hpindicatorGroup)
			this.canvas.add(hpindicatorGroup)
			player.hpIndicatorGroup = hpindicatorGroup
			hpindicatorGroup.set({ left: 100, top: 100, opacity: 0 })

			//hp bar=================================================================
			let hpbar_frame = new fabric.Rect({
				left: 300,
				top: 300,
				width: 50,
				height: 5,
				fill: "black",
				visible: false,
				evented: false,
			})
			this.lockFabricObjectNoOrigin(hpbar_frame)
			let hpbar_hp = new fabric.Rect({
				left: 301,
				top: 301,
				width: 48,
				height: 3,
				fill: this.game.getPlayerLighterColor(i),
				visible: false,
				evented: false,
			})
			this.lockFabricObjectNoOrigin(hpbar_hp)

			let hpbar_shield = new fabric.Rect({
				left: 301,
				top: 301,
				width: 0,
				height: 3,
				fill: "#AAAAAA",
				visible: false,
				evented: false,
			})
			this.lockFabricObjectNoOrigin(hpbar_shield)

			this.canvas.add(hpbar_frame)
			this.canvas.add(hpbar_hp)
			this.canvas.add(hpbar_shield)
			// hp_frame.bringToFront()
			// hp_bg.bringToFront()
			// hp_remain.bringToFront()
			// hp_lost.bringToFront()

			player.hpbar = {
				shield: hpbar_shield,
				hp: hpbar_hp,
				frame: hpbar_frame,
			}
			//이름=================================================================

			if (this.game.isTeam) {
				if (!this.players[i].team) {
					this.players[i].nametext.set("fill", "#ffa1a1")
				} else if (this.players[i].team) {
					this.players[i].nametext.set("fill", "#a6c8ff")
				}
			} else {
				this.players[i].nametext.set("fill", COLOR_LIST_BG[i])
			}
		}
		//이펙트, overlay select image=================================================================

		for (let i = 0; i < 3; ++i) {
			let e = new fabric.Text("", {
				fontSize: 50,
				fill: "purple",
				opacity: 1,
				fontWeight: "bold",
				width: 500,
				height: 500,
				evented: false,
				top: 100,
				left: 100,
				fontFamily: "Cookierun Black",
				stroke: "black",
				strokeWidth: 1,
			})
			this.lockFabricObject(e)
			this.canvas.add(e)
			this.canvas.moveTo(e, 1)
			this.effectindicator.push(e)

			let overlayimg = new fabric.Image(document.getElementById("playerimg1"), {
				visible: false,
				hoverCursor: "pointer",
				opacity: 1,
				width: 128,
				height: 128,
			})
			this.lockFabricObject(overlayimg)
			this.canvas.add(overlayimg)
			this.overlapSelectorImgs.push(overlayimg)
		}
		this.tile_shadows.sendToBack()

		let finish = new fabric.Image(document.getElementById("finish"), {
			objectCaching: false,
			visible: false,
			evented: false,
		})
		finish.scale(0.6)
		this.canvas.add(finish)
		this.lockFabricObject(finish)
		this.tempFinish = finish
		finish.bringToFront()
	}
	//===========================================================================================================================

	showProjectileRange(size) {
		let projrange = []
		for (let i = 0; i < size; ++i) {
			let l = new fabric.Image(document.getElementById("tileselect"), {
				left: 0,
				top: 0,
				lockMovementX: true,
				lockMovementY: true,
				visible: false,
				hasControls: false,
				hasBorders: false,
				lockScalingX: true,
				lockScalingY: true,
				lockRotation: true,
				originX: "center",
				originY: "center",
				objectCaching: false,
			})
			projrange.push(l)
			this.canvas.add(l)
		}
		return projrange
	}

	//===========================================================================================================================

	createCroppedEffectImage(name) {
		if (!this.game.strRes.VISUAL_EFFECTS[name]) return

		let spritePos = this.game.strRes.VISUAL_EFFECTS[name].sprite

		let img = new fabric.Image(document.getElementById("visual_effect_sprite"), {
			evented: false,
			objectCaching: false,
			width: VISUAL_EFFECT_SPRITE_SIZE,
			height: VISUAL_EFFECT_SPRITE_SIZE,
			cropX: VISUAL_EFFECT_SPRITE_SIZE * spritePos.x,
			cropY: VISUAL_EFFECT_SPRITE_SIZE * spritePos.y,
		})
		this.lockFabricObject(img)
		this.canvas.add(img)
		return img
	}
	createCroppedProjectileImage(pos) {
		const size = 64
		let img = new fabric.Image(document.getElementById("projectile_sprite"), {
			evented: false,
			objectCaching: false,
			width: size,
			height: size,
			cropX: size * pos,
			cropY: 0,
			scaleX: 0.8,
			scaleY: 0.8,
		})
		this.lockFabricObject(img)
		this.canvas.add(img)
		img.bringToFront()
		return img
	}
	createCroppedProjectileRangeImage(pos) {
		const size = 55
		let img = new fabric.Image(document.getElementById("projectile_range_sprite"), {
			evented: false,
			objectCaching: false,
			width: size,
			height: size,
			cropX: size * pos,
			cropY: 0,
			visible: false,
		})
		this.lockFabricObject(img)
		this.canvas.add(img)
		return img
	}
	createEffectImageFromId(elementId, pos, scaleX, scaleY, opacity, angle) {
		let img = new fabric.Image(document.getElementById(elementId), {
			evented: false,
			objectCaching: false,
		})
		this.lockFabricObject(img)
		this.canvas.add(img)
		this.setEffectImageAttr(img, pos.x, pos.y, scaleX, scaleY, opacity, angle)
		return img
	}
	//===========================================================================================================================

	//===========================================================================================================================

	getBearingAngle(pos1, pos2) {
		let angle
		if (pos1.x < pos2.x) {
			angle = 90 + Math.atan((pos2.y - pos1.y) / (pos2.x - pos1.x)) * (180 / Math.PI)
		} else {
			angle = 270 + Math.atan((pos1.y - pos2.y) / (pos1.x - pos2.x)) * (180 / Math.PI)
		}
		return angle
	}
	//===========================================================================================================================

	animateProjTrajectory(proj, speed) {
		let dest = this.getTilePos(proj.scope[0])
		let start = this.getPlayerPos(proj.owner)
		let img = this.createProjIcon(proj.name)
		console.log("animate projectile traj" + proj.name)
		switch (proj.name) {
			case "ghost_r":
			case "reaper_w":
			case "sniper_w":
			case "tree_w":
			case "kraken_q":
				this.setEffectImageAttr(img, start.x, start.y, 0.6, 0.6, 1, this.getBearingAngle(start, dest))
				break
			case "magician_r":
				this.setEffectImageAttr(img, start.x, start.y, 0.6, 0.6, 1, this.getBearingAngle(start, dest) + 90)
				break
		}
		this.animateX(img, dest.x, speed)
		this.animateY(img, dest.y, speed)
		setTimeout(() => img.set({ opacity: 0 }), speed + 100)

		this.removeImageAfter(img, 2000)
	}

	//===========================================================================================================================

	animateTrajectory(target, origin, type, speed) {
		//console.log("trajectory" + type)
		let pos1 = this.getTilePos(origin)
		let pos2 = this.getTilePos(target)
		let img
		switch (type) {
			case "dinosaur_r":
				img = this.createCroppedEffectImage("dinosaur_r")
				this.setEffectImageAttr(img, pos1.x, pos1.y, 0.3, 0.6, 1, this.getBearingAngle(pos1, pos2))
				this.animateX(img, pos2.x, speed)
				this.animateY(img, pos2.y, speed)

				break
			case "sniper_r":
				img = this.createCroppedEffectImage("sniper_r_trajectory")
				this.setEffectImageAttr(img, pos1.x, pos1.y, 0.4, 0.6, 1, this.getBearingAngle(pos1, pos2))
				this.animateX(img, pos2.x, speed)
				this.animateY(img, pos2.y, speed)
				break
			case "sniper_q":
				img = this.createCroppedEffectImage("sniper_q_trajectory")
				this.setEffectImageAttr(img, pos1.x, pos1.y, 0.4, 0.6, 1, this.getBearingAngle(pos1, pos2))
				this.animateX(img, pos2.x, speed)
				this.animateY(img, pos2.y, speed)
				break
			case "sniper_q_root":
				img = this.createCroppedEffectImage("sniper_q_trajectory")
				this.setEffectImageAttr(img, pos1.x, pos1.y, 0.6, 0.9, 1, this.getBearingAngle(pos1, pos2))
				this.animateX(img, pos2.x, speed)
				this.animateY(img, pos2.y, speed)
				break
			case "ghost_w_q":
				img = this.createCroppedEffectImage("ghost_q_trajectory")
				this.setEffectImageAttr(img, pos1.x, pos1.y, 0.7, 0.7, 1, this.getBearingAngle(pos1, pos2))
				this.animateX(img, pos2.x, speed)
				this.animateY(img, pos2.y, speed)
				break
			case "ghost_q":
				img = this.createCroppedEffectImage("ghost_q_trajectory")
				this.setEffectImageAttr(img, pos1.x, pos1.y, 0.4, 0.4, 1, this.getBearingAngle(pos1, pos2))
				this.animateX(img, pos2.x, speed)
				this.animateY(img, pos2.y, speed)
				break
			case "tree_q":
				img = this.createCroppedEffectImage("tree_q_trajectory")
				this.setEffectImageAttr(img, pos1.x, pos1.y, 0.4, 0.4, 1, 0)
				this.animateX(img, pos2.x, speed)
				this.animateY(img, pos2.y, speed)
				this.animateAngle(img, 180, speed)
				break
			case "tree_r":
			case "tree_wither_r":
				img = this.createCroppedEffectImage("tree_r")
				this.setEffectImageAttr(img, pos1.x, pos1.y, 0.6, 0.6, 1, this.getBearingAngle(pos1, pos2))
				this.animateX(img, pos2.x, speed)
				this.animateY(img, pos2.y, speed)
				break
			case "hacker_q":
				img = this.createCroppedEffectImage("hacker_q_proj")
				this.setEffectImageAttr(img, pos1.x, pos1.y, 0.3, 0.3, 1, 0)
				this.animateX(img, pos2.x, speed)
				this.animateY(img, pos2.y, speed)
				this.animateAngle(img, 180, speed)
				break

			case "bird_q":
			case "bird_w_hit":
				img = this.createCroppedEffectImage("bird_q_proj")
				this.setEffectImageAttr(img, pos1.x, pos1.y, 0.7, 0.7, 1, this.getBearingAngle(pos1, pos2))
				speed *= 3
				this.animateX(img, this.extrapolate(pos1.x, pos2.x, 3), speed, true)
				this.animateY(img, this.extrapolate(pos1.y, pos2.y, 3), speed, true)
				break
		}

		setTimeout(() => {
			if (img != null) img.set({ opacity: 0 })
		}, speed + 100)

		this.removeImageAfter(img, 2000)
	}
	//===========================================================================================================================
	showMultiPositionEffects(positions, type) {
		//console.log("showMultiPositionEffects"+type)
		positions = positions.map((p) => this.getTilePos(p))

		let scale = 1
		let img
		let img2
		let pos
		let effectImages = []
		switch (type) {
			case "basicattack":
				let type2 = Math.random() > 0.5

				img = this.createCroppedEffectImage("sweep1")
				if (type2) img = this.createCroppedEffectImage("sweep2")
				else img = this.createCroppedEffectImage("sweep1")
				pos = midpoint(positions[0], positions[1])
				let scale = Math.max(1, distance(positions[0], positions[1]) / 150)
				let angleRange = 10 + Math.random() * 30
				if (type2) angleRange = 0

				let angleoffset = Math.random() * 50 - 25
				let angle = this.getBearingAngle(positions[0], positions[1]) + angleoffset

				if (positions[0].x === positions[1].x && positions[0].y === positions[1].y) {
					angle = Math.random() * 180
				}

				this.setEffectImageAttr(img, pos.x, pos.y, scale, scale, 1, angle - angleRange)
				this.animateOpacity(img, 0, 1200)
				this.animateAngle(img, angle + angleRange, 250)
				effectImages.push(img)
				break

			case "magician_w_q":
			case "magician_q":
				pos = midpoint(positions[0], positions[1])
				img = this.createCroppedEffectImage("lightning")
				this.setEffectImageAttr(
					img,
					pos.x,
					pos.y,
					1,
					distance(positions[0], positions[1]) / VISUAL_EFFECT_SPRITE_SIZE,
					1,
					this.getBearingAngle(positions[0], positions[1])
				)

				effectImages.push(img)
				this.animateOpacity(img, 0, 1200)
				break
			case "bird_r_w_hit":
			case "bird_r_hit":
				let sourcepos = { x: positions[0].x, y: positions[0].y - 50 }
				pos = midpoint(sourcepos, positions[1])
				img = this.createCroppedEffectImage("bird_r_fire")
				this.setEffectImageAttr(
					img,
					pos.x,
					pos.y,
					1,
					distance(sourcepos, positions[1]) / VISUAL_EFFECT_SPRITE_SIZE,
					1,
					this.getBearingAngle(sourcepos, positions[1])
				)

				effectImages.push(img)
				this.animateOpacity(img, 0, 1200)

				img2 = this.createCroppedEffectImage("bird_r")
				this.setEffectImageAttr(img2, positions[0].x, positions[0].y - 30, 1.5, 1.5, 0.8, 0)
				this.animateOpacity(img2, 0, 1700)
				effectImages.push(img2)
				break
			case "hacker_r":
				pos = midpoint(positions[0], positions[1])
				img = this.createCroppedEffectImage("magician_r_lightning")
				this.setEffectImageAttr(
					img,
					pos.x,
					pos.y,
					1,
					distance(positions[0], positions[1]) / VISUAL_EFFECT_SPRITE_SIZE,
					1,
					this.getBearingAngle(positions[0], positions[1])
				)
				effectImages.push(img)
				this.animateOpacity(img, 0, 1000)
			case "hacker_q":
				setTimeout(() => {
					let hackerData = this.createCroppedEffectImage("data")
					let duration = distance(positions[0], positions[1]) * 1.5
					this.setEffectImageAttr(
						hackerData,
						positions[1].x,
						positions[1].y,
						0.5,
						0.5,
						1,
						this.getBearingAngle(positions[1], positions[0])
					)
					this.animateX(hackerData, positions[0].x, duration)
					this.animateY(hackerData, positions[0].y, duration)
					this.removeImageAfter(hackerData, duration + 100)
				}, 600)
				break
		}
		effectImages.forEach((e) => this.removeImageAfter(e, 3000))
	}

	async showAttackEffect(data) {
		console.log(data)
		for (let i = 0; i < data.targets.length; ++i) {
			let t = data.targets[i]
			// //console.log(data.visualeffect)
			switch (data.visualeffect) {
				case "magician_w_q":
				case "magician_q":
					this.showMultiPositionEffects(
						i === 0 ? [data.sourcePos, t.pos] : [data.targets[i - 1].pos, t.pos],
						data.visualeffect
					)
					break
				case "bird_r_w_hit":
				case "bird_r_hit":
				case "hacker_r":
				case "hacker_q":
				case "basicattack":
					this.showMultiPositionEffects([data.sourcePos, t.pos], data.visualeffect)
					break
				case "hacker_w":
				case "reaper_q":
					let pos1 = this.getTilePos(data.sourcePos)
					let pos2 = this.getTilePos(t.pos)
					this.line.set({ opacity: 1, x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y }).bringToFront()
					setTimeout(() => this.line.set({ opacity: 0 }), 400)

					break
			}
			this.showEffect(t.pos, data.visualeffect, t.damage, data.source)
			if (t.flags.includes("shield")) {
				this.showEffect(t.pos, "shield", t.damage, data.source)
			}
			await sleep(ATTACK_EFFECT_INTERVAL)
		}
	}
	/**
	 *
	 * @param {*} position  position of target
	 * @param {*} type type
	 * @param {*} change hp change amount (if related to hp)
	 */
	showEffect(position, type, change) {
		//console.log("showeffect" + type)
		let pos = this.getTilePos(position)
		let scale = 1
		let addedEffectImg = null
		let addedEffectImg2 = null
		let addedEffectImg3 = null
		switch (type) {
			//일반
			case "hit":
			case "bird_q":
			case "reaper_w":
				this.defaultEffect(position, change)
				this.game.playSound("hit")
				break
			case "basicattack":
				this.defaultEffect(position, change)
				this.game.playSound("basicattack")
				break
			case "reaper_w":
				this.defaultEffect(position, change)
				this.game.playSound("wind")
				break
			//덫
			case "trap":
				this.defaultEffect(position, change)
				this.game.playSound("trap")
				break
			//점화
			case "magician_w_burn":
			case "bird_r_burn":
			case "fire":
				addedEffectImg = this.createCroppedEffectImage("fire")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 0.5, 0.5, 0.9, 0)
				this.animateOpacity(addedEffectImg, 0, 1200)
				break
			//폭발
			case "explode":
				this.game.playSound("largeexplode")
				scale = 0.8
				if (change < -50) {
					scale = 2
				}
				addedEffectImg = this.createCroppedEffectImage("explode")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y - 20, scale, scale, 0.9, 0)
				this.animateOpacity(addedEffectImg, 0, 1700)
				this.animateScaleX(addedEffectImg, scale + 1, 1700)
				this.animateScaleY(addedEffectImg, scale + 1, 1700)

				break
			//칼
			case "knifeslash":
				this.game.playSound("knifeslash")
				//	//console.log("knife")
				addedEffectImg = this.createCroppedEffectImage("knifeslash")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 1, 1, 0.7, 0)
				this.animateOpacity(addedEffectImg, 0, 2000)
				break
			//처형
			case "stab":
				this.game.playSound("stab")
				addedEffectImg = this.createCroppedEffectImage("knifeslash")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 1.5, 1.5, 0.7, 0)
				this.animateOpacity(addedEffectImg, 0, 2000)
				break
			//방어막 깨질때
			case "shield":
				this.game.playSound("glassbreak")
				addedEffectImg = this.createCroppedEffectImage("shield")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 1, 1, 0.7, 0)
				this.animateOpacity(addedEffectImg, 0, 2000)
				break
			//쓰나미
			case "wave":
				this.game.playSound("wave")
				this.defaultEffect(position, change)
				break
			//이펙트만(노데미지)
			case "nodmg_hit":
				this.defaultEffect(position, change)

				break
			//번개
			case "lightning":
				this.game.playSound("lightning")
				this.game.playSound("hit")
				this.defaultEffect(position, change)
				addedEffectImg = this.createCroppedEffectImage("lightning")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y - 90, 1.6, 1.6, 1, 0)
				this.animateOpacity(addedEffectImg, 0, 1000)

				break
			case "elephant_q":
				this.game.playSound("metal")
				this.game.playSound("hit")

				this.defaultEffect(position, change)
				addedEffectImg = this.createCroppedEffectImage("elephant_q")
				this.setEffectImageAttr(addedEffectImg, pos.x - 50, pos.y, 1, 1, 1, -90)
				this.animateOpacity(addedEffectImg, 0, 1000)
				this.animateAngle(addedEffectImg, 0, 200)

				break
			case "elephant_r":
				this.game.playSound("2r")
				this.game.playSound("horse")
				addedEffectImg3 = this.createCroppedEffectImage("elephant_r_horse")
				this.setEffectImageAttr(addedEffectImg3, pos.x - 200, pos.y, 0.7, 0.7, 0.9, 0)
				this.animateX(addedEffectImg3, pos.x, 700)
				setTimeout(() => {
					this.removeImage(addedEffectImg3)
				}, 700)

				addedEffectImg = this.createCroppedEffectImage("elephant_r_energy")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y - 50, 1.5, 0.5, 1, 0)
				this.animateOpacity(addedEffectImg, 0, 1000)
				this.animateScaleY(addedEffectImg, 5.5, 700)

				addedEffectImg2 = this.createCroppedEffectImage("elephant_r_shield")
				this.setEffectImageAttr(addedEffectImg2, pos.x, pos.y, 1.5, 1.5, 0.9, 0)
				this.animateOpacity(addedEffectImg2, 0, 3000)

				break
			case "reaper_q":
				this.game.playSound("stab")
				this.game.playSound("hit")

				this.defaultEffect(position, change)
				addedEffectImg = this.createCroppedEffectImage("reaper_q")
				this.setEffectImageAttr(addedEffectImg, pos.x - 20, pos.y - 50, 0.7, 0.7, 1, 0)
				this.animateOpacity(addedEffectImg, 0, 1500)
				this.animateAngle(addedEffectImg, 90, 300)

				break
			case "reaper_r":
				this.game.playSound("1r")
				this.defaultEffect(position, change)
				addedEffectImg = this.createCroppedEffectImage("reaper_r")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y - 300, 0.6, 0.6, 0.7, 0)
				this.animateOpacity(addedEffectImg, 0, 3000)
				this.animateY(addedEffectImg, pos.y, 500)

				addedEffectImg2 = this.createCroppedEffectImage("crack")
				this.setEffectImageAttr(addedEffectImg2, pos.x, pos.y, 1.5, 1.5, 1, 0)
				this.animateOpacity(addedEffectImg2, 0, 2000)
				break
			case "ghost_w_q":
				this.game.playSound("curse")
			case "ghost_q":
				this.defaultEffect(position, change)
				this.game.playSound("hit")
				this.game.playSound("ghost")
				addedEffectImg = this.createCroppedEffectImage("ghost_q")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 0.8, 0.8, 0.8, 0)
				this.animateOpacity(addedEffectImg, 0, 1500)

				break
			case "ghost_r":
				this.game.playSound("3r")
				this.defaultEffect(position, change)
				addedEffectImg = this.createCroppedEffectImage("ghost_r")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 2, 2, 0.7, 0)
				this.animateOpacity(addedEffectImg, 0, 1500)

				break
			case "dinosaur_q":
				this.defaultEffect(position, change)
				this.game.playSound("hit")
				this.game.playSound("knifeslash")
				addedEffectImg = this.createCroppedEffectImage("dinosaur_q")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 0.6, 0.8, 0.7, Math.random() * 180)
				this.animateOpacity(addedEffectImg, 0, 1500)

				break
			case "dinosaur_r":
				this.game.playSound("4r")
				scale = 2
				addedEffectImg = this.createCroppedEffectImage("dinosaur_r")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y + 20, 1, 1, 0.9, 0)
				addedEffectImg.set({
					originY: "bottom",
				})
				this.animateOpacity(addedEffectImg, 0, 2700)
				this.animateScaleY(addedEffectImg, 2.5, 1100)

				break
			case "sniper_q":
			case "sniper_q_root":
				this.game.playSound("gun")
				this.game.playSound("hit")

				this.defaultEffect(position, change)
				addedEffectImg = this.createCroppedEffectImage("blood")
				this.setEffectImageAttr(addedEffectImg, pos.x + 30, pos.y + 30, 0.8, 0.8, 0.7, 0)
				this.animateOpacity(addedEffectImg, 0, 400)
				this.animateScaleX(addedEffectImg, 1.8, 200)
				this.animateScaleY(addedEffectImg, 1.8, 200)

				break
			case "tree_w":
				this.game.playSound("tree_plant")
			case "sniper_w":
				this.game.playSound("web")
				this.game.playSound("hit")
				this.defaultEffect(position, change)
				break
			case "sniper_r":
				this.game.playSound("5r")
				this.defaultEffect(position, change)
				scale = 3

				addedEffectImg = this.createCroppedEffectImage("blood")
				this.setEffectImageAttr(addedEffectImg, pos.x + 30, pos.y + 30, 1.5, 1.5, 0.7, 0)
				this.animateOpacity(addedEffectImg, 0, 400)
				this.animateScaleX(addedEffectImg, 2.5, 200)
				this.animateScaleY(addedEffectImg, 2.5, 200)

				addedEffectImg2 = this.createCroppedEffectImage("explode")
				this.setEffectImageAttr(addedEffectImg2, pos.x, pos.y - 20, 2, 2, 0.7, 0)
				this.animateOpacity(addedEffectImg2, 0, 1700)
				this.animateScaleX(addedEffectImg2, 4, 1700)
				this.animateScaleY(addedEffectImg2, 4, 1700)

				break

			case "magician_w_q":
				this.game.playSound("ignite")
				// scale = 4
				addedEffectImg = this.createCroppedEffectImage("fire")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y - 20, 0.8, 0.8, 1, 0)
				this.animateOpacity(addedEffectImg, 0, 2000)

			case "magician_q":
				this.defaultEffect(position, change)
				this.game.playSound("hit")
				this.game.playSound("magic")
				addedEffectImg = this.createCroppedEffectImage("magician_q")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 1.5, 1.5, 0.8, 0)
				this.animateOpacity(addedEffectImg, 0, 1600)
				break
			case "magician_r":
				this.game.playSound("6r")
				this.defaultEffect(position, change)
				addedEffectImg = this.createCroppedEffectImage("magician_r_lightning")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y - 80, 1.3, 1.3, 1, 0)
				this.animateOpacity(addedEffectImg, 0, 700)
				addedEffectImg2 = this.createCroppedEffectImage("magician_r_circle")
				this.setEffectImageAttr(addedEffectImg2, pos.x, pos.y, 1.5, 1.5, 1, 0)
				this.animateOpacity(addedEffectImg2, 0, 1500)

				break
			case "kraken_q":
			case "kraken_w":
				this.game.playSound("water")
				this.game.playSound("hit")
				this.defaultEffect(position, change)
				break
			case "kraken_w_wave":
				addedEffectImg = this.createCroppedEffectImage("kraken_w_wave")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 0.3, 0.3, 1, 0)
				this.animateScaleY(addedEffectImg, 3, 700)
				this.animateScaleX(addedEffectImg, 3, 700)
				this.animateOpacity(addedEffectImg, 0, 900)
				break
			case "kraken_r":
				this.game.playSound("water")
				this.game.playSound("7r")
				addedEffectImg = this.createCroppedEffectImage("kraken_r_tenacle")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y + 20, 0.9, 0.9, 1, 0)
				this.animateScaleY(addedEffectImg, 1.5, 600)
				this.animateY(addedEffectImg, pos.y - 20, 600)
				setTimeout(() => {
					addedEffectImg.set({ opacity: 0 })
				}, 1000)

				addedEffectImg2 = this.createCroppedEffectImage("kraken_r_water")
				this.setEffectImageAttr(addedEffectImg2, pos.x, pos.y, 0.9, 0.9, 1, 0)
				this.animateOpacity(addedEffectImg2, 0, 2000)

				break
			case "bird_w_hit":
				this.game.playSound("hit")
				this.game.playSound("bird")
				this.defaultEffect(position, change)
				addedEffectImg = this.createCroppedEffectImage("bird_w")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 0.5, 0.5, 1, 0)
				this.animateOpacity(addedEffectImg, 0, 1000)
				this.animateScaleY(addedEffectImg, 0.8, 400)
				this.animateScaleX(addedEffectImg, 0.8, 400)
				this.animateY(addedEffectImg, pos.y - 30, 1000)

				break
			case "bird_r_w_hit":
				this.game.playSound("bird")
				// this.game.playSound("8r_hit")
				addedEffectImg = this.createCroppedEffectImage("bird_w")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 0.5, 0.5, 1, 0)
				this.animateOpacity(addedEffectImg, 0, 1000)
				this.animateScaleY(addedEffectImg, 0.8, 400)
				this.animateScaleX(addedEffectImg, 0.8, 400)
				this.animateY(addedEffectImg, pos.y - 30, 1000)

			case "bird_r_hit":
				// //console.log(skillfrom + "bird_r_hit")
				// pos = this.getPlayerPos(skillfrom)
				this.game.playSound("8r_hit")
				this.defaultEffect(position, change)

				addedEffectImg2 = this.createCroppedEffectImage("crack")
				this.setEffectImageAttr(addedEffectImg2, pos.x, pos.y, 1.5, 1.5, 1, 0)
				this.animateOpacity(addedEffectImg2, 0, 2000)
				break
			case "bird_r":
				this.game.playSound("8r")
				// this.defaultEffect(position, change)
				addedEffectImg = this.createCroppedEffectImage("bird_r")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y - 30, 2.3, 2.3, 0.8, 0)
				this.animateOpacity(addedEffectImg, 0, 1700)

				break
			case "tree_plant":
				this.game.playSound("tree_plant_hit")
				this.defaultEffect(position, change)
				addedEffectImg = this.createCroppedEffectImage("tree_plant")
				this.setEffectImageAttr(addedEffectImg, pos.x + Math.random() * 20 - 10, pos.y + 30, 0.8, 0.8, 0.8, 0)
				this.animateOpacity(addedEffectImg, 0, 700)
				this.animateY(addedEffectImg, pos.y, 300)

				break
			case "tree_wither_r":
				this.game.playSound("tree_plant_hit")
			case "tree_r":
			case "tree_wither_r":
				this.game.playSound("hit")
				this.game.playSound("9r")
				this.defaultEffect(position, change)
				addedEffectImg = this.createCroppedEffectImage("tree_r")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y + 30, 0.7, 0.7, 0.8, 0)
				this.animateOpacity(addedEffectImg, 0, 700)
				this.animateY(addedEffectImg, pos.y, 1500)

				addedEffectImg2 = this.createCroppedEffectImage("crack")
				this.setEffectImageAttr(addedEffectImg2, pos.x, pos.y, 1.5, 1.5, 1, 0)
				this.animateOpacity(addedEffectImg2, 0, 2000)
				break
			case "tree_q":
				this.game.playSound("fruit_crush")
				this.game.playSound("water")
				this.game.playSound("hit")

				this.defaultEffect(position, change)
				addedEffectImg = this.createCroppedEffectImage("tree_q")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 0.5, 0.5, 0.8, 0)
				this.animateOpacity(addedEffectImg, 0, 1600)
				this.animateScaleY(addedEffectImg, 1.5, 700)
				this.animateScaleX(addedEffectImg, 1.5, 700)

				break
			case "hacker_r":
				this.defaultEffect(position, change)
				this.game.playSound("10r")
				this.game.playSound("hit")

				addedEffectImg = this.createCroppedEffectImage("hacker_r")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 1.7, 1.7, 0.9, 0)
				this.animateOpacity(addedEffectImg, 0, 2000)
				addedEffectImg2 = this.createCroppedEffectImage("hacker_r_syringe")
				this.setEffectImageAttr(addedEffectImg2, pos.x + 100, pos.y - 100, 1, 1, 0.8, 0)
				this.animateOpacity(addedEffectImg2, 0, 2000)
				this.animateX(addedEffectImg2, pos.x + 50, 300)
				this.animateY(addedEffectImg2, pos.y - 50, 300)
				break
			case "hacker_q":
				addedEffectImg = this.createCroppedEffectImage("hacker_q")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 1.2, 2, 1, 0)
				this.animateOpacity(addedEffectImg, 0, 1600)
				this.animateScaleX(addedEffectImg, 2, 400)
			case "hacker_w":
				this.game.playSound("hit")
				this.game.playSound("hack")
				this.defaultEffect(position, change)
				addedEffectImg2 = this.createCroppedEffectImage("bluescreen")
				this.setEffectImageAttr(addedEffectImg2, pos.x - 15, pos.y - 15, 0.7, 0.7, 0.6, 0)
				this.animateOpacity(addedEffectImg2, 0, 1600)
				break
			case "revive":
				this.game.playSound("revive")
				addedEffectImg = this.createCroppedEffectImage("revive")
				this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 0.5, 0.5, 1, 0)
				this.animateOpacity(addedEffectImg, 0, 1300)
				this.animateScaleY(addedEffectImg, 1.4, 400)
				this.animateScaleX(addedEffectImg, 1.4, 400)

				break
			case "subway_local":
			case "subway_rapid":
			case "subway_express":
				this.animateTrain(type, position)
				break
			default:
				this.game.playSound(type)
				break
		}

		this.removeImageAfter(addedEffectImg, 3000)
		this.removeImageAfter(addedEffectImg2, 3000)
		this.removeImageAfter(addedEffectImg3, 3000)
	}
	//===========================================================================================================================

	defaultEffect(position, change) {
		let pos = this.getTilePos(position)

		let scale = 0.7
		if (change < -99) {
			scale = 1.5
		}
		if (change < -299) {
			scale = 2.3
		}
		let boomeffect = this.createCroppedEffectImage("hit")
		this.setEffectImageAttr(boomeffect, pos.x, pos.y, scale, scale, 0.7, 0)
		this.animateOpacity(boomeffect, 0, 700)
		this.animateScaleX(boomeffect, scale + 0.7, 700)
		this.animateScaleY(boomeffect, scale + 0.7, 700)
		this.removeImageAfter(boomeffect, 1000)
	}
	//===========================================================================================================================

	defaultEffectAt(effectImg, posX, posY) {
		let scale = 0.7
		this.setEffectImageAttr(effectImg, posX, posY, scale, scale, 1, 0)
		this.animateOpacity(effectImg, 0, 700)
		this.animateScaleX(effectImg, scale + 0.5, 700)
		this.animateScaleY(effectImg, scale + 0.5, 700)
		// this.removeImageAfter(boomeffect,1000)
	}
	//===========================================================================================================================

	changeShield(target, shield, change, indicate) {
		//	//console.log("changehield" + shield)
		change = Math.floor(change)
		this.setHp(target, this.players[target].hp, this.players[target].maxhp, shield)

		if (!indicate) return

		let pos = this.getPlayerPos(target)

		let x = pos.x + Math.random() * 20
		let y = pos.y + Math.random() * 20 - 20
		this.players[target].shieldindicator.set({ top: y, left: x, opacity: 1 }).bringToFront()

		this.players[target].shieldindicator.set("text", String(change))

		if (change > 0) {
			this.players[target].shieldindicator.set("text", "+" + String(change))
		}
		let time = this.getMoveSpeed("indicator")
		this.animateOpacity(this.players[target].shieldindicator, 0, time)
		this.animateYEaseOut(this.players[target].shieldindicator, y - 50, time)
	}
	//===========================================================================================================================

	animateHeal(data) {
		let target = data.turn
		let change = data.change
		let type = data.type
		change = Math.floor(change)
		let pos = this.getPlayerPos(target)
		if (type === "heal") {
			this.game.playSound("heal")
			let sc = 1
			if (change > 100) {
				sc = 2.5
			}
			this.setEffectImageAttr(this.heal, pos.x, pos.y - 40 * sc, 1, sc, 1, 0)
			this.animateOpacity(this.heal, 0, this.modifyMoveSpeed(3000))
		}
		// this.game.ui.changeHP(data.turn, data.currhp, data.currmaxhp)
		this.setHp(data.turn, data.currhp, data.currmaxhp, data.currshield)
		if (type === "heal_simple" || type === "heal") this.animateHP(data)
	}
	//===========================================================================================================================

	animateDamage(data) {
		let target = data.turn

		// let change = data.change
		// change = Math.floor(change)
		// let skillfrom = data.source

		if (target === this.game.myturn) {
			$(".red-overlay").css("opacity", "100%")
			$(".red-overlay").animate(
				{
					opacity: 0,
				},
				300
			)
		}

		// if (skillfrom >= 0 && data.skillTrajectorySpeed === 0) {
		// 	let pos1 = this.getPlayerPos(target)
		// 	let pos2 = this.getPlayerPos(skillfrom)

		// 	//this.line.set({ opacity: 1, x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y }).bringToFront()
		// 	//setTimeout(() => this.line.set({ opacity: 0 }), 400)
		// }

		// if (type !== "noeffect") {
		// //	this.showEffect(target, type, change, skillfrom)

		// 	//방어막에 막힌경우
		// 	if (data.isBlocked) {
		// 	//	this.showEffect(target, "shield", change, skillfrom)
		// 	}
		// }
		// this.game.ui.changeHP(data.turn, data.currhp, data.currmaxhp)
		this.setHp(data.turn, data.currhp, data.currmaxhp, data.currshield)
		this.animateHP(data)
	}
	//===========================================================================================================================

	setHp(target, hp, maxhp, shield) {
		//console.log("setHP",target,hp,maxhp,shield)
		hp = Math.max(0, hp)
		shield = Math.max(0, shield)
		this.players[target].hp = hp
		this.players[target].maxhp = maxhp

		let hpbar_hp = this.players[target].hpbar.hp
		let hpbar_frame = this.players[target].hpbar.frame
		let hpbar_shield = this.players[target].hpbar.shield

		let pos1 = this.getPlayerPos(target)
		let healthPixels = Math.floor((hp / Math.max(maxhp, hp + shield)) * 48)
		let shieldPixels = Math.floor((shield / Math.max(maxhp, hp + shield)) * 48)

		hpbar_frame.set({ visible: true, left: pos1.x - HPBAR_OFFSET_X, top: pos1.y - HPBAR_OFFSET_Y })
		hpbar_hp.set({
			visible: true,
			left: pos1.x - HPBAR_OFFSET_X + 1,
			top: pos1.y - HPBAR_OFFSET_Y + 1,
			width: healthPixels,
		})
		hpbar_shield.set({
			visible: true,
			left: pos1.x - HPBAR_OFFSET_X + 1 + healthPixels,
			top: pos1.y - HPBAR_OFFSET_Y + 1,
			width: shieldPixels,
		})
	}
	onStep() {
		this.game.playSound("step")
	}
	async shakeHPBar(indicators, originX, originY, magnitude) {
		if (this.gameSpeed > 1.5) return
		indicators.set({
			left: originX + (20 + Math.random() * 10) * magnitude,
			top: originY + (10 + Math.random() * 10) * magnitude,
		})
		await sleep(50)
		indicators.set({
			left: originX - (20 + Math.random() * 10) * magnitude,
			top: originY - (10 + Math.random() * 10) * magnitude,
		})
		await sleep(50)
		indicators.set({
			left: originX + (10 + Math.random() * 5) * magnitude,
			top: originY + (5 + Math.random() * 5) * magnitude,
		})
		await sleep(50)
		indicators.set({
			left: originX - (10 + Math.random() * 5) * magnitude,
			top: originY - (5 + Math.random() * 5) * magnitude,
		})
		await sleep(50)
		indicators.set({
			left: originX,
			top: originY,
		})
	}

	async showHPBarIndicator(target, hp, maxhp, change) {
		let health = (hp / maxhp) * 200
		let lost = -200 * (change / maxhp)
		if (hp < 0) {
			lost = (200 * (-1 * change + hp)) / maxhp
			health = 0
		}

		let pos1 = this.getPlayerPos(target)
		const indicators = this.players[target].hpIndicatorGroup
		indicators.set({
			visible: true,
			opacity: 1,
			left: pos1.x - HEALTHBAR_FRAME_OFFSET_X,
			top: pos1.y - HEALTHBAR_FRAME_OFFSET_Y,
		})

		const [hp_frame, hp_bg, hp_lost, hp_lost_bg, hp_remain] = indicators._objects
		this.players[target].clearhpIndicatorTimeout()

		hp_lost.setGradient("fill", {
			y1: 0,
			x1: 0,
			y2: 0,
			x2: lost,
			colorStops: {
				0: "yellow",
				0.3: "yellow",
				0.6: "orange",
				1: "red",
			},
		})

		// hp_frame.bringToFront()
		// hp_bg.bringToFront()
		// hp_lost.bringToFront()
		// hp_remain.bringToFront()
		hp_frame.set({ left: 0, top: 0 })
		hp_bg.set({ left: 2, top: 2 })
		hp_lost_bg.set({ opacity: 0 })
		hp_lost.set({ opacity: 0 })

		hp_remain.set({
			left: 2,
			top: 2,
			width: health + lost,
		})
		// hp_remain.bringToFront()
		let shouldUpdateLostHp = false

		if (!this.players[target].isHpIndicatorVisible) {
			this.players[target].isHpIndicatorVisible = true
			setTimeout(() => {
				hp_lost.set({
					left: 2,
					top: 2,
					opacity: 1,
					width: lost + health,
				})
				hp_lost_bg.set({
					left: 2,
					top: 2,
					width: lost + health,
				})
			}, 100)
			setTimeout(() => {
				hp_lost_bg.animate("opacity", 0, {
					onChange: this.render.bind(this),
					duration: this.modifyMoveSpeed(200),
					easing: fabric.util.ease.easeOutCubic,
				})
			}, this.modifyMoveSpeed(500))
		} else {
			hp_lost.set({
				left: 2,
				top: 2,
				opacity: 1,
			})
			hp_lost_bg.set({
				left: 2,
				top: 2,
			})
		}
		if (-change > maxhp * 0.3) hp_lost_bg.set({ opacity: 1 })

		this.players[target].hpIndicatorLostTimeout = setTimeout(async () => {
			await sleep(this.modifyMoveSpeed(400))

			hp_lost.animate("width", 0, {
				onChange: this.render.bind(this),
				duration: this.modifyMoveSpeed(200),
				easing: fabric.util.ease.easeOutCubic,
			})
			// hp_lost.set({ opacity: 0 })

			this.players[target].isHpIndicatorVisible = false
		}, this.modifyMoveSpeed(HEALTHBAR_LOST_DISAPPEAR_DELAY))

		this.players[target].hpIndicatorFrameTimeout = setTimeout(() => {
			this.players[target].hpIndicatorGroup.set({ visible: false, opacity: 0 })
		}, this.modifyMoveSpeed(HEALTHBAR_FRAME_DISAPPEAR_DELAY))

		await sleep(this.modifyMoveSpeed(100))
		hp_remain.set({
			left: 2,
			top: 2,
			width: health,
		})
		if (shouldUpdateLostHp) {
			// hp_remain.bringToFront()
		}
		if (-change > maxhp * 0.5) {
			this.shakeHPBar(indicators, pos1.x - HEALTHBAR_FRAME_OFFSET_X, pos1.y - HEALTHBAR_FRAME_OFFSET_Y, 0.25)
		} else if (-change > maxhp * 0.15) {
			this.shakeHPBar(indicators, pos1.x - HEALTHBAR_FRAME_OFFSET_X, pos1.y - HEALTHBAR_FRAME_OFFSET_Y, 0.1)
		}
	}
	animateHP(data) {
		let target = data.turn
		let hp = data.currhp
		let maxhp = data.currmaxhp
		let change = data.change
		// let type = data.type
		// let skillfrom = data.source

		// if (type === "noeffect") return

		//hp bar on the board
		if (change <= -20) {
			this.showHPBarIndicator(target, hp, maxhp, change)
			// else if(hp>0){
			// 	lost=0
			// }

			////console.log(health)
			////console.log(lost)
			//this.players[target].hpIndicatorGroup.set({ visible: true, left: pos1.x - HEALTHBAR_FRAME_OFFSET_X, top: pos1.y - HEALTHBAR_FRAME_OFFSET_Y })
			// let hp_lost = this.players[target].hpIndicator.lost
			// let hp_frame = this.players[target].hpIndicator.frame
			// let hp_remain = this.players[target].hpIndicator.remain
			// let hp_bg = this.players[target].hpIndicator.bg

			////console.log(this.players[target].hpIndicatorFrameTimeout)
		}
		//console.log("animateHP" + target)

		let pos = this.getPlayerPos(target)

		//console.log("change" + change)
		if (change >= 0 && change <= 10) {
			return
		}

		let x = pos.x + Math.random() * 40 - 20
		let y = pos.y + Math.random() * 40 - 20

		if (change < 0) {
			let dmgIndicator = new fabric.Text(String(change), {
				fontSize: 20,
				fill: "#E11900",
				opacity: 1,
				fontWeight: "bold",
				width: 500,
				height: 500,
				evented: false,
				top: 100,
				left: 100,
				fontFamily: "Cookierun Black",
				stroke: "white",
				strokeWidth: 1,
			})
			this.lockFabricObject(dmgIndicator)
			this.canvas.add(dmgIndicator)
			// this.players[target].dmgindicator.set({ fill: "#E11900" })
			// this.players[target].dmgindicator.set("text", String(change))
			if (change > -50) {
				dmgIndicator.set("fontSize", 35)
			} else if (change > -300) {
				dmgIndicator.set("fontSize", 60)
			} else if (change > -6000) {
				dmgIndicator.set("fontSize", 75)
			} else {
				//처형
				dmgIndicator.set("fontSize", 60)
				dmgIndicator.set({ fill: "white" })
			}
			dmgIndicator.set({ top: y, left: x, opacity: 1 }).bringToFront()
			const time = this.getMoveSpeed("indicator")
			setTimeout(() => this.animateOpacity(dmgIndicator, 0, (time * 3) / 4), time / 4)
			this.animateYEaseOut(dmgIndicator, y - 50, time)

			this.removeImageAfter(dmgIndicator, 3000)
		} else {
			//console.log("heal" + change)
			this.players[target].healindicator.set("fill", "green")
			this.players[target].healindicator.set("text", "+" + String(change))
			this.players[target].healindicator.set("fontSize", 35)
			if (change > 120) {
				this.players[target].healindicator.set("fontSize", 80)
			}

			this.players[target].healindicator.set({ top: y, left: x, opacity: 1 }).bringToFront()

			const time = this.getMoveSpeed("indicator")
			setTimeout(() => this.animateOpacity(this.players[target].healindicator, 0, (time * 3) / 4), time / 4)
			this.animateYEaseOut(this.players[target].healindicator, y - 50, time)
		}
	}
	//===========================================================================================================================
	hideNameText(turn) {
		this.players[turn].hpbar.frame.set({ visible: false })
		this.players[turn].hpbar.hp.set({ visible: false })
		this.players[turn].hpbar.shield.set({ visible: false })

		super.hideNameText(turn)
	}
	updateNameText(turn) {
		let pos1 = this.getPlayerPos(turn)

		// //console.log(this.players[turn].hpbar)
		this.players[turn].hpbar.frame.set({ visible: true, left: pos1.x - HPBAR_OFFSET_X, top: pos1.y - HPBAR_OFFSET_Y })
		this.players[turn].hpbar.hp.set({
			visible: true,
			left: pos1.x - HPBAR_OFFSET_X + 1,
			top: pos1.y - HPBAR_OFFSET_Y + 1,
		})

		this.players[turn].hpbar.shield.set({
			visible: true,
			left: pos1.x - HPBAR_OFFSET_X + 1 + this.players[turn].hpbar.hp.width,
			top: pos1.y - HPBAR_OFFSET_Y + 1,
		})

		this.players[turn].hpbar.frame.bringToFront()
		this.players[turn].hpbar.hp.bringToFront()
		this.players[turn].hpbar.shield.bringToFront()
		super.updateNameText(turn)
	}

	indicateMoney(target, money) {
		if (money < 10 && money >= 0) {
			return
		}

		let pos = this.getPlayerPos(target)
		let x = pos.x
		let y = pos.y
		this.players[target].moneyindicator.set({ top: y, left: x, opacity: 1 }).bringToFront()
		this.players[target].moneyindicator.set("fontSize", 30)
		if (money < 0) {
			this.players[target].moneyindicator.set({ fill: "#7E00BF" })
			this.players[target].moneyindicator.set("text", String(money) + "$")
			//	//console.log(money + "money")
		} else {
			this.players[target].moneyindicator.set("fill", "orange")
			this.players[target].moneyindicator.set("text", "+" + String(money) + "$")
			if (money >= 70) {
				this.players[target].moneyindicator.set("fontSize", 40)
			}
			if (money > 150) {
				this.players[target].moneyindicator.set("fontSize", 50)
			}
			if (money > 1000) {
				this.players[target].moneyindicator.set("fontSize", 115)
			}
		}
		const time = this.getMoveSpeed("indicator")
		this.animateOpacity(this.players[target].moneyindicator, 0, time)
		this.animateYEaseOut(this.players[target].moneyindicator, y - 50, time)
	}
	//===========================================================================================================================

	indicateDcItem(turn, change) {
		const time = this.getMoveSpeed("indicator")
		let pos = this.getPlayerPos(turn)
		if (change < 0) {
			this.dcItemIndicator._objects[0].set("text", "-1")
		} else {
			this.dcItemIndicator._objects[0].set("text", "+1")
		}

		this.dcItemIndicator.set({ opacity: 1, top: pos.y - 50, left: pos.x })
		this.dcItemIndicator.bringToFront()
		this.animateOpacity(this.dcItemIndicator, 0, time)
		this.animateYEaseOut(this.dcItemIndicator, pos.y - 80, time)
	}
	//===========================================================================================================================

	/**
	 * 투명화 효과 받으면 투명도조절
	 * @param {} isStart 효과 시작인지 끝인지
	 * @param {*} target 대상 턴
	 */
	toggleInvisible(isStart, target) {
		if (isStart) {
			this.findPlayerImgInGroup(target).set({ opacity: 0.3 })
		} else {
			this.findPlayerImgInGroup(target).set({ opacity: 1 })
		}
		//	//console.log("toggleinvisible" + isStart)
	}
	/**	//===========================================================================================================================

	 * slow effect
	 * @param {} isStart 효과 시작인지 끝인지
	 * @param {*} target 대상 턴
	 */
	toggleSlow(isStart, target) {
		let playerimg = this.findPlayerImgInGroup(target)

		if (isStart) {
			let filter = new fabric.Image.filters.BlendColor({
				color: "#4fa3e8",
				mode: "tint",
				alpha: 0.7,
			})
			playerimg.filters = [filter]
			playerimg.applyFilters()
		} else {
			playerimg.filters = []
			playerimg.applyFilters()
		}
		//console.log("toggleslow" + isStart)
	}
	//===========================================================================================================================

	/**
	 * speed effect
	 * @param {} isStart 효과 시작인지 끝인지
	 * @param {*} target 대상 턴
	 */
	toggleSpeed(isStart, target) {
		let playerimg = this.findPlayerImgInGroup(target)

		if (isStart) {
			let filter = new fabric.Image.filters.BlendColor({
				color: "white",
				mode: "tint",
				alpha: 0.5,
			})
			playerimg.filters = [filter]
			playerimg.applyFilters()
		} else {
			playerimg.filters = []
			playerimg.applyFilters()
		}
		//console.log("togglespeed" + isStart)
	}
	/**	//===========================================================================================================================

	 * speed effect
	 * @param {} isStart 효과 시작인지 끝인지
	 * @param {*} target 대상 턴
	 */
	togglePoison(isStart, target) {
		let playerimg = this.findPlayerImgInGroup(target)

		if (isStart) {
			let filter = new fabric.Image.filters.BlendColor({
				color: "green",
				mode: "tint",
				alpha: 0.5,
			})
			playerimg.filters = [filter]
			playerimg.applyFilters()
		} else {
			playerimg.filters = []
			playerimg.applyFilters()
		}
		//console.log("togglepoison" + isStart)
	}

	/**	//===========================================================================================================================

	 * speed effect
	 * @param {} isStart 효과 시작인지 끝인지
	 * @param {*} target 대상 턴
	 */
	toggleCurse(isStart, target) {
		let playerimg = this.findPlayerImgInGroup(target)

		if (isStart) {
			this.game.playSound("curse")
			let filter = new fabric.Image.filters.BlendColor({
				color: "red",
				mode: "tint",
				alpha: 0.5,
			})
			playerimg.filters = [filter]
			playerimg.applyFilters()
		} else {
			playerimg.filters = []
			playerimg.applyFilters()
		}
		// //console.log("togglepoison" + isStart)
	}
	/**	//===========================================================================================================================

	 * stun effect
	 * @param {} isStart 효과 시작인지 끝인지
	 * @param {*} target 대상 턴
	 */
	toggleStun(isStart, target) {
		//console.log("toggle stun" + isStart + " " + target)
		if (isStart) {
			let pos = this.getPlayerPos(target)
			let jail = new fabric.Image(document.getElementById("stunindicator"), {
				evented: false,
				id: "stun",
				left: pos.x,
				top: pos.y,
				scaleX: 0.8,
				scaleY: 0.8,
				opacity: 0.5,
				objectCaching: false,
			})
			this.lockFabricObject(jail)
			this.canvas.add(jail)
			this.players[target].playerimg.addWithUpdate(jail)
		} else {
			let stun = this.findEffectImgInGroup(target, "stun")
			this.players[target].playerimg.remove(stun)
			this.canvas.remove(stun)
			stun = null
		}
		this.render()
	} //===========================================================================================================================

	toggleSlave(isStart, target) {
		if (isStart) {
			let pos = this.getPlayerPos(target)
			let slave = new fabric.Image(document.getElementById("slaveindicator"), {
				evented: false,
				id: "slave",
				left: pos.x,
				top: pos.y + 5,
				scaleX: 0.7,
				scaleY: 0.7,
				opacity: 1,
				objectCaching: false,
			})
			this.lockFabricObject(slave)
			this.canvas.add(slave)
			this.players[target].playerimg.addWithUpdate(slave)
		} else {
			let slave = this.findEffectImgInGroup(target, "slave")
			this.players[target].playerimg.remove(slave)
			this.canvas.remove(slave)
			slave = null
			// this.canvas.remove(this.players[target].effectimg[0])
			// this.players[target].effectimg[0]=null
		}
		this.render()
	} //===========================================================================================================================

	toggleShield(isStart, target) {
		if (isStart) {
			let pos = this.getPlayerPos(target)
			let shield = new fabric.Image(document.getElementById("shieldindicator"), {
				evented: false,
				id: "shield",
				left: pos.x - 13,
				top: pos.y - 24,
				scaleX: 0.4,
				scaleY: 0.4,
				opacity: 1,
				objectCaching: false,
			})
			this.lockFabricObject(shield)
			this.canvas.add(shield)
			this.players[target].playerimg.addWithUpdate(shield)
		} else {
			let shield = this.findEffectImgInGroup(target, "shield")
			this.players[target].playerimg.remove(shield)
			this.canvas.remove(shield)
			shield = null
		}
		this.render()
	} //===========================================================================================================================

	toggleRadi(isStart, target) {
		if (isStart) {
			let pos = this.getPlayerPos(target)
			let radi = new fabric.Image(document.getElementById("radiindicator"), {
				evented: false,
				id: "radi",
				left: pos.x,
				top: pos.y - 24,
				scaleX: 0.3,
				scaleY: 0.3,
				opacity: 1,
				objectCaching: false,
			})
			this.lockFabricObject(radi)
			this.canvas.add(radi)
			this.players[target].playerimg.addWithUpdate(radi)
		} else {
			let radi = this.findEffectImgInGroup(target, "radi")
			this.players[target].playerimg.remove(radi)
			this.canvas.remove(radi)
			radi = null
		}
		this.render()
	}
	//===========================================================================================================================

	toggleBlind(isStart, target) {
		if (isStart) {
			let pos = this.getPlayerPos(target)
			let blind = new fabric.Image(document.getElementById("blindindicator"), {
				evented: false,
				id: "blind",
				left: pos.x + 13,
				top: pos.y - 24,
				scaleX: 0.3,
				scaleY: 0.3,
				opacity: 1,
				objectCaching: false,
			})
			this.lockFabricObject(blind)
			this.canvas.add(blind)
			this.players[target].playerimg.addWithUpdate(blind)
		} else {
			let blind = this.findEffectImgInGroup(target, "blind")
			this.players[target].playerimg.remove(blind)
			this.canvas.remove(blind)
			blind = null
		}
		this.render()
	}
	//===========================================================================================================================

	findPlayerImgInGroup(turn) {
		return this.players[turn].playerimg._objects.filter((o) => o.id === "player")[0]
	}
	//===========================================================================================================================

	findEffectImgInGroup(turn, effectid) {
		return this.players[turn].playerimg._objects.filter((o) => o.id === effectid)[0]
	}
	//===========================================================================================================================

	toggleEffect(target, effect, isStart) {
		// if(isStart && this.players[target].effect_status[effect])
		// 	return
		// if(!isStart && !this.players[target].effect_status[effect])
		// 	return

		// this.players[target].effect_status[effect]=isStart

		//console.log("toggle" + isStart + " " + effect)
		if (effect === 0) {
			this.toggleSlow(isStart, target)
		}
		if (effect === 1) {
			this.toggleSpeed(isStart, target)
		}
		if (effect === 2 || effect === 18) {
			this.toggleStun(isStart, target)
		}
		if (effect === 4) {
			this.toggleShield(isStart, target)
		}
		if (effect === 5) {
			this.togglePoison(isStart, target)
		}
		if (effect === 6) {
			this.toggleRadi(isStart, target)
		}
		if (effect === 8) {
			this.toggleSlave(isStart, target)
		}
		if (effect === 11) {
			this.toggleBlind(isStart, target)
		}
		if (effect === 13) {
			this.toggleInvisible(isStart, target)
		}
		if (effect === 16) {
			this.toggleCurse(isStart, target)
		}
	} //===========================================================================================================================

	removeAllEffects(target) {
		// this.players[target].effect_status.map((e)=>{return false})

		let effect_objects = this.players[target].playerimg._objects
		for (let e of effect_objects) {
			if (e.id === "player") {
				e.filters = []
				e.applyFilters()
			} else {
				//console.log("Remove" + e.id)
				this.players[target].playerimg.remove(e)
				this.canvas.remove(e)
				e = null
			}
		}
	}
	//===========================================================================================================================

	indicateEffect(target, effect, num) {
		if (num === -1) {
			return
		}
		if (!num) {
			num = 0
		}
		let e = ""
		switch (effect) {
			case 0:
				e = this.game.chooseLang("Slow!", "둔화!")
				this.effectindicator[num].set({ fill: "blue" })
				break
			case 1:
				e = this.game.chooseLang("Speed!", "신속!")
				this.effectindicator[num].set({ fill: "blue" })
				break
			case 2:
				e = this.game.chooseLang("Grounded!", "고정!")
				this.effectindicator[num].set({ fill: "purple" })
				break
			case 3:
				e = this.game.chooseLang("Silenced!", "침묵!")
				this.effectindicator[num].set({ fill: "purple" })
				break
			case 4:
				e = this.game.chooseLang("Shield!", "방어막!")
				this.effectindicator[num].set({ fill: "green" })
				break
			case 5:
				e = this.game.chooseLang("Poison!", "독!")
				this.effectindicator[num].set({ fill: "green" })
				break
			case 6:
				e = this.game.chooseLang("Radiation!", "방사능!")
				this.effectindicator[num].set({ fill: "green" })
				break
			case 7:
				e = this.game.chooseLang("Annuity!", "연금!")
				this.effectindicator[num].set({ fill: "green" })
				break
			case 8:
				e = this.game.chooseLang("Slaved!", "노예계약!")
				this.effectindicator[num].set({ fill: "red" })
				break
			case 11:
				e = this.game.chooseLang("Blind!", "실명!")
				this.effectindicator[num].set({ fill: "purple" })
				break
			case 12:
				e = this.game.chooseLang("Ignite!", "점화!")
				this.effectindicator[num].set({ fill: "orange" })
				break
			case 13:
				e = this.game.chooseLang("Invisible!", "투명화!")
				this.effectindicator[num].set({ fill: "green" })
				break
			case 14:
				e = this.game.chooseLang("Private Loan!", "사채!")
				this.effectindicator[num].set({ fill: "purple" })
				break
			case 15:
				e = this.game.chooseLang("Annuity Lottery!", "연금복권!")
				this.effectindicator[num].set({ fill: "green" })
				break
			case 16:
				e = this.game.chooseLang("Cursed!", "주작걸림!")
				this.effectindicator[num].set({ fill: "red" })
				break
			case 18:
				e = this.game.chooseLang("Rooted!", "속박!")
				this.effectindicator[num].set({ fill: "purple" })
				break
		}

		let pos = this.getPlayerPos(target)
		let x = pos.x
		let y = pos.y
		let time = 2000
		if (this.game.simulation) {
			time = 1000
		}
		this.effectindicator[num].set({ top: y - 50 - num * 50, left: x - 50, opacity: 1 }).bringToFront()
		this.effectindicator[num].set("text", e)

		this.effectindicator[num].animate("opacity", 0, {
			onChange: this.render.bind(this),
			duration: time,
			easing: fabric.util.ease.easeOutCubic,
		})
		this.effectindicator[num].animate("top", "-=50", {
			onChange: this.render.bind(this),
			duration: time,
			easing: fabric.util.ease.easeOutCubic,
		})
	}
	//===========================================================================================================================

	animateTrain(type, position) {
		// if (this.subwayTrain != null) {
		// 	this.canvas.remove(this.subwayTrain)
		// 	this.subwayTrain = null
		// }

		let pos = this.getCoord(position)
		let speed = 1600
		let image
		if (type === "subway_local") {
			this.game.playSound("subway-rapid")
			image = "subway_local"
		} else if (type === "subway_rapid") {
			this.game.playSound("subway-rapid")
			image = "subway_rapid"
			speed = 1200
		} else if (type === "subway_express") {
			this.game.playSound("subway-express")
			image = "subway_express"
			speed = 900
		}
		let train = this.createCroppedEffectImage(image)
		this.setEffectImageAttr(train, pos.x, pos.y + 10, 1.5, 1.5, 1, 0)
		this.animateX(train, pos.x + 600, speed)
		this.removeImageAfter(train, 3000)
		setTimeout(() => {
			train.set({ opacity: 0 })
		}, speed + 200)
	}
	//===========================================================================================================================

	showTarget(targets, type) {
		this.game.prepareSelection()

		if (type === "godhand") {
			$("#godhandcancel").show()
		} else {
			$("#skillcancel").show()
		}

		this.canvas.discardActiveObject()
		this.shadow.set({ visible: true })
		this.shadow.bringToFront()
		this.playersToFront()
		// let positions=targets.map((i)=>this.players[i].pos)

		let dups = [] //store index in targets of duplicate elements
		let positions = targets.map((i) => this.players[i].pos)

		//console.log(targets)

		positions.forEach((item, index) => {
			if (positions.indexOf(item) !== index) {
				if (!dups.includes(positions.indexOf(item))) dups.push(positions.indexOf(item))

				if (!dups.includes(index)) dups.push(index)
			}
		})
		//console.log(dups)

		for (let i = 0; i < targets.length; ++i) {
			let tr = targets[i]
			let pos = this.getPlayerPos(tr)
			let x = pos.x
			let y = pos.y

			let tL = () => this.game.targetSelected(tr, type)
			//when targets are overlapped
			if (dups.includes(i)) {
				tL = () =>
					this.showOverlaySelector(
						dups.map((t) => targets[t]),
						type,
						pos
					) //send turns of duplicate players
			}

			this.players[tr].targetimg.on("selected", tL)
			this.players[tr].targetimg.set({
				left: x,
				top: y,
				opacity: 1,
				scaleY: 3.3,
				visible: true,
			})
			this.players[tr].targetimg.bringToFront()
			// this.nameTextsToFront()

			this.players[tr].targetimg.animate("scaleY", 0.6, {
				onChange: this.render.bind(this),
				duration: 500,
				easing: fabric.util.ease.easeOutBounce,
			})
		}
	} //===========================================================================================================================

	showOverlaySelector(turns, type, pos) {
		//console.log("showOverlaySelectors" + turns)

		for (let p of this.players) {
			p.targetimg.set({ hasBorders: false, visible: false })
			p.targetimg.off()
		}

		for (let i = 0; i < turns.length; ++i) {
			let plyr = this.players[turns[i]]

			this.overlapSelectorImgs[i].setElement(this.findPlayerImgInGroup(turns[i]).getElement())

			this.overlapSelectorImgs[i].set({
				left: pos.x - 54 * i,
				top: pos.y - 52,
				visible: true,
				stroke: COLOR_LIST[turns[i]],
				strokeWidth: 5,
				backgroundColor: "white",
				scaleX: 0.4,
				scaleY: 0.4,
				evented: true,
				hoverCursor: "pointer",
			})
			let onclick = () => this.game.targetSelected(turns[i], type)

			this.overlapSelectorImgs[i].on("selected", onclick)

			this.overlapSelectorImgs[i].bringToFront()
			this.overlapSelectorImgs[i].setCoords()
		}
	} //===========================================================================================================================

	resetTarget() {
		for (let p of this.players) {
			p.targetimg.set({ hasBorders: false, visible: false })
			p.targetimg.off()
		}

		this.overlapSelectorImgs.forEach(function (img) {
			img.set({ visible: false })
			img.off()
		})

		// this.game.ui.hideSkillCancel()
		this.shadow.set({ visible: false })
		this.shadow.sendToBack()
		this.render()
	} //===========================================================================================================================

	showTooltip(index) {
		let i = this.game.shuffledObstacles[index]
		let desc = this.game.strRes.OBSTACLES.obstacles[i].desc
		let pos = this.getTilePos(index)

		this.tooltip.set({ text: desc, opacity: 1, top: pos.y + 40, left: pos.x })
		this.tooltip.bringToFront()
	}
	//===========================================================================================================================
	moveComplete(turn) {
		this.game.moveComplete()
		// let ui = this.game.turn2ui(turn)
		// this.players[turn].nametext.set("text", "(" + String(turn + 1) + "P)" + $(this.game.ui.elements.hpis[ui]).html())
		// this.updateNameText(turn)
		super.moveComplete(turn)
	}
	showSelectedTileSingle(index) {
		let pos = this.getTilePos(index)
		this.tileselectimgs[0].set({ left: pos.x, top: pos.y, opacity: 1 }).bringToFront()
		this.render()
	}
	//===========================================================================================================================

	showSelectedTileMultiple(index, size) {
		for (let i = 0; i < size; ++i) {
			//end of the map
			if (index + i >= this.Map.coordinates.length) {
				for (let j = size - 1; j >= i; --j) {
					this.tileselectimgs[j].set({ x: 0, y: 0, opacity: 0 })
				}
				break
			} //can place projectile
			else if (this.canPlaceProj(index + i)) {
				let pos = this.getTilePos(index + i)
				this.tileselectimgs[i].set({ left: pos.x, top: pos.y, opacity: 1 }).bringToFront()
			} //cannot place projectile
			else {
				++index
				--i
			}
		}
		this.render()
	}
	//===========================================================================================================================

	// showRangeTiles(start, end, type, size) {
	// 	this.canvas.bringToFront(this.shadow)
	// 	this.canvas.discardActiveObject()
	// 	this.shadow.set({ visible: true })
	// 	for (let i = start; i < end; ++i) {
	// 		this.liftTile(i, type, size)
	// 	}
	// 	this.playersToFront()
	// }
	//===========================================================================================================================

	liftTile(index, type, size) {
		if (this.tiles[index] === null || index >= this.tiles.length || index < 0) {
			return
		}

		if (type === "godhand" || type === "submarine") {
			var select = function () {
				$("#confirm_tileselection").off()
				this.tooltip.set({ opacity: 0 })
				this.showTooltip(index)
				this.showSelectedTileSingle(index)

				$("#confirm_tileselection").click(
					function () {
						this.onTileClick(index, type)
					}.bind(this)
				)
			}.bind(this)
		} else {
			var select = function () {
				$("#confirm_tileselection").off()

				this.showSelectedTileMultiple(index, size)
				$("#confirm_tileselection").click(
					function () {
						this.onTileClick(index, type)
					}.bind(this)
				)
			}.bind(this)
		}
		this.activateTile(index, select)

		//this.tiles[t].set({'top':"-=10"})
		// this.tiles[index].animate('top','-=10',{
		//   onChange: this.canvas.renderAll.bind(this.canvas),
		//   duration: 0,
		//   easing: fabric.util.ease.easeOutCubic
		// });
	}
	//===========================================================================================================================

	tileReset() {
		// this.game.ui.onTileReset()

		for (let i = 0; i < this.tileselectimgs.length; ++i) {
			this.tileselectimgs[i].set({ x: 0, y: 0, opacity: 0 })
		}
		this.tooltip.set({ opacity: 0 })

		super.tileReset()
	}
	//===========================================================================================================================

	onTileClick(index, type) {
		this.tileSelected(index, type)
	}
	//===========================================================================================================================

	tileSelected(index, type) {
		if (this.tiles[index] === null || index >= this.tiles.length || index < 0) {
			return
		}

		this.tileReset()
		if (type === "godhand") {
			//	this.teleportPlayer(this.game.godhandtarget, index, "levitate")
			this.tooltip.set({ opacity: 0 })
		} else if (type === "submarine") {
			this.tooltip.set({ opacity: 0 })
		}
		this.game.onTileSelectionComplete(index, type)
		// this.canvas.renderAll()
	}
	//===========================================================================================================================

	//===========================================================================================================================

	playerDeath(target, respawnpos) {
		this.players[target].playerimg.set({
			opacity: 0,
			top: this.Map.coordinates[respawnpos].y + BOARD_MARGIN,
			left: this.Map.coordinates[respawnpos].x + BOARD_MARGIN,
		})
		// this.players[target].nametext.set("stroke", "red")
		this.render()
	}
	//===========================================================================================================================

	hidePlayer(turn) {
		let respawnpos = this.players[turn].pos
		this.players[turn].playerimg.set({
			opacity: 0,
			top: this.Map.coordinates[respawnpos].y + BOARD_MARGIN,
			left: this.Map.coordinates[respawnpos].x + BOARD_MARGIN,
		})
		this.game.removeAllEffects(turn)
		// this.players[turn].nametext.set("stroke", "red")
		this.render()
	}
	//===========================================================================================================================

	respawnPlayer(target, pos) {
		// this.game.removeAllEffects(target)
		this.showPlayer(target, pos)
	}
	setFinish(pos) {
		if (pos === -1) return

		this.tempFinish.set({
			visible: true,
			top: this.Map.coordinates[pos].y + BOARD_MARGIN,
			left: this.Map.coordinates[pos].x + BOARD_MARGIN,
		})
		this.render()
	}
	//===========================================================================================================================

	/**	//===========================================================================================================================

	 * change player apperance
	 * if data is empty, set to ogirinal
	 * @param {} data
	 * @param {*} turn
	 */
	updateCharacterApperance(data, turn) {
		let updater = new fabric.Text("")
		if (data === "") {
			this.findPlayerImgInGroup(turn).setElement(document.getElementById("playerimg" + (this.players[turn].champ + 1)))
		}
		if (data === "bird_r") {
			this.findPlayerImgInGroup(turn).setElement(document.getElementById("playerimg8_r"))
		}
		if (data === "elephant_r") {
			this.findPlayerImgInGroup(turn).setElement(document.getElementById("playerimg2_r"))
		}
		if (data === "tree_low_hp") {
			this.findPlayerImgInGroup(turn).setElement(document.getElementById("playerimg9_low_hp"))
		}
		this.players[turn].playerimg.addWithUpdate(updater)
		this.players[turn].playerimg.removeWithUpdate(updater)
		updater = null
		this.forceRender()
	}
	//===========================================================================================================================

	showCoffin(turn) {
		//console.log("coffin" + turn)
		let pos = this.getPlayerPos(turn)
		this.players[turn].coffin.bringToFront()
		this.players[turn].coffin.set({
			visible: true,
			top: pos.y - 50,
			left: pos.x,
			scaleX: 1.7,
			scaleY: 1.7,
		})

		let addedEffectImg = this.createCroppedEffectImage("death")
		this.setEffectImageAttr(addedEffectImg, pos.x, pos.y, 3, 3, 0.6, 0)
		this.animateScaleX(addedEffectImg, 1.4, 200)
		this.animateOpacity(addedEffectImg, 0, 1500)
		this.removeImageAfter(addedEffectImg, 2000)

		this.players[turn].coffin.animate("top", pos.y + 10, {
			onChange: this.render.bind(this),
			duration: 1000,
			easing: fabric.util.ease.easeOutBounce,
		})
		setTimeout(() => {
			this.players[turn].coffin.animate("scaleX", 1, {
				onChange: this.render.bind(this),
				duration: 400,
				easing: fabric.util.ease.easeOutElastic,
			})
			this.players[turn].coffin.animate("scaleY", 1, {
				onChange: this.render.bind(this),
				duration: 400,
				easing: fabric.util.ease.easeOutElastic,
			})
		}, 300)
		// this.forceRender()
	}
	//===========================================================================================================================

	showSoul(turn) {
		let pos = this.getPlayerPos(turn)
		this.hidePlayer(turn)

		this.players[turn].soul.bringToFront()
		this.players[turn].soul.set({
			opacity: 0.8,
			visible: true,
			top: pos.y - 15,
			left: pos.x,
			scaleX: 1.5,
			scaleY: 1.5,
		})
		this.players[turn].soul.animate("scaleX", 0.5, {
			onChange: this.render.bind(this),
			duration: 1000,
			easing: fabric.util.ease.easeOutCubic,
		})
		this.players[turn].soul.animate("scaleY", 0.5, {
			onChange: this.render.bind(this),
			duration: 1000,
			easing: fabric.util.ease.easeOutCubic,
		})
	}
	//===========================================================================================================================

	hideCoffinAndSoul(turn) {
		this.players[turn].coffin.set({
			visible: false,
		})
		let pos = this.getPlayerPos(turn)

		this.players[turn].soul.set({
			scaleX: 1.5,
			scaleY: 1.5,
		})
		this.players[turn].soul.animate("top", pos.y - 150, {
			onChange: this.render.bind(this),
			duration: 500,
			easing: fabric.util.ease.easeInCubic,
		})
		this.players[turn].soul.animate("opacity", 0, {
			onChange: this.render.bind(this),
			duration: 1000,
			easing: fabric.util.ease.easeOutCubic,
		})
		setTimeout(() => {
			this.players[turn].soul.set({
				visible: false,
			})
		}, 500)
	}

	//===========================================================================================================================

	chooseTile(index) {
		let tile = 0
		if (this.mapname === "default") {
			if (index > 0 && index < 16) {
				tile = index % 2
			} else if (index > 16 && index < 38) {
				tile = 2 + (index % 3)
			} else if (index > 38 && index < 54) {
				tile = 5 + (index % 2)
			} else if (index >= 54 && index < 71) {
				tile = 7
			} else if (index > 71) {
				tile = 8 + (index % 2)
			}
		} else if (this.mapname === "ocean") {
			if (index > 0 && index < 15) {
				tile = 1 + (index % 2)
			} else if (index > 15 && index < 36) {
				tile = 7
			} else if (index > 36 && index < 72) {
				tile = 3
			} else if (index > 72 && index < 90) {
				if (index % 2 === 0) {
					tile = 4
				} else {
					tile = 9
				}
			} else if (index > 90) {
				tile = 5
			}
		} else if (this.mapname === "casino") {
			if (index > 0 && index < 20) {
				tile = 2 + (index % 2)
			} else if (index > 20 && index < 32) {
				tile = 2 + 2 * (index % 2)
			} else if (index === 32) {
				//subway
				tile = 1
			} else if (index === 33 || index === 35) {
				//rapid
				tile = 10
			} else if (index === 34 || index === 36) {
				//default
				tile = 8
			} else if (index > 35 && index < 95) {
				tile = 6 + (index % 2)
				if (index === 89) {
					tile = 9
				}
			}
			// else if () {
			// 	tile = 2
			// } else if (index === 107) {
			// 	tile = 4
			// }
		} else if (this.mapname === "rapid") {
			if (index > 1 && index < 13) {
				tile = 2 + (index % 2)
			} else if (index > 13 && index < 27) {
				tile = 3 + (index % 2)
			} else if (index >= 27) {
				tile = index % 2 === 0 ? 4 : 9
			} else return 3
		}

		return tile
	}
}
