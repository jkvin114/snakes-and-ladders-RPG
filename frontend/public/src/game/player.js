export class Player {
	constructor(game, turn, champ, team, name) {
		this.game = game
		this.pos = 0
		this.champ = champ
		this.alive = true
		this.team = team
		this.turn = turn
		this.name = name
		this.isInSubway = false
		this.hp = 200
		this.maxhp = 200

		//fabric objects
		this.hpbar
		this.hpIndicator
		this.hpIndicatorGroup
		this.dmgindicator
		this.healindicator
		this.shieldindicator
		this.moneyindicator
		this.playerimg
		this.targetimg
		this.soul //부활대기중일 경우
		this.coffin //죽었을경우
		this.boom //터지는효과
		this.nametext

		this.hpIndicatorFrameTimeout = setTimeout(() => {}, 0)
		this.hpIndicatorLostTimeout = setTimeout(() => {}, 0)
		this.isHpIndicatorVisible = false
		this.effect_status = new Set()
	}
	clearhpIndicatorTimeout() {
		clearTimeout(this.hpIndicatorFrameTimeout)
		clearTimeout(this.hpIndicatorLostTimeout)
		//	console.log(this.hpIndicatorLostTimeout)
	}
}
