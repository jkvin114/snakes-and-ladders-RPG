export namespace UserStorage{
    export function saveUser(name:string,profile:string){
        if(profile){
            localStorage.setItem("user-"+name+"-profile",profile)
        }
    }
    export function getProfileImg(name?:string){
        if(!name) return undefined
        let profile = localStorage.getItem("user-"+name+"-profile")
        if(!profile) return undefined
        return profile
    }
}