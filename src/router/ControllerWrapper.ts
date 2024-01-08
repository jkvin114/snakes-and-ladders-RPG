import type {Request,Response} from 'express';
import { ISession } from '../session/inMemorySession';

export type IController={
    (req:Request,res:Response,session:ISession):Promise<void>
}
export function ControllerWrapper(controller:IController,successCode?:number){

    return (req:Request,res:Response) => {
        const session=res.locals.session
        if(!session) 
        {
           return res.status(401).end("Session does not exists")
        }
        
        let code = successCode?successCode:200
        controller(req,res,session)
        .then(()=>{
            res.status(code).end()
        })
        .catch((e:Error)=>{
            console.error(e)
            res.status(500).send(e.toString())
        })
    }
}
