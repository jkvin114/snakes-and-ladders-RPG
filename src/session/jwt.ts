
import Jwt from "jsonwebtoken"
import {Request,Response} from 'express';
import type { Socket } from "socket.io";

import cookie from "cookie";

const key="salr_session_key_4321"
declare module 'jsonwebtoken' {
    export interface CustomJwtPayload extends Jwt.JwtPayload {
        id: string
    }
}

function extractTokenPayload (req:Request) {
    if (req.cookies && req.cookies.jwt) {
        return decodeToken(req.cookies.jwt);
    }
    return null;

}

function decodeToken(token:string){
	try{
		return Jwt.verify(token,key)
	}
	catch(e){
		console.error("Failed to verify jwt")
		console.error(e)
		return null
	}
}

export function getSessionIdFromSocket(socket:Socket){
	const c = cookie.parse(socket.request.headers.cookie)
	if(c  && c.jwt){
		let token= decodeToken(c.jwt) as Jwt.CustomJwtPayload
		return token
	}
	return null
}

export function getSessionId(req:Request){
	let token=extractTokenPayload(req) as Jwt.CustomJwtPayload
	if(token) return token.id
	return null
}
export function getNewJwt(id:string){
	return Jwt.sign({id:id},key,{expiresIn: "7d"})
}
export function setJwtCookie(res:Response,token:string){
    res.cookie("jwt",token,{ maxAge: 24000 * 60 * 60 * 7, httpOnly: true })
}