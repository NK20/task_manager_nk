const express = require('express')
const User = require('../model/user')
const auth = require('../middleware/auth')
const multer= require('multer')
const sharp = require('sharp') 
const bcrypt = require('bcryptjs')

const router = express.Router()

router.post('/users',async (req, resp)=>{
    const userreq = new User(req.body)
    try{
        const user = await userreq.save()
        const token= await user.generateToken()
        return resp.send({user,token})
    }catch(e){
        resp.status(400).send(e)
    }
    
    // By Promise Chaining 
    // user.save().then((resolve)=>{
    //     resp.send(resolve)
    // }).catch((reject)=>{
    //     resp.status(400).send(reject)
    // })
})

router.post('/users/login', async (req, resp)=>{
    
    try{
        const user = await User.findUserByCredentials(req.body.email, req.body.password)
        const token= await user.generateToken()
        resp.send({user,token})
}catch(e){
        resp.status(404).send({error:'Unable To Login'})
}
})

router.post('/users/logout',auth, async (req,resp)=>{
    
     try {
         req.user.tokens= req.user.tokens.filter((token)=>{
             return token.token !== req.token
         })
         await req.user.save()
         return resp.send()
     } catch (error) {
         resp.status(401).send()
     }

})
router.post('/users/logoutAll',auth,async (req,resp)=>{

    try {
        req.user.tokens= []

        await req.user.save()
        return resp.send()
    } catch (error) {
        resp.status(401).send()
    }

})
router.get('/users/me',auth,async (req,resp)=>{
    resp.send(req.user)
})

router.patch('/users/me',auth, async (req, resp)=>{
    const id = req.params.id
    const allowedUpdates =['name','email','password']
    const requestUpdates= Object.keys(req.body)
    const validationFlag= requestUpdates.every((update)=> allowedUpdates.includes(update))
    
    if(!validationFlag){
        return resp.status(401).send({'error':'Invalid Update Key!!'})
    }
    try {
        // const updateduser = await User.findByIdAndUpdate(id,req.body,{new: true, runValidators: true})
        requestUpdates.forEach((update)=>req.user[update]= req.body[update])
        await req.user.save()
        return resp.send(req.user)
    } catch (error) {
        resp.send(error)
    }
})

router.delete('/users/me',auth, async (req, resp)=>{
    try {
        await req.user.remove()
        return resp.send()
    } catch (error) {
        resp.status(500).send();
    }
})

const uploadPic = multer({
    limits:{
        fileSize: 1000000
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            cb(new Error('please upload a Vaild file'))
        }
        cb(undefined,true)
    }
})

router.post('/users/me/avatar',auth,uploadPic.single('avatar'),async (req,resp)=>{
    req.user.avatar = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    await req.user.save()
    resp.send()
},(error,req,resp,next)=>{
    resp.send({error: error.message})
})

router.get('/users/:id/avatar',uploadPic.single('avatar'),async (req,resp)=>{
    try {
        const user= await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }
        resp.set('Content-Type','image/png')
        resp.send(user.avatar)
    } catch (error) {
        resp.status(404).send()
    }
})

module.exports = router