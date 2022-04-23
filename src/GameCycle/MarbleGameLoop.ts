class MarbleGameLoop{
    rname:string
    isTeam:boolean
    constructor(rname:string,isTeam:boolean){
        this.rname=rname
        this.isTeam=isTeam
    }
    static createLoop(
		rname: string,
		isTeam: boolean,
	): MarbleGameLoop {
		return new MarbleGameLoop(rname,isTeam)
	}
}