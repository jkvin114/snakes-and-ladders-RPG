export default interface Transaction{
    type:"buy"|"sell"
    money:number
    shares:number
    date:string
}