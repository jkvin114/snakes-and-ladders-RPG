import type { Ability } from "../Ability/Ability"
import type { Action } from "./Action"

class ActionPackage{
    before:Action[]
    after:Action[]
    main:Action[]
    blocksMain:boolean
    blockedAbilities:Ability[]
    executedAbilities:Ability[]
    constructor(){
        this.main=[]
        this.before=[]
        this.after=[]
        this.blockedAbilities=[]
        this.executedAbilities=[]
        this.blocksMain=false
    }
    setMain(...main:Action[]){
        this.main=main
        return this
    }
    addBefore(a:Action){
        this.before.push(a)
        return this
    }
    addAfter(a:Action){
        this.after.push(a)
        return this
    }
    addBlocked(a:Ability){
        this.blockedAbilities.push(a)
        return this
    }
    addExecuted(a:Ability){
        this.executedAbilities.push(a)
        return this
    }
    blockMain(){
        this.blocksMain=true
        return this
    }
    hasAfter(){
        return this.after.length!==0
    }
    hasBefore(){
        return this.before.length!==0
    }
    mainOnly(){
        return !this.hasAfter() && !this.hasBefore()
    }
}
export {ActionPackage}