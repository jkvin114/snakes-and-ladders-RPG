import * as Util from "./Util"
import {EFFECT,EFFECT_TIMING} from "./enum"
import { Player } from "./player"
import {PlayerClientInterface} from "./app"



class PlayerStatusEffects{
    player:Player
    skilleffects: Util.SkillEffect[]
	
	shieldEffects: Map<string, Util.ShieldEffect>
	signs: object[]
	igniteSource: number
	effects: {
		obs: number[]
		skill: number[]
	}

    constructor(player:Player){
		this.player=player
		this.signs = []
		this.igniteSource = -1 //점화효과를 누구에게 받았는지

		//two lists of effects have different cooldown timing
		this.effects = {
			skill: Util.makeArrayOf(0, 20), //턴 끝날때 쿨다운
			obs: Util.makeArrayOf(0, 20) //장애물 끝날때 쿨다운
		}
		//0.slow 1.speed 2.stun 3.silent 4. shield  5.poison  6.radi  7.annuity 8.slave
		
		this.skilleffects = []
		
		this.shieldEffects = new Map<string, Util.ShieldEffect>()
    }
	transfer(func:Function,...args:any[]){
        this.player.game.sendToClient(func,...args)
    }
    onDeath(){
		this.signs = []
		this.skilleffects = []
    }
    onBeforeObs(){
        let died=false
        //독
		if (this.has(EFFECT.POISON)) {
			died = this.player.doObstacleDamage(30, "simple")
		}
		//연금
		if (this.has(EFFECT.ANNUITY)) {
			this.player.inven.giveMoney(20)
		}
		//연금복권
		if (this.has(EFFECT.ANNUITY_LOTTERY)) {
			this.player.inven.giveMoney(50)
			this.player.inven.changeToken(1)
		}

		//노예계약
		if (this.has(EFFECT.SLAVE)) {
			died = this.player.doObstacleDamage(80, "simple")
		}

		if (died) {
			this.apply(EFFECT.SILENT, 1,EFFECT_TIMING.BEFORE_SKILL)
		}
    }
    onAfterObs(){
        this.decrementShieldEffectDuration()
        this.cooldownEffectsBeforeSkill()
    }
    onTurnEnd(){
        this.signCoolDown()
		this.skillEffectCoolDown()
        this.cooldownEffectsAfterSkill()

    }

    giveIgniteEffect(dur: number, source: number) {
		this.apply(EFFECT.IGNITE, dur,EFFECT_TIMING.BEFORE_SKILL)
		this.igniteSource = source
	}
    applyIgnite(){
        let died=false
        if (this.has(EFFECT.IGNITE)) {
            if (this.igniteSource === -1) {
                died = this.player.doObstacleDamage(Math.floor(0.04 * this.player.MaxHP), "fire")
            } else {
                died = this.player.doPlayerDamage(Math.floor(0.04 * this.player.MaxHP), this.igniteSource, "fire", false)
            }
        }
        return died
    }

	// haveEffect(effect: number) {
	// 	return this.effects[effect] > 0
	// }
	reset(effect: number) {
		this.effects.obs[effect] = 0
		this.effects.skill[effect] = 0
		this.transfer(PlayerClientInterface.update, "removeEffect", this.player.turn, effect)
	}
	/**
	 *
	 * @param {*} e 이펙트 ID
	 * @param {*} dur 지속시간
	 * @param {*} num 번호
	 */
	applyNormal(effect: number, dur: number, type: string) {
		if (dur === 0) return

		let num = this.player.game.totalEffectsApplied % 3
		this.player.game.totalEffectsApplied += 1

		//장화로 둔화 무시
		if (effect === EFFECT.SLOW && this.player.inven.haveItem(29)) {
			return
		}
		this.transfer(PlayerClientInterface.giveEffect,this.player.turn, effect,num)

		//이펙트 부여하자마자 바로 쿨다운 하기 때문에 지속시간 +1 해줌
		if (type === "obs") {
			this.effects.obs[effect] = Math.max(dur, this.effects.obs[effect])
		} else if (type === "skill") {
			this.effects.skill[effect] = Math.max(dur, this.effects.skill[effect])
		}

		if (this.player.game.instant) return
	}
    apply(effect: number, dur: number,timing:EFFECT_TIMING){
        if(timing==EFFECT_TIMING.BEFORE_SKILL){
            this.applyNormal(effect, dur + 1, "obs")
        }
        else if(timing==EFFECT_TIMING.TURN_END){
            this.applyNormal(effect, dur + 1, "skill")
        }
        else if(timing==EFFECT_TIMING.TURN_START){
            this.applyNormal(effect, dur, "obs")

        }
    }
	cooldownEffectsBeforeSkill() {
		for (let i = 0; i < this.effects.obs.length; ++i) {
			if (this.effects.obs[i] === 1 && this.effects.skill[i] === 0) {
				this.transfer(PlayerClientInterface.update, "removeEffect", this.player.turn, i)
			}
		}
		this.effects.obs = this.effects.obs.map(Util.decrement)
	}

	cooldownEffectsAfterSkill() {
		for (let i = 0; i < this.effects.skill.length; ++i) {
			if (this.effects.skill[i] === 1 && this.effects.obs[i] === 0) {
				this.transfer(PlayerClientInterface.update, "removeEffect", this.player.turn, i)
			}
		}
		this.effects.skill = this.effects.skill.map(Util.decrement)
	}

    cooldownNormal(){
        this.cooldownEffectsAfterSkill()
		this.cooldownEffectsBeforeSkill()
    }

	has(effect: number) {
		return this.effects.obs[effect] > 0 || this.effects.skill[effect] > 0
	}

	resetAllEffects() {
		for (let i = 0; i < this.effects.obs.length; ++i) {
			this.reset(i)
		}
	}

    giveSign(sign: any) {
		//this.message(this.name + " got hit by" + sign.name)
		this.signs.push(sign)
	}
	//========================================================================================================

	haveSign(type: string, owner: number) {
		let o = this.signs.some((sign: any) => sign.type === type && sign.owner_turn === owner)
		return o
	}
	//========================================================================================================

	removeSign(type: string, owner: number) {
		this.signs = this.signs.filter((sign: any) => !(sign.type === type && sign.owner_turn === owner))
	}

	giveSkillEffect(effect: Util.SkillEffect) {
		//this.message(this.name + " got " + effect.name + " effect")
		this.skilleffects.push(effect)
	}
	//========================================================================================================

	haveSkillEffectAndSource(type: string, owner: number) {
		return this.skilleffects.some((ef: Util.SkillEffect) => ef.type === type && ef.owner_turn === owner)
	}
	//========================================================================================================

	haveSkillEffect(type: string) {
		return this.skilleffects.some((ef) => ef.type === type)
	}
    getSkillEffect(type: string) {
		return this.skilleffects.filter((ef) => ef.type === type)[0]
	}
	//========================================================================================================

	removeSkillEffect(type: string, owner: number) {
		this.skilleffects = this.skilleffects.filter((ef) => !(ef.type === type && ef.owner_turn === owner))
	}
	//========================================================================================================

	signCoolDown() {
		this.signs = this.signs.map(function (s: any) {
			s.dur = Util.decrement(s.dur)
			return s
		})
		this.signs = this.signs.filter((s: any) => s.dur > 0)
		console.log(this.signs)
	}
	//========================================================================================================

	skillEffectCoolDown() {
		this.skilleffects = this.skilleffects.map(function (s: Util.SkillEffect) {
			s.dur = Util.decrement(s.dur)
			return s
		})
		this.skilleffects = this.skilleffects.filter((s: Util.SkillEffect) => s.dur > 0)
		console.log(this.skilleffects)
	}
    canBasicAttack(){
        return !(this.haveSkillEffect("timo_q") || this.has(EFFECT.BLIND))
    }
	/**
	 *
	 * @param {*} shield 변화량 + or -
	 * @param {*} noindicate 글자 표시할지 여부
	 */
	setShield(name: string, shield: Util.ShieldEffect, noindicate: boolean) {
		let change = 0
		if (this.shieldEffects.has(name)) {
			change = this.shieldEffects.get(name).reApply(shield.amount)
		} else {
			this.shieldEffects.set(name, shield)
			change = shield.amount
		}

		this.player.updateTotalShield(change, noindicate)
	}
	applyShield(damage:number){
        let damageLeft=damage
        for (const [name, s] of this.shieldEffects) {
			let shieldleft = s.absorbDamage(damageLeft)

			if (shieldleft < 0) {
				damageLeft = -shieldleft
				this.shieldEffects.delete(name)
			} else {
				damageLeft = 0
				break
			}
		}
        return damageLeft
    }

    decrementShieldEffectDuration() {
		for (const [name, s] of this.shieldEffects) {
			if (!s.cooldown()) {
				this.player.updateTotalShield(-s.amount, true)
				this.shieldEffects.delete(name)
			}
		}
	}
}
export default PlayerStatusEffects