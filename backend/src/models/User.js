 import mongoose from "mongoose";
 import bcrypt from "bcryptjs";

 const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    age:{
        type:Number,
        required:true,
        unique:true
    },
    gender:{
        type:String,
        required:true,  
    },
    password:{
        type:String,
        required:true,
        minlength:6
    },
    profileImage:{
        type:String,
        default:""
    }
 });

 // hash the password before saving the user to DB
 userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
 });

 //compare password func
 userSchema.methods.comparePassword = async function(userPassword) {
    return await bcrypt.compare(userPassword, this.password);
 }

 const User = mongoose.model("User", userSchema);

 export default User;