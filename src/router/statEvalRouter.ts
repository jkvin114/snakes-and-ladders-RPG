import express, { Express, Request, Response } from 'express';
import { CharacterSimulationEvalSchema } from '../mongodb/schemaController/CharacterSimulationEval';
import { SimulationEvalSchema } from '../mongodb/schemaController/SimulationEval';
import SETTINGS = require("../../res/globalsettings.json")
import { CharacterCommentSchema } from '../mongodb/schemaController/CharacterComment';
import { adminauth } from './board/helpers';

const router = express.Router()


//list of versions played more than once
router.get('/list/version' ,async function (req: Request, res:Response) {
    try {
        
        const data= await SimulationEvalSchema.findAllVersions()

        return res.status(200).json({versions:[...new Set(data.map(d=>d.patchVersion))]})
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

//list of gametypes played more than once in a version
router.get('/list/gametype/:version' ,async function (req: Request, res:Response) {
    let version= req.params.version
    if(version==="recent") version=SETTINGS.patch_version
    try {
        
        const data= await SimulationEvalSchema.findGameTypesInVersion(version)

        return res.status(200).json({gametypes:[...new Set(data.map(d=>d.gameType))]})
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})

//list of maps played more than once in a version
router.get('/list/map/:version' ,async function (req: Request, res:Response) {
    let version= req.params.version
    if(version==="recent") version=SETTINGS.patch_version
    try {
        const data= await SimulationEvalSchema.findMapsInVersion(version)
        return res.status(200).json({maps:[...new Set(data.map(d=>d.mapName))]})
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})


router.get('/overview/:map/:version' ,async function (req: Request, res:Response) {
    let version= req.params.version
    if(version==="recent") version=SETTINGS.patch_version
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
    let version= req.query.version
    if(version==="recent") version=SETTINGS.patch_version
    const character= req.params.character
    const map=req.query.map
    const gametype=req.query.gametype
    if(!( typeof(version)== "string") ||!( typeof(map)== "string")||!( typeof(gametype)== "string")) 
        return res.status(400).end("map, version, and gametype parameters are required")
    
    if(!map || !gametype || !version) return res.status(400).end("map, version, and gametype parameters are required")
    try {
        const data=await CharacterSimulationEvalSchema.findByMapAndGameType(version,Number(character),map,gametype)
        return res.status(200).json(data)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
    
})
router.get('/character/:character/comment' ,async function (req: Request, res:Response) {

    const character= req.params.character
    try {
        const data=await CharacterCommentSchema.findByCharacter(Number(character))
        return res.status(200).json(data)
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})
router.get('/character/:character/trend' ,async function (req: Request, res:Response) {
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
router.post('/delete/:map/:version/:gametype',adminauth ,async function (req: Request, res:Response) {
    let version= req.params.version
    if(version==="recent") version=SETTINGS.patch_version
    const map=req.params.map
    try {
        // console.log(version,map,req.params.gametype)
        let data=await SimulationEvalSchema.deleteBy(version,map,req.params.gametype)
        data=await CharacterSimulationEvalSchema.deleteBy(version,map,req.params.gametype)
        return res.status(200).end()
    } catch (error) {
        console.error(error)
        return res.status(500).end()
    }
})
module.exports=router
