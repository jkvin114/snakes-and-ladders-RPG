import { createContext } from "react";

export type IRootContext = {
    
    username : string|null
    loggedin:boolean
    showToolbar:boolean
    lang?:string|null
}
export type ContextHook = {
    context:IRootContext,
    setContext:(context:IRootContext)=>void
}

export const RootContext = createContext<ContextHook>({
    context:{
        loggedin:false,
        username:null,
        showToolbar:true,
        lang:"en"
    },
    setContext:()=>{
    }
})