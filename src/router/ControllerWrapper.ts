import type {Request,Response} from 'express';
import { ISession } from '../session/ISession';
import { Logger } from '../logger';

export type IController={
    (req:Request,res:Response,session:ISession):Promise<void>
}
export type INoSessionController={
    (req:Request,res:Response):Promise<void>
}
export function ControllerWrapper(controller:IController,successCode?:number){

    return (req:Request,res:Response) => {
        const session=res.locals.session
        if(!session) 
        {
            Logger.warn("unauthorized access without session",req.url)
            return res.status(401).end("Session does not exists")
        }
        
        let code = successCode?successCode:200
        controller(req,res,session)
        .then(()=>{
            res.status(code).end()
        })
        .catch((e:Error)=>{
            Logger.error(req.path,e)
            res.status(500).send(e.toString())
        })
    }
}

export function NoSessionControllerWrapper(controller:INoSessionController,successCode?:number){

    return (req:Request,res:Response) => {

        let code = successCode?successCode:200
        controller(req,res)
        .then(()=>{
            res.status(code).end()
        })
        .catch((e:Error)=>{
            Logger.error(req.path,e)
            res.status(500).send(e.toString())
        })
    }
}