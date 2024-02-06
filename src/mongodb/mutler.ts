import multer = require("multer");
import path = require("path");
import { Logger } from "../logger";
// const PATH="./frontend/public/uploads"
// const PATH_PROFILE="./frontend/public/uploads/profile"
import sharp = require("sharp")

const PATH = "./res/image/post"
const PATH_PROFILE = "./res/image/profile"

import fs from "fs";
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

const MAX_IMAGE_WIDTH = 300

namespace ImageUploader{


  
	export const resizeImg = (req: any, res: any, next: Function) => {
		if (!req.file || req.file.size < 800000) {
			next()
			return
		}
		const ext = path.extname(req.file.path)
		const newname = getFilename() + ext
		try {
			sharp(req.file.path) // 리사이징할 파일의 경로
				.resize({ width: MAX_IMAGE_WIDTH }) // 원본 비율 유지하면서 width 크기만 설정
				.withMetadata()
				.toFile(PATH + "/" + newname, (err, info) => {
					if (err) throw err
					// console.log(info)
					fs.unlink(req.file.path, (err) => {
						// 원본파일은 삭제해줍니다
						// 원본파일을 삭제하지 않을거면 생략해줍니다
						if (err) throw err
					})
					req.file.filename = newname
					req.file.path = PATH + "/" + newname
					next()
				})
		} catch (err) {
			Logger.error("image resize "+req.file.path ,err)
			delete req.file
			next()
		}
	}



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
    // limits: { fileSize: 30 * 1024 * 1024 },
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
    // limits: { fileSize: 30 * 1024 * 1024 },
  });


  export function deletePostImages(images:string[]){
    if(!images || images.length===0) return
    try{
      for(const img of images){
          fs.unlinkSync(PATH+"/"+img)
      }
      Logger.log("deleted post images: ",...images)
    }
    catch(e){
      Logger.error("error while delete images ",e)
    }
    
  }
  
}
export { ImageUploader };