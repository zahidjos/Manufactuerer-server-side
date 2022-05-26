 const express=require('express')
 const cors=require('cors');
 const app=express();
 const jwt = require('jsonwebtoken');
 require('dotenv').config();
 const stripe = require("stripe")('sk_test_51L3UeFGM6w2wMAOdTLAhx4EJBbNk2hXxdboxgOiG8xpWInXZKAdOwBlMl5eouNRshcTsXLdGPkQAFiOSOdGCy7Ks00hfMmQJqt')
 const port=process.env.PORT||5000;
 app.use(cors());
 app.use(express.json());

 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.vgphl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req,res,next){
const authHeader=req.headers.authorization;
if(!authHeader){
  return res.status(401).send({message:"un Authorization"})
}
const token=authHeader.split(' ')[1];
jwt.verify(token, process.env.JWT_KEY, function(err, decoded) {
 if(err){
   return res.status(403).send({message:"Forbidden Access"})
 }
 req.decoded=decoded;
 next();
});

}


async function run() {
    try {
      await client.connect();
      
      const collection = client.db("products").collection("items");
      const orderCollection=client.db("products").collection("order");
      const reviewCollection=client.db("products").collection("review");
      const userCollection=client.db("products").collection("user");
      const profileCollection=client.db("products").collection("profile");
      // Query for a movie that has the title 'The Room'
      // item part
      app.get('/items',async(req,res)=>{
        const query = {};
        const cursor = collection.find(query);
        const service= await cursor.toArray();
        res.send(service);
      })

      app.post('/items',async(req,res)=>{
        const product=req.body;
        const result=await collection.insertOne(product);
        res.send(result);
      })
      app.delete('/items/:id',async(req,res)=>{
        const id=req.params.id;
        const query = {_id:ObjectId(id)};
        const service=await collection.deleteOne(query);
        res.send(service);
   })

      

      app.get('/purchase/:id',async(req,res)=>{
           const id=req.params.id;
           const query = {_id:ObjectId(id)};
           const service=await collection.findOne(query);
           res.send(service);
      })

// order section
      app.post('/order',async(req,res)=>{
        const productOrder=req.body;
        const result=await orderCollection.insertOne(productOrder);
        res.send(result);
      })
      app.get('/order',async(req,res)=>{
        const email=req.query.email;
        const query={userEmail:email};
        const cursor= orderCollection.find(query);
        const service=await cursor.toArray();
        res.send(service);
})
       app.delete('/order/:id',async(req,res)=>{
        const id=req.params.id;
        const query = {_id:ObjectId(id)};
        const service=await orderCollection.deleteOne(query);
        res.send(service);
   })
   


   app.get('/orders/:id',async(req,res)=>{
    const id=req.params.id;
    const query = {_id:ObjectId(id)};
    const service=await orderCollection.findOne(query);
    res.send(service);
})

app.patch('/order/:id',async(req,res)=>{
  const id=req.params.id;
  const query = {_id:ObjectId(id)};
  const paymentId=req.body;
  console.log(paymentId)
  const updateDoc = {
    $set:paymentId
  };

  const service=await orderCollection.updateOne(query,updateDoc);
  res.send(service);
})


   app.get('/mangeOrder',verifyJWT,async(req,res)=>{
    
    const query={};
    const cursor= orderCollection.find(query);
    const service=await cursor.toArray();
    res.send(service);
   })

  //  Review section

   app.post('/review',async(req,res)=>{
    const productOrder=req.body;
    const result=await reviewCollection.insertOne(productOrder);
    res.send(result);
  })

  app.get('/review',async(req,res)=>{
    const query = {};
    const cursor = reviewCollection.find(query);
    const service= await cursor.toArray();
    res.send(service);
  })

  // make user part

  app.put('/users/:email',async(req,res)=>{
    const email=req.params.email;
    const query = {email:email};
    const userEmail=req.body;
    const options = { upsert: true };
    const updateDoc = {
      $set: userEmail
    };
    const result = await userCollection.updateOne(query, updateDoc, options);
    var token = jwt.sign({ foo: 'bar' },process.env.JWT_KEY,{ expiresIn: '11h' });
    res.send({result,token});
  })

  app.get('/users',verifyJWT,async(req,res)=>{
    const query = {};
    const cursor = userCollection.find(query);
    const service= await cursor.toArray();
    res.send(service);
  })
  
  app.put('/admin/:email',async(req,res)=>{
    const email=req.params.email;
    const query = {email:email};
    const userEmail=req.body;
    
    const updateDoc = {
      $set: userEmail
    };
    const result = await userCollection.updateOne(query, updateDoc);
    
    res.send(result);
  })

  app.get('/users/:email',async(req,res)=>{
    const email=req.params.email;
    const query = {email:email};
    const service = await userCollection.findOne(query);
    res.send(service);
  })

  // payment intend part hi
  app.post("/create-payment-intent", async (req, res) => {
    const service = req.body;
    const price= service.price;
    const amount=price*100;
      console.log(amount);

     const paymentIntent = await stripe.paymentIntents.create({
      amount:amount,
      currency: "usd",
      payment_method_types: [
        "card"
      ]
    });
  
    res.send({ clientSecret: paymentIntent.client_secret});
  });


  // profile part
  app.put('/profile/:email',async(req,res)=>{
    const email=req.params.email;
    const query = {email:email};
    const userEmail=req.body;
    const options = { upsert: true };
    const updateDoc = {
      $set: userEmail
    };
    const result = await profileCollection.updateOne(query, updateDoc, options);
    
    res.send(result);
  })
   
  app.get('/profile/:email',async(req,res)=>{
    const email=req.params.email;
    const query = {email:email};
    const service = await profileCollection.findOne(query);
    res.send(service);
  })



   } finally {
     
    }
  }

  run().catch(console.dir);

 
 app.listen(port,()=>{
     console.log("my server",port);
 })