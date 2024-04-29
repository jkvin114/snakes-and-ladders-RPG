import { createContext } from "react";


export type LocaleContextHook = {
    locale:any,
    setLocale:(context:any)=>void
}

export const LocaleContext = createContext<LocaleContextHook>({
    locale:{

    },
    setLocale:()=>{
    }
})