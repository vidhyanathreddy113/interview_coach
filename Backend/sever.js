const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connect
mongoose.connect(process.env.MONGO_URL)
.then(()=> console.log("MongoDB Connected"))
.catch(err => console.log(err));

// User schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const User = mongoose.model("User", UserSchema);

// Signup API
app.post("/signup", async (req,res)=>{
  try{
    const {name,email,password} = req.body;

    const existingUser = await User.findOne({email});
    if(existingUser){
      return res.json({message:"User already exists"});
    }

    const hashedPassword = await bcrypt.hash(password,10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    res.json({message:"Signup successful"});
  }
  catch(err){
    res.status(500).json({error:err.message});
  }
});

// Login API
app.post("/login", async (req,res)=>{
  try{
    const {email,password} = req.body;

    const user = await User.findOne({email});
    if(!user){
      return res.json({message:"User not found"});
    }

    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch){
      return res.json({message:"Invalid password"});
    }

    const token = jwt.sign({id:user._id}, "secretkey",{expiresIn:"1d"});

    res.json({
      message:"Login successful",
      token,
      user:{
        name:user.name,
        email:user.email
      }
    });
  }
  catch(err){
    res.status(500).json({error:err.message});
  }
});

app.get("/",(req,res)=>{
  res.send("Backend running");
});

app.listen(5000,()=>{
  console.log("Server running on port 5000");
});