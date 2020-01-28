const mongodb =require('mongodb')

const mongoClient = mongodb.MongoClient
const connectionURL = process.env.MONGODB_URL

mongoClient.connect(connectionURL,{ useNewUrlParser: true},(error,client)=>{
    if(error){
           return console.log('Unable to connect to database'+error)
    }
           
})


