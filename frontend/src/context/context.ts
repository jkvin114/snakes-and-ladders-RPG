import { createContext } from "react";

export type IRootContext = {
    
    username : string|null
    loggedin:boolean
}

export const RootContext = createContext<IRootContext>({
    loggedin:false,
    username:null
})