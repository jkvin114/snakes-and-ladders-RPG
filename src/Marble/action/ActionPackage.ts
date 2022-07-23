import { Action } from "./Action"

class ActionPackage{
    before:Action[]
    after:Action[]
    main:Action[]
    blocksMain:boolean
    constructor(){
        this.main=[]
        this.before=[]
        this.after=[]
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