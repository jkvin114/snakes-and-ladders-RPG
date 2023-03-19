import express, { Express, Request, Response } from 'express';
import { CharacterSimulationEvalSchema } from '../mongodb/schemaController/CharacterSimulationEval';
import { SimulationEvalSchema } from '../mongodb/schemaController/SimulationEval';
import SETTINGS = require("../../res/globalsettings.json")

const router = express.Router()

router.get('/list/version' ,async function (req: Request, res:Response) {
    try {
        
        const data= await SimulationEvalSchema.findAllVersions()

        return res.status(200).json({versions:[...new Set(data.map(d=>d.serverVersion))]})
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

router.get('/list/gametype/:version' ,async function (req: Request, res:Response) {
    let version= req.params.version
    if(version==="recent") version=SETTINGS.version
    try {
        
        const data= await SimulationEvalSchema.findGameTypesInVersion(version)

        return res.status(200).json({gametypes:[...new Set(data.map(d=>d.gameType))]})
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

router.get('/list/map/:version' ,async function (req: Request, res:Response) {
    let version= req.params.version
    if(version==="recent") version=SETTINGS.version
    try {
        const data= await SimulationEvalSchema.findMapsInVersion(version)
        return res.status(200).json({maps:[...new Set(data.map(d=>d.mapName))]})
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

router.get('/:map/:version' ,async function (req: Request, res:Response) {
    let version= req.params.version
    if(version==="recent") version=SETTINGS.version
    const map=req.params.map
    try {
        const data=await SimulationEvalSchema.findByVersionWithCharacters(version,map)
        return res.status(200).json(data)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

router.get('/character/:character' ,async function (req: Request, res:Response) {
    let version= req.params.version
    if(version==="recent") version=SETTINGS.version
    const character= req.params.character
    const map=req.query.map
    const gametype=req.query.gametype
    if(!( typeof(version)== "string") ||!( typeof(map)== "string")||!( typeof(gametype)== "string")) return
    
    if(!map || !gametype || !version) return res.status(400).end("map, version, and gametype parameters are required")
    try {
        const data=await CharacterSimulationEvalSchema.findByMapAndGameType(version,Number(character),map,gametype)
        return res.status(200).json(data)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

router.get('/trend/character/:character' ,async function (req: Request, res:Response) {
    const character= req.params.character
    const map=req.query.map
    const gametype=req.query.gametype
    if(!( typeof(map)== "string")||!( typeof(gametype)== "string")) return
    if(!map || !gametype) return res.status(400).end("map and gametype parameters are required")
    try {
        const data=await CharacterSimulationEvalSchema.findTrend(Number(character),map,gametype)

        return res.status(200).json(data)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }

})

module.exports=router
