const express = require('express')
const multer = require('multer')
const path = require('path')
const  cp = require('child_process')


const app = express()


const storage = multer.diskStorage({

    destination : function(req, file,cb){
        cb(null, 'uploads/');
    },

    filename : function(req, file, cb){
        cb(null, file.originalname)
    }
})


const upload = multer({storage : storage})

//For CORS error
app.use((req,res,next) => {
    res.header("Access-Control-Allow-Origin","*");
    res.header(
        "Access-Control-Allow-Headers",
        "origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if(req.method == "OPTIONS") {
        res.header('Access-Control-Allow-Methods', 'PUT ,POST ,DELETE,GET,PATCH')
        return res.status(200).json({})
    }
    next();
})

app.use(express.static(path.join(__dirname , 'public')))

app.post('/upload', upload.single('file') , (req,res) => {

    console.log(req.file);
    const soundFileName = req.file.originalname;

    const pythonProcess = cp.spawn('python3', ['./run.py', soundFileName])

    pythonProcess.stdout.on('data', (data) => {

        const outputLabel = data.toString().split(' ');

        const extractLabel = outputLabel.reduce((a,c) => {
            return a+c;
        }).split('0')[1]

        res.send(extractLabel);
    });

})

app.listen(4000, () => console.log("server is started"))