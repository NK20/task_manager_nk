const express = require('express')
require('./db/mongoosedb')
const mongoose = require('mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')
const Task = require('./model/task')

const app = express()

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

const port = process.env.PORT


app.listen(port,()=>{
    console.log('Server Started on port'+ port)
})
