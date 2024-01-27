import multer = require("multer");
import path = require("path");
const PATH="./frontend/public/uploads"
const PATH_PROFILE="./frontend/public/uploads/profile"
// const PATH_PROFILE="./../uploads"

function getFilename() {
	//console.log(new Date().toISOString().slice(0, 19))
	return (
		new Date().toISOString().slice(0, 19).replace("T", "_").replace(/:/g, "") + "_" + Math.floor(Math.random() * 999)
	)
}
const fileFilter = (req:any, file:any, cb:any) => {
  // 확장자 필터링
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true); // 해당 mimetype만 받겠다는 의미
  } else {
    // 다른 mimetype은 저장되지 않음
    req.fileValidationError = "You can only upload jpg,jpeg,png files.";
    cb(null, false);
  }
};
namespace ImageUploader{

  export const upload = multer({
    storage: multer.diskStorage({
      //폴더위치 지정
      destination: (req:any, file:any, done:any) => {
        done(null, PATH);
      },
      filename: (req:any, file:any, done:any) => {
        const ext = path.extname(file.originalname);
        // aaa.txt => aaa+&&+129371271654.txt
        const fileName =  getFilename() + ext;
        done(null, fileName);
      },
    }),
    fileFilter : fileFilter,
    limits: { fileSize: 30 * 1024 * 1024 },
  });
  
  export const uploadProfile = multer({
    storage: multer.diskStorage({
      //폴더위치 지정
      destination: (req:any, file:any, done:any) => {
        done(null, PATH_PROFILE);
      },
      filename: (req:any, file:any, done:any) => {
        const ext = path.extname(file.originalname);
        // aaa.txt => aaa+&&+129371271654.txt
        const fileName =  getFilename() + ext;
        done(null, fileName);
      },
    }),
    fileFilter : fileFilter,
    limits: { fileSize: 30 * 1024 * 1024 },
  });
  
}
export { ImageUploader };