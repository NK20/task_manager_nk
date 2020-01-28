const express = require('express')
const Task = require('../model/task')
const auth = require('../middleware/auth')
const router = express.Router() 


router.post('/task',auth,async (req, resp)=>{
    const task= new Task({...req.body,
            Owner: req.user._id
    })
    
    try {
        const result= await task.save()
        return resp.send(result)
    } catch (error) {
        resp.status(400).send(error)
    }
    
})

router.get('/tasks',auth,async (req,resp)=>{

    const match={}
    const sort ={}
    if(req.query.completed){
        match.completed= req.query.completed ==='true'
    }
    if(req.query.sortBy){
        const parts= req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc'? -1 : 1
    }
    try {
       // const result= await Task.find({Owner:req.user._id})
       await req.user.populate({
           path:'tasks',
           match,
           options:{
               limit: parseInt(req.query.limit),
               skip: parseInt(req.query.skip),
               sort
           }
       }).execPopulate()
        return resp.send(req.user.tasks)
    } catch (error) {
        resp.status(500)
    }
})

router.get('/task/:id',auth,async (req,resp)=>{
    const _id = req.params.id
    //const id = req.query.id
    try {
        const result= await Task.findOne({_id,Owner:req.user._id})
        if(!result){
            throw new Error()
        }
        return resp.send(result)
    } catch (error) {
        resp.status(404).send()
    }
   
})

router.patch('/task/:id', auth,async (req,resp)=>{
    const _id = req.params.id

    const allowedUpdates =['description','completed']
    const requestUpdates= Object.keys(req.body)
    const validationFlag= requestUpdates.every((update)=> allowedUpdates.includes(update))
    
    if(!validationFlag){
        return resp.status(401).send({'error':'Invalid Update Key!!'})
    }
    try {
       const task = await Task.findOne({_id,Owner: req.user._id})
       if(!task){
           throw new Error()
       }
       requestUpdates.forEach((update)=> task[update]= req.body[update])
       await task.save()
        return resp.send(task)
    } catch (error) {
        resp.status(404).send()
    }
})

router.delete('/task/:id', auth,async (req, resp)=>{
    const _id = req.params.id
    try {
        const task = await Task.findOneAndDelete({_id,Owner:req.user._id})
        if(!task){
            return resp.status(404).send()
        }
        return resp.send(task)
    } catch (error) {
        resp.status(500).send();
    }
})

module.exports = router