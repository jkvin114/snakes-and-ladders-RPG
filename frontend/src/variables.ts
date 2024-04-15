// export const backend_url="http://192.168.0.3:5000"
console.log(process.env)
export const backend_url=String(process.env.REACT_APP_BACKEND_URL)

export const profile_img_path="/uploads/profile/"