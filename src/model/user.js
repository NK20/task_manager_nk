const mongoose = require('mongoose')
const validator= require('validator')
const bcryptjs = require('bcryptjs')
const jwt= require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true,
        trim: true
    },
    email:{
        type:String,
        unique:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is Invalid')
            }
        }

    },
    password:{
        type: String,
        required: true,
        trim: true,
        validate(value){
            if(value.includes('password') || value.length <5){
                throw new Error( 'Invalid Passowrd!!\n : Password cannot contain word password!! \n Min Length is 5')
            }
        }
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }],
    avatar:{
        type: Buffer
    }
},{
    timestamps:true
})

userSchema.virtual('tasks',{
    ref: 'Task',
    localField: '_id',
    foreignField: 'Owner'
})
userSchema.methods.generateToken= async function(){
    const user = this
    const token= jwt.sign({"_id":user._id},process.env.JWT_SECRET)
    user.tokens= user.tokens.concat({token})
    await user.save()

    return token
}

userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}
userSchema.statics.findUserByCredentials = async function(email, password){
    try {
        const userFound = await User.findOne({email})
        if(!userFound){
            throw new Error('Unable To login')
        }
        const isMatch = await bcryptjs.compare(password, userFound.password)
        if(!isMatch){
            throw new Error('Unable To login')
        }
        return userFound
    } catch (error) {  
    }
}
userSchema.pre('save', async function(next){
    const user = this
    if(user.isModified('password')){
        user.password= await bcryptjs.hash(user.password, 8)
    }
    
    next()
})

userSchema.pre('remove', async function(next){
    const user= this
    await Task.deleteMany({Owner: user._id})
    next()
})
const User = mongoose.model('User',userSchema)

module.exports =User