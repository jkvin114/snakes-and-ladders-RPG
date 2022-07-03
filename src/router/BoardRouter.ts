import express = require('express');
const router = express.Router()
const {upload} = require("../mongodb/mutler")
import fs = require("fs")
import path = require("path")

const clientPath = `${__dirname}/../../../SALR-android-webview-master`

const auth = (req:express.Request, res:express.Response, next:express.NextFunction) => {
    next();
    return
    try {
      if (req.session.isLogined) {
        next();
    } else {
        res.status(401).redirect("");
      }
    } catch {
      res.status(401).redirect("");
    }
  };

const firstpage = fs.readFileSync(clientPath+"/index.html", "utf8")

router.post("/uploadimg", auth, upload.single("img"), async (req, res) => {

    const imgfile = req.file;
    console.log(imgfile)
    // console.log(req.body.content)
    res.status(201).send({
        message: "Uploaded image successfully",
        fileInfo: req.file
    })
});
router.get("/article/write",auth,(req,res)=>{
    res.end(fs.readFileSync(clientPath+"/writeArticle.html", "utf8"))
})

router.post("/article/write", auth, upload.single("img"), async (req, res) => {
    
    const imgfile = req.file;
    // console.log(imgfile)
    // console.log(req.body.title)
    // console.log(req.body.content)
    // console.log(req.session.isLogined)

    res.redirect("/board/article/"+req.body.title)
});

router.post("/comment",auth, (req, res) => {

});

router.post("/comment_reply",auth, (req, res) => {

});


router.get("/article/:articleId",(req,res)=>{
   console.log(req.params.articleId)
    res.status(201).sendFile(path.join(clientPath,"/article.html"))
    res.redirect("/board/article/23468295")
})
module.exports=router
