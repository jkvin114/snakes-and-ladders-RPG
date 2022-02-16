import express = require('express');
const router = express.Router()
const{GameRecord,SimulationRecord} = require("./statisticsDB")



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

    SimulationRecord.findByRange(Number(start),Number(count))
    .then((stat:simulationRecord[]) => {
        if (!stat || stat.length===0) return res.status(404).send({ err: 'Statistic not found' });
        let result=[]
        for(let s of stat){
            result.push({
                date:s.createdAt,
                id:s._id,
                count:s.stat.length,
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


module.exports=router

