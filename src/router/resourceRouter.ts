import express = require('express');
import { R } from '../Room/RoomStorage';
import { MAP_TYPE } from '../RPGGame/data/enum';
import fs = require("fs")
import { MarbleRoom } from '../Marble/MarbleRoom';
const RESOURCE_PATH="/../../res/"
const router = express.Router()
const{MarbleItemPreset} = require("../mongodb/GameDBSchema")
const{Replay} = require("../mongodb/ReplayDBHandler")

import type { Request, Response } from "express"

import GameSetting from "../../res/gamesetting.json"
const _GameSetting = JSON.stringify(GameSetting)

import SimSetting from "../../res/simulationsetting.json"
const _SimSetting = JSON.stringify(SimSetting)

import GlobalSetting from "../../res/globalsettings.json"
const _GlobalSetting = JSON.stringify(GlobalSetting)

import map0 from "../../res/map.json"
const _Map0 = JSON.stringify(map0)

import map1 from "../../res/ocean_map.json"
const _Map1 = JSON.stringify(map1)
import map2 from "../../res/casino_map.json"
const _Map2 = JSON.stringify(map2)
import map3 from "../../res/rapid_map.json"
const _Map3 = JSON.stringify(map3)

import item from "../../res/item_new.json"
const _Item = JSON.stringify(item)
import skill from "../../res/skill.json"
const _Skill = JSON.stringify(skill)
import obs from "../../res/obstacle_data.json"
const _Obstacle = JSON.stringify(obs)

import marblemap0 from "../../res/marble/world_map.json"
const _MarbleMap0 = JSON.stringify(marblemap0)

import marblemap1 from "../../res/marble/godhand_map.json"
const _MarbleMap1 = JSON.stringify(marblemap1)

import marblecoord from "../../res/marble/map_coordinates.json"
const _MarbleCoord = JSON.stringify(marblecoord)


router.get("/gamesetting", function (req:Request, res:Response) {
	res.end(_GameSetting)
})
router.get("/simulationsetting", function (req:Request, res:Response) {
	res.end(_SimSetting)
})
router.get("/globalsetting", function (req:Request, res:Response) {
	res.end(_GlobalSetting)
})
router.get("/visualeffects", function (req:Request, res:Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"visualeffects.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting visualeffects setting file"})
		}
		res.end(data)
	})
})

router.get("/map/:mapId", function (req:Request, res:Response) {

	let mapId = Number(req.params.mapId)
	if (mapId === MAP_TYPE.OCEAN) {
		return res.end(_Map1)
	} else if (mapId=== MAP_TYPE.CASINO) {
		return res.end(_Map2)
	}else if (mapId=== MAP_TYPE.RAPID) {
		return res.end(_Map3)
	}
	return res.end(_Map0)
})

router.get("/item", function (req:Request, res:Response) {
	res.end(_Item)
})
router.get("/skill", function (req:Request, res:Response) {
	res.end(_Skill)
})
router.get("/obstacle", function (req:Request, res:Response) {
	res.end(_Obstacle)
})

//unused
router.get("/string_resource", function (req:Request, res:Response) {
	return
	if (req.query.lang === "kor") {
		fs.readFile(__dirname + RESOURCE_PATH+"string_resource_kor.json", "utf8", function (err, data) {
			if(err){
				res.status(500).send({err:"error while requesting resource file"})
			}
			res.end(data)
		})
	}
	else{
		fs.readFile(__dirname + RESOURCE_PATH+"string_resource.json", "utf8", function (err, data) {
			if(err){
				res.status(500).send({err:"error while requesting resource file"})
			}
			res.end(data)
		})
	}
	
})
router.get("/replay_format", function (req:Request, res:Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"replay_record_format.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting replay_record_format file"})
		}
		res.end(data)
	})
})

router.get("/replay/:replayid", async function (req:Request, res:Response) {
	let data=await Replay.findById(req.params.replayid)

	res.end(JSON.stringify(data))
})


router.get("/marble_map", function (req:Request, res:Response) {
	let room = R.getMarbleRoom(req.session.roomname)
	if (!room) {
		res.status(500).send({err:"error while requesting resource file"})
		return
	}
	if(room.getMapId===0){
		res.end(_MarbleMap0)
	}
	else if(room.getMapId===1){
		res.end(_MarbleMap1)
	}
	
})

router.get("/marble_map_coordinates", function (req:Request, res:Response) {
	res.end(_MarbleCoord)
})

router.get("/marble_items", function (req:Request, res:Response) {
	res.end(JSON.stringify(MarbleRoom.ItemDescriptionCache))
})
router.get("/marble_item_presets", async function (req:Request, res:Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"marble/marbleitempresets.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting resource file"})
		}
		res.end(data)
	})
	
	return

	try{

		let data=await MarbleItemPreset.findAll()

		res.end(JSON.stringify(data))
	}
	catch(e){
		console.error(e)
		res.status(500).end()
	}
})

router.post("/marble_item_presets", async function (req:Request, res:Response) {
	if(!req.body) return
	try{

		
		await MarbleItemPreset.create({
			name:req.body.name,
			items:req.body.items,
			randomCount:req.body.randcount
		})
		res.status(200).end()
	}
	catch(e){
		console.error(e)
		res.status(500).end()
	}
	
})


module.exports=router