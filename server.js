const express = require('express')
const dotenv = require("dotenv");
const cors = require('cors');
const mongoose = require('mongoose')


dotenv.config();

const app = express();

mongoose.connect(
  process.env.DBKEY,
  { useNewUrlParser: true, useUnifiedTopology: true },
  err => {
    if (err) {
      console.log(err);
    } else {
      console.log("Connected to the database");
    }
  }
);

//Middlewares
app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use(express.json());



const User = require('./models/user')
const Video = require('./models/video')

const {isExists} = require('./utils/array')


app.post("/login", async (req,res)=>{
  const {username,password} = req.body;

  const user = await User.findOne({username})

  if(!user){
    const newUser = new User({
      username,
      password
    })
    await newUser.save()

    return res
      .status(200)
      .json({token:newUser.username})
  }
 
  else if(user && password !== user.password){
    return res.status(401).json({message:"Wrong Password"})
  } 
  return res.status(200).json({token:user.username}) 
})

app.post("/videos/:id/like", async (req,res)=>{
  
  const {id} = req.params
  const {token} = req.body
  
  const user = await User.findOne({username:token})
  const video = await Video.findOne({_id:id})

  if(!video){
    return res.status(422).json({message:"Video Not Found"})
  }

  if(video.likes.includes(user._id)){
    video.likeCounter -= 1
    video.likes.push(user._id)
  } else{
    video.likeCounter += 1
    user.likes.pop(user._id)
  }
  console.log(video.likes)
  await video.save()

  return res.status(201).json({success:true})
})


app.post("/videos", async (req,res)=>{ 
  const {title,description,source,owner} = req.body;

  const newVideo = new Video({
    title,description,source,owner
  });

  await newVideo.save();

  return res.status(200).json({success:true})
})


app.use("/login",(req,res)=>{
  const {username,password} = req.body;
  return res.status(200).json({token:"value token"})
})



app.get("/videos", async (req,res)=>{

  const{token} = req.query
  const user = await User.findOne({username:token})

  //Get DB
  const videos = await Video.find({})
  .populate({path:'owner',select:'username followerCounter'})
  .populate({path:'likes',select:"username"})
  .lean();

  const results = videos.map(video=>{
    if(user && isExists(video.likes,'username',user.username)){
      video.isLiked = true
    }
    else{
      video.isLiked = false
      return video
    }
    
  })

  return res.status(200).json(results)
})





app.listen(3000,()=>{
  console.log("Running on PORT:3000")  
})