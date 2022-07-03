import express = require('express');
const router = express.Router()
const{GameRecord,SimulationRecord,SimpleSimulationRecord} = require("../mongodb/DBHandler")



interface simulationRecord{
    createdAt:string
    _id:string
    stat:any[]
    count:number
    multiple:boolean
    version:string
    setting:{key:string,value:any}[]
}


router.get('/simulation/summary' ,function (req: express.Request, res:express.Response) {
    let count=req.query.count
    let start=req.query.start?req.query.start:0
    console.log(count)
    if(start<0) return res.end()
    
    SimulationRecord.findSummaryByRange(Number(start),Number(count))
    .then((stat:any[]) => {
        if (!stat) return res.status(404).send({ err: 'Statistic not found' });
        else if(stat.length===0) return res.end()
        let result=[]
        for(let s of stat){
            result.push({
                date:s.createdAt,
                id:s._id,
                count:s.count,
                setting:s.setting
            })
        }
        res.end(JSON.stringify(result));
    })
    .catch((err:any) => res.status(500).send(err))
})

router.get('/simulation',function(req: express.Request, res:express.Response){
    let id=req.query.statid
    SimulationRecord.findOneById(id)
    .then((stat:simulationRecord)=>{
        res.end(JSON.stringify(stat));
    })
    .catch((err:any) => res.status(500).send(err))
})


router.get('/simulation/game',function(req: express.Request, res:express.Response){
    let id=req.query.statid
    SimulationRecord.findOneById(id)
    .then((stat:simulationRecord)=>{
        res.end(JSON.stringify(stat));
    })
    .catch((err:any) => res.status(500).send(err))
})

router.get('/game' ,function (req: express.Request, res:express.Response) {
    let count=req.query.count
    let start=req.query.start?req.query.start:0
    console.log(count)
    if(start<0) return res.end()

    GameRecord.findByRange(Number(start),Number(count))
    .then((stat:any[]) => {
        if (!stat) return res.status(404).send({ err: 'Statistic not found' });
        else if(stat.length===0) return res.end()
        res.end(JSON.stringify({
            stat:stat,
            multiple:true,
            isGamelist:true
        }));
    })
    .catch((err:any) => res.status(500).send(err))
})


router.get('/simulation/simple' ,function (req: express.Request, res:express.Response) {
    let count=req.query.count
    let start=req.query.start?req.query.start:0
    let serverVersion=req.query.version
    if(start<0) return res.end()

    //version don`t matter
    if(!serverVersion){
        SimpleSimulationRecord.findByRange(Number(start),Number(count))
        .then((stat:Object[]) => {
            if (!stat) return res.status(404).send({ err: 'Statistic not found' });
            else if(stat.length===0) return res.end()
            res.end(JSON.stringify(stat));
        })
        .catch((err:any) => res.status(500).send(err))
    }
    else{
        SimpleSimulationRecord.findByRangeAndVersion(Number(start),Number(count),serverVersion)
        .then((stat:Object[]) => {
            if (!stat) return res.status(404).send({ err: 'Statistic not found' });
            else if(stat.length===0) return res.end()
            res.end(JSON.stringify(stat));
        })
        .catch((err:any) => res.status(500).send(err))
    }
    
    
})
module.exports=router

