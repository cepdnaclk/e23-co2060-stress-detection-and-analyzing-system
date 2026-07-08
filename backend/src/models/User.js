 import mongoose from "mongoose";
 import bcrypt from "bcryptjs";

const questionnaireResultSchema = new mongoose.Schema(
    {
        totalScore: {
            type: Number,
            required: true,
        },
        severity: {
            type: String,
            required: true,
        },
        stressScore: {
            type: Number,
            required: true,
        },
        stressSeverity: {
            type: String,
            required: true,
        },
        anxietyScore: {
            type: Number,
            required: true,
        },
        anxietySeverity: {
            type: String,
            required: true,
        },
        depressionScore: {
            type: Number,
            required: true,
        },
        depressionSeverity: {
            type: String,
            required: true,
        },
        recordedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

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
    role: {
        type: String,
        enum: ["user", "admin", "volunteer_doctor"],
        default: "user",
    },
    profileImage:{
        type:String,
        default:""
    },
    questionnaireResults: {
        type: [questionnaireResultSchema],
        default: [],
    }
 }, {timestamps:true});

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