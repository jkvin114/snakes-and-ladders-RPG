    import { Player } from "../player/player"
    import type { Game } from "../Game"

    import {SKILL,FORCEMOVE_TYPE,SKILL_INIT_TYPE,EFFECT, CHARACTER} from "../data/enum"
    import { ITEM } from "../data/enum"
    import { Damage,PercentDamage } from "../core/Damage"

    import { Projectile, ProjectileBuilder } from "../Projectile"
    import { SkillInfoFactory } from "../data/SkillDescription"
    import * as SKILL_SCALES from "../../res/skill_scales.json"
    import { ShieldEffect } from "../StatusEffect"
    import CreedAgent from "../AiAgents/CreedAgent"
    import { Entity } from "../entity/Entity"
    import { SkillTargetSelector, SkillAttack } from "../core/skill"

    const ID = 9
    class Hacker extends Player {
        readonly hpGrowth: number
        readonly cooltime_list: number[]
        readonly skill_ranges: number[]

        itemtree: {
            level: number
            items: number[]
            final: number
        }
        readonly duration_list: number[]

        static readonly PROJ_W='reaper_w'
        static readonly Q_SHIELD="reaper_q"
        static readonly ULT_SHIELD="reaper_ult"
        static readonly SKILL_EFFECT_NAME=["magician_q", "hit", "hacker_r"]

        static readonly SKILL_SCALES=SKILL_SCALES[ID]
        private transformPlayer:Player|null
        private copiedCharId:number

        constructor(turn: number, team: number , game: Game, ai: boolean, name: string) {
            super(turn, team, game, ai, ID, name)
            this.skill_ranges=[7,30,20]

            this.cooltime_list = [3, 4, 6]
            this.duration_list=[0,0,0]
            this.transformPlayer=null
            this.copiedCharId=-1
            //this.AiAgent=new CreedAgent(this)
            
        }
        /**
         * create dummy player that shares component with this player
         * @param charId 
         */
        private createTransformPlayer(charId:number){
            this.transformPlayer=this.game.createPlayer(this.team,charId,this.name,this.turn,this.AI)
            this.transformPlayer.ability=this.ability
            this.transformPlayer.effects=this.effects
            
            this.transformPlayer.changeSkillImage("",SKILL.ULT)
        }
        /**
         * set dummy player`s data to be same with player
         * @returns 
         */
        private syncTransformPlayer(){
            if(!this.transformPlayer) return
            this.transformPlayer.inven=this.inven
            this.transformPlayer.pos=this.pos
            this.transformPlayer.level=this.level
        }
        /**
         * 
         * @param charId character to copy
         * @returns 
         */
        copyCharacter(charId:number):boolean{
            if(charId==ID) return false
            this.createTransformPlayer(charId)
            this.copiedCharId=charId
            return true
        }
        /**
         * create dummy player of copied character
         */
        private onBeforeCopiedSkillUse(){
            if(this.copiedCharId!==-1)
                this.syncTransformPlayer()
        }
        /**
         * remove dummy player and reset copied character
         */
        private onAfterCopiedSkill(){
            this.copiedCharId=-1
            this.transformPlayer=null
            this.changeSkillImage("",SKILL.ULT)
        }
        



        getSkillScale(){
            return Hacker.SKILL_SCALES
        }

        getSkillTrajectorySpeed(skilltype: string): number {
            return 0
        }

        private buildProjectile() {
            let _this: Player = this
            return new ProjectileBuilder(this.game,Hacker.PROJ_W,Projectile.TYPE_RANGE)
                .setSize(3)
                .setSource(this)
                .setAction(function (this: Player) {
                    this.game.playerForceMove(this,this.pos - 4, false,  FORCEMOVE_TYPE.SIMPLE)
                })
                .setDamage(new Damage(0, this.getSkillBaseDamage( SKILL.W), 0))
                .setTrajectorySpeed(300)
                .addFlag(Projectile.FLAG_IGNORE_OBSTACLE)
                .setDuration(2)
                .build()
        }

        getSkillTargetSelector(skill: number): SkillTargetSelector {
            let skillTargetSelector: SkillTargetSelector = new SkillTargetSelector(skill) //-1 when can`t use skill, 0 when it`s not attack skill
            this.pendingSkill = skill
        //	console.log("getSkillAttr" + skill)
            switch (skill) {
                case  SKILL.Q:
                    skillTargetSelector.setType( SKILL_INIT_TYPE.TARGETING).setRange(7)

                    break
                case  SKILL.W:
                    skillTargetSelector.setType( SKILL_INIT_TYPE.PROJECTILE).setRange(30).setProjectileSize(3)

                    break
                case SKILL.ULT:
                    if(this.copiedCharId===-1)
                        skillTargetSelector.setType( SKILL_INIT_TYPE.TARGETING).setConditionedRange(function(this:Entity){
                            return !((this instanceof Player) && this.champ==CHARACTER.HACKER)
                        },30)

                    else if(this.transformPlayer)
                        skillTargetSelector = this.transformPlayer.getSkillTargetSelector(skill)
                    break
            }
            return skillTargetSelector
        }
        getSkillName(skill: number): string {
            return Hacker.SKILL_EFFECT_NAME[skill]
        }

        getBasicAttackName(): string {
            if(this.copiedCharId!==-1 && this.transformPlayer){
                return this.transformPlayer.getBasicAttackName()
            }
            return super.getBasicAttackName()
        }

        getSkillProjectile(pos:number): Projectile|null {
            let s: number = this.pendingSkill
            this.pendingSkill = -1
            if (s ===  SKILL.W) {
                let proj = this.buildProjectile()
                this.startCooltime( SKILL.W)
                return proj
            }
            else if(s== SKILL.ULT && this.copiedCharId!==-1 && this.transformPlayer){
                this.onBeforeCopiedSkillUse()
                this.startCooltime(s)
                let proj= this.transformPlayer.getSkillProjectile(pos)
                this.onAfterCopiedSkill()
                return proj
            }
            return null
        }
        getSkillBaseDamage(skill: number): number {
            switch(skill){

            }
            if (skill ===  SKILL.Q) {
                return this.calculateScale(Hacker.SKILL_SCALES.Q!)
            }
            if (skill ===  SKILL.ULT) {
                return this.calculateScale(Hacker.SKILL_SCALES.R!)
            }
            if (skill ===  SKILL.W) {
                return this.calculateScale(Hacker.SKILL_SCALES.W!)
            }
            return 0
        }

        getSkillDamage(target: Entity): SkillAttack |null{
        //	console.log(target + "getSkillDamage" + this.pendingSkill)
            let damage = null
            let s: number = this.pendingSkill
            this.pendingSkill = -1
            switch (s) {
                case  SKILL.Q:
                    damage = new SkillAttack(new Damage(this.getSkillBaseDamage(s),0,0),this.getSkillName(s)).ofSkill(s)
                    this.startCooltime(s)
                    break
                case SKILL.ULT:
                    if(this.copiedCharId!==-1 && this.transformPlayer){
                        this.onBeforeCopiedSkillUse()
                        damage= this.transformPlayer.getSkillDamage(target)
                        this.startCooltime(s)
                        this.onAfterCopiedSkill()
                    }
                    else if(target instanceof Player){
                        damage = new SkillAttack(Damage.zero(),this.getSkillName(s)).ofSkill(s)

                        if(this.copyCharacter(target.champ))
                            this.sendConsoleMessage("Hacker extracted "+target.champ_name+"`s ultimate!")
                    }
                    break
            }

            return damage
        }

        useActivationSkill(skill: number): void {
            if(skill== SKILL.ULT && this.copiedCharId!==-1 && this.transformPlayer) {
                this.onBeforeCopiedSkillUse()
                this.transformPlayer.useActivationSkill(skill)
                this.setSingleSkillDuration(skill,this.transformPlayer.duration_list[skill])
                this.startCooltime(skill)
                if(this.copiedCharId===CHARACTER.BIRD) this.changeSkillImage("",SKILL.Q)
            }
        }

        getBaseBasicAttackDamage(): Damage {
            return super.getBaseBasicAttackDamage()
        }
        onSkillDurationCount() {
            if(this.transformPlayer && this.copiedCharId!==-1 && this.transformPlayer)
                this.transformPlayer.onSkillDurationCount()
        }
        onSkillDurationEnd(skill: number) {
            if(skill== SKILL.ULT && this.copiedCharId!==-1 && this.transformPlayer){
                this.transformPlayer.onSkillDurationEnd(skill)
                this.onAfterCopiedSkill()
                if(this.copiedCharId===CHARACTER.BIRD) this.changeSkillImage("",SKILL.Q)
            }
                
        }
    }

    export { Hacker }
