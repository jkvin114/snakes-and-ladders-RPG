import SETTINGS = require("../../res/globalsettings.json")
import * as ENUM from "../data/enum"
import { Damage,PercentDamage } from "../core/Damage"

import { SpecialEffect } from "../data/SpecialEffectRegistry"
import { EntityFilter } from "../entity/EntityFilter"
import type { Player } from "../player/player"
import { StatusEffect, EffectFactory } from "../StatusEffect"
import type { Entity } from "../entity/Entity"

export namespace ObstacleHelper {
	export const applyObstacle=function(player: Player, obs: number, isForceMoved: boolean) {
		if(player.thisTurnObstacleCount>20) return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
		player.thisTurnObstacleCount++

		let others: string[] = []
		const pendingObsList = SETTINGS.pendingObsList
		const perma = StatusEffect.DURATION_UNTIL_LETHAL_DAMAGE
		player.mapHandler.applyObstacle(obs)
		let isGlobalEvent=false
		try {
			switch (obs) {
				case 4:
					player.doObstacleDamage(10,"trap")
					break
				case 5:
					player.inven.takeMoney(30)
					break
				case 6:
					//subway
					break
				case 7:
					player.mapHandler.nextdmg = 30
					break
				case 8:
					player.doObstacleDamage(20,"knifeslash")
					break
				case 9:
					player.heal(50)
					break
				case 10:
					player.effects.apply(ENUM.EFFECT.SILENT, 1)
					break
				case 11:
					player.potionObstacle()
					
					// player.cooltime[ENUM.SKILL.ULT] = 
					break
				case 12:
					player.effects.apply(ENUM.EFFECT.FARSIGHT, 1)
					player.effects.applySpecial(
						EffectFactory.create(ENUM.EFFECT.MAGIC_CASTLE_ADAMAGE).addData(player.ability.getMagicCastleDamage()),
						SpecialEffect.OBSTACLE.MAGIC_CASTLE_ADAMAGE.name
					)
					// player.message(player.name + ": skill range x3, additional damage 30")
					break
				case 13:
					player.effects.apply(ENUM.EFFECT.ROOT, 1)
					player.obstacleEffect("web")

					break
				case 14:
					let d = Math.floor(Math.random() * 6) + 1
					player.inven.giveMoney(d * 10)
					break
				case 15:
					let m3 = Math.floor(player.inven.money / 10)
					isGlobalEvent=true
					others=player.mediator.forEachPlayer(EntityFilter.ALL_ENEMY_PLAYER(player),function(player){
						this.inven.giveMoney(m3)
					})
					player.inven.takeMoney(m3 * others.length)

					break
				case 16:
					player.effects.apply(ENUM.EFFECT.SLOW, 1)
					player.doObstacleDamage(20,'hit')
					break
				case 17:
					others=player.mediator.forEachPlayer(EntityFilter.ALL_ENEMY_PLAYER(player).excludeDead(),function(player){
						this.heal(20)
					})
					isGlobalEvent=true
					player.doObstacleDamage(20 * others.length,'hit')
					
					break
				case 18:

					others=player.mediator.forEachPlayer(EntityFilter.ALL_ENEMY_PLAYER(player),function(player){
						this.inven.giveMoney(30)
					})
					isGlobalEvent=true
					player.inven.takeMoney(others.length * 30)

					break
				case 19:
					others=player.mediator.forEachPlayer(EntityFilter.VALID_MOVE_OBSTACLE_TARGET(player).inRadius(20),function(player){
						this.game.playerForceMove(this, player.pos, true, ENUM.FORCEMOVE_TYPE.SIMPLE)
					})
					isGlobalEvent=true

					// others = player.game.playerSelector.getPlayersByCondition(player, 20, false, true, false, true)
					// for (let o of others) {
					// 	player.game.playerForceMove(o, player.pos, true, "simple")
					// }
					break
				case 20:
					let mypos=player.pos
					let target=player.mediator.selectBestOneFrom(EntityFilter.VALID_MOVE_OBSTACLE_TARGET(player).inRadius(40),function(this:Entity){
						return Math.abs(this.pos-mypos)
					},true)
					if(!target) break
					
					//if target is also on change obstacle, dont swap.(prevent infinite loop)
					if(player.game.getObstacleAt(target.pos)!==20 && target.pos !== player.pos){
                        if(player.mediator.swapPlayerPosition(player,target))
                        {
                            others.push(target.UEID)
                            isGlobalEvent=true
                        }
                    }
					break
				case 21:
					//godhand
					break
				case 22:
					player.effects.apply(ENUM.EFFECT.ANNUITY, perma)
					break
				case 23:
					player.inven.takeMoney(30)
					player.doObstacleDamage(30,"knifeslash")
					break
				case 24:
					player.effects.resetAllHarmful()
					player.effects.apply(ENUM.EFFECT.SHIELD, 99999)
					player.effects.apply(ENUM.EFFECT.INVISIBILITY, 1)
					player.heal(70)
					break
				case 25:
					player.effects.apply(ENUM.EFFECT.SHIELD, perma)
					break
				case 26:
					player.mapHandler.nextdmg = 70
					break
				case 27:
					player.doObstacleDamage(100,"knifeslash")
					break
				case 28:
					player.effects.apply(ENUM.EFFECT.ROOT, 1)
					player.effects.apply(ENUM.EFFECT.SLOW, 2)
					player.obstacleEffect("web")

					break
				case 29:
					player.effects.apply(ENUM.EFFECT.POISON, perma)
					break
				case 30:
					player.doObstacleDamage(new PercentDamage(33, PercentDamage.CURR_HP)
					.getTotal(player.MaxHP,player.HP),"explode")
					break
				case 31:
					player.doObstacleDamage(new PercentDamage(50, PercentDamage.MISSING_HP)
					.getTotal(player.MaxHP,player.HP),"explode")
					player.effects.apply(ENUM.EFFECT.RADI, 1)
					break
				case 32:
					player.effects.apply(ENUM.EFFECT.RADI, 1)
					break
				case 33:
					// kidnap
					if (player.AI) {
						if (player.HP > 300) {
							ObstacleHelper.kidnap(player,false)
						} else {
							ObstacleHelper.kidnap(player,true)
						}
					}
					break
				case 34:
					player.effects.apply(ENUM.EFFECT.SLAVE, perma)
					break
				case 35:
					player.effects.apply(ENUM.EFFECT.ROOT, 3)
					player.effects.apply(ENUM.EFFECT.SPEED, 4)
					break
				case 36:
					if (!isForceMoved) {
						player.game.playerForceMove(player, player.lastpos, false,  ENUM.FORCEMOVE_TYPE.LEVITATE)
					}
					break
				case 37:
					//trial
					if (player.AI) {
						let d = Math.floor(Math.random() * 6) + 1
						ObstacleHelper.trial(player, d)
					}
					break
				case 38:
					//casino
					if (player.AI) {
						let d = Math.floor(Math.random() * 6) + 1
						ObstacleHelper.casino(player, d)
					}
					break
				case 39:
					player.effects.apply(ENUM.EFFECT.DOUBLEDICE, 1)
					break
				case 40:
					player.effects.apply(ENUM.EFFECT.BACKDICE, 1)
					break
				case 41:
					player.effects.apply(ENUM.EFFECT.ROOT, 1)
					player.obstacleEffect("web")
					break
				case 42:
					player.heal(50)
					break
				case 43:
					player.effects.apply(ENUM.EFFECT.POISON, 3)
					break
				case 44:
					player.doObstacleDamage(40,"knifeslash")
					break
				case 45:
					player.effects.apply(ENUM.EFFECT.BLIND, 3)
					break
				case 46:
					player.effects.apply(ENUM.EFFECT.SLOW, 1)
					player.doObstacleDamage(30,'hit')
					break
				case 48:
					break
				case 49:
					player.inven.takeMoney(20)
					player.doObstacleDamage(50,"knifeslash")

					break
				case 50:
					player.effects.apply(ENUM.EFFECT.IGNITE, 3)
					player.doObstacleDamage(30,"knifeslash")

					break
				case 51:
					player.effects.apply(ENUM.EFFECT.INVISIBILITY, 1)
					break
				case 52:
					// player.doObstacleDamage(75, "lightning")
					others=player.mediator.forEachPlayer(EntityFilter.ALL_ALIVE_PLAYER(player).excludeUntargetable().inRadius(3),function(){
						this.doObstacleDamage(75,"lightning")
					})
					isGlobalEvent=true
					break
				case 53:
					others=player.mediator.forEachPlayer(EntityFilter.ALL_ALIVE_PLAYER(player),function(){
						let died = this.doObstacleDamage(30,"wave")
						if (!died) {
							player.game.playerForceMove(this, this.pos - 3, true, ENUM.FORCEMOVE_TYPE.SIMPLE)
						}
					})
					isGlobalEvent=true
					break
				case 54:
					others=player.mediator.forEachPlayer(EntityFilter.VALID_MOVE_OBSTACLE_TARGET(player).inRadius(30),function(player){
						this.game.playerForceMove(this, player.pos, true, ENUM.FORCEMOVE_TYPE.SIMPLE)
					})
					isGlobalEvent=true
					break
				case 55:
					let r = Math.floor(Math.random() * 10)
					player.game.playerForceMove(player, player.pos - 3 + r, false, ENUM.FORCEMOVE_TYPE.LEVITATE)
					player.obstacleEffect("wind")

					break
				case 56:

					let allplayers = player.mediator.selectAllFrom(EntityFilter.VALID_MOVE_OBSTACLE_TARGET(player))
					if (allplayers.length !== 0) {
						let r2 = Math.floor(Math.random() * allplayers.length)
						player.game.playerForceMove(player, allplayers[r2].pos, true,  ENUM.FORCEMOVE_TYPE.LEVITATE)
					}
					
					player.obstacleEffect("wind")

					break
				case 57:
					player.mapHandler.nextdmg = 70
					break
				case 58:
					player.doObstacleDamage(120,"explode")
					break
				case 59:
					player.effects.apply(ENUM.EFFECT.SPEED, 3)
					break
				case 60:
					player.effects.apply(ENUM.EFFECT.IGNITE, 3)
					player.doObstacleDamage(new PercentDamage(25, PercentDamage.MAX_HP).getTotal(player.MaxHP,player.HP),"explode")

					break
				case 61:
					player.doObstacleDamage(175,"explode")

					break
				case 62:
					// player.inven.changeToken(10)
					// player.loanTurnLeft = 5
					break
				case 63:
					//Threaten
					break
				case 64:
					player.effects.apply(ENUM.EFFECT.PRIVATE_LOAN, 2)
					break
				case 65:
					player.inven.takeMoney(Math.floor(player.inven.money / 2))
					player.inven.changeToken(-1 * Math.floor(player.inven.token / 2))
					break
				case 66:
					player.effects.apply(ENUM.EFFECT.ANNUITY_LOTTERY, perma)
					break
				case 67: //coin store
					if (player.effects.has(ENUM.EFFECT.PRIVATE_LOAN)) {
						obs = ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
					}
					break
				case 68:
					// street_vendor
					player.goStore(1.1)
					break
				case 69:
					let m1 = 0
					player.mediator.forAllPlayer(function(){
						m1+=this.statistics.stats[ENUM.STAT.MONEY_EARNED]
					})
					if (Math.random() > 0.93) {
						player.inven.giveMoney(m1)
						player.sendConsoleMessage(" won the lottery! earned" + m1 + "$")
					}
					
					break
				case 70:
					let m2 = 0
					others = player.mediator.forEachPlayer(EntityFilter.ALL_ENEMY_PLAYER(player),function(){
						let m1 = this.inven.token * 2 + Math.floor(this.inven.money * 0.1)
						this.inven.takeMoney(m1)
						m2 += m1
					})
					isGlobalEvent=true
					player.inven.giveMoney(m2)
					break
				case 71:
					player.inven.thief()
					break
				case 72:
					player.effects.apply(ENUM.EFFECT.CURSE, 2)
					break
				case 73:
					player.doObstacleDamage(Math.floor(player.inven.money / 2),'hit')
					break
				case 74:
					if (!player.AI) {
						if (player.inven.money < 150 && player.inven.token < 10) {
							player.killplayer()
							// player.message("can pass only if you have\n more than 150$ or 10 tokens")
						}
					} else if (player.inven.money < 100 && player.inven.token < 10) {
						player.killplayer()
					}
			}
		} catch (e) {
			console.error(e)
			return ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE
		}
		if(isGlobalEvent){
			player.game.indicateGlobalObstacleEvent(obs)
		}
		//not ai, not pending obs and forcemoved, not arrive at none
		else if (!(pendingObsList.includes(obs) && isForceMoved) && obs != ENUM.ARRIVE_SQUARE_RESULT_TYPE.NONE) {
			player.game.indicateSingleObstacle(player.turn,obs)
		}


		return obs
	}


	export const kidnap=function (player: Player, result: boolean) {
		if (result) {
			player.effects.apply(ENUM.EFFECT.ROOT, 2)
		} else {
			player.doObstacleDamage(300,"stab")

		}
	}
	export const threaten=function (player: Player, result: boolean|undefined) {
		if (result) {
			player.inven.takeMoney(50)
		} else {
			player.inven.changeToken(-3)
		}
	}
	export const trial=function(player: Player, num: number) {
		//console.log("trial" + num)
		switch (num) {
			case 0:
				player.inven.takeMoney(100)
				player.sendConsoleMessage(player.name + "fine 100$")
				break
			case 1:
				player.effects.apply(ENUM.EFFECT.SLAVE, StatusEffect.DURATION_UNTIL_LETHAL_DAMAGE)
				break
			case 2:

				let target=player.mediator.selectBestOneFrom(EntityFilter.VALID_MOVE_OBSTACLE_TARGET(player).inRadius(40),function(){
					return Math.abs(this.pos-player.pos)
				},true)
				if(!target) break
				player.game.playerForceMove(player, target.pos, true,  ENUM.FORCEMOVE_TYPE.LEVITATE)
				
				break
			case 3:
				player.killplayer()
				player.sendConsoleMessage(player.name + " has been sentenced to death")
				break
			case 4:
				player.doObstacleDamage(Math.floor(player.HP / 2),"stab")

				player.effects.apply(ENUM.EFFECT.GROUNGING, 1)
				player.sendConsoleMessage(player.name + " will get retrial")
				break
			case 5:
				for (let p of player.mediator.allPlayer()) {
					let m = Math.random()
					if (m > 0.5) {
						p.killplayer()
					}
				}
				player.game.indicateGlobalObstacleEvent(37,"thanos")
				break
		}
	}
	//========================================================================================================

	export const casino=function (player: Player, num: number) {
		switch (num) {
			case 0:
				player.inven.giveMoney(100)
				break
			case 1:
				player.inven.giveMoney(player.inven.money)
				break
			case 2:
				player.effects.apply(ENUM.EFFECT.SPEED, 2)
				break
			case 3:
				player.doObstacleDamage(Math.floor(player.HP / 2),"stab")

				break
			case 4:
				player.inven.takeMoney(Math.floor(player.inven.money / 2))
				break
			case 5:
				player.doObstacleDamage(50,"stab")

				player.effects.apply(ENUM.EFFECT.GROUNGING, 1)
				break
		}
	}
}
