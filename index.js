const express = require('express');
const app = express();
const cors =  require('cors')
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require('dotenv').config()
console.log(process.env) 
//middleware 
app.use(cors());
app.use(express.json());
 // middlewares 
 const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization
 // console.log('inside verify token', authorization );
  if (!authorization) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rhxzu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const usersCollection = client.db("bistroDb").collection("users");
    const menuCollection = client.db("bistroDb").collection("menu");
    const reviewCollection = client.db("bistroDb").collection("reviews");
    const cartCollection = client.db("bistroDb").collection("carts");
    
    app.post('/jwt',(req,res)=>{
      const user = req.body;
      console.log('in jwt secret => ',process.env.ACCESS_TOKEN_SECRET)
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1h' });
      res.send({token})
    })

    // users related apis
    app.get('/users',async(req,res)=>{
       const result = await usersCollection.find().toArray();
       res.send(result);
    })
    app.post('/users',async(req,res)=>{
      const user = req.body;
      console.log(user);
      const query = {email:user.email};
      const existingUser = await usersCollection.findOne(query);
      // console.log('existing user',existingUser);
      if(existingUser){
        return res.send({message:'user already exists'});
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);

    });

    app.patch('/users/admin/:id',async(req,res)=>{
      const id=req.params.id;
      console.log('user admin id => ',id);
      const filter = {_id:new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };

      const result = await usersCollection.updateOne(filter,updateDoc);
      res.send(result);
      
    })
    
    //memu related apis
    app.get('/menu',async(req,res)=>{
        const result =await menuCollection.find().toArray();
        res.send(result);
    })

    // review related apis
    app.get('/reviews',async(req,res)=>{
        const result =await reviewCollection.find().toArray();
        res.send(result);
    })
    // cart collecttion apis
    app.get('/carts',verifyJWT,async(req,res)=>{
      const email=req.query.email;
      //  console.log(email);
      if(!email){
        res.send([]);
      }
      
      const decodedEmail =req.decoded.email;
     //  console.log('email checking ',email,decodedEmail);
      if(email !== decodedEmail){
         return res.status(403).send({ message: 'forbidden access' })
      }
      const query = {email:email};
      const result = await cartCollection.find(query).toArray();
      res.send(result)

    });
    app.post('/carts',async(req,res)=>{
      const item = req.body;
      // console.log(item);
      const result = await cartCollection.insertOne(item);
      res.send(result);
    })
    
   // delete
    app.delete('/carts/:id',async(req,res)=>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/',(req,res)=>{
    res.send('boss is sitting')
})
app.listen(port,()=>{
    console.log(`bistro boss sitting on port ${port}`)
})


/** 
 * -------------------
 * naming convention
 * -------------------
 * users:userCoolection
 * app.get('users')
 * app.get('/users/:id')
 * app.post('/users') // add
 * app.patch('/users/:id') only update
 * app.put('users/:id') // create and update if already have only update
 * app.delete('users/:id')
*/