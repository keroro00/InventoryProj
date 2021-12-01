let express = require('express');
let app = express();
let bp = require('body-parser');
var session = require('cookie-session');
var pageLocation = "";

//mongoDB
const ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
const http = require('http');
const url = require('url');

const mongourl = 'mongodb://Tony:123321@cluster0-shard-00-00.xuvcs.mongodb.net:27017,cluster0-shard-00-01.xuvcs.mongodb.net:27017,cluster0-shard-00-02.xuvcs.mongodb.net:27017/ProjectDatabase?ssl=true&replicaSet=atlas-20mjmm-shard-0&authSource=admin&retryWrites=true&w=majority';
const mongoose = require('mongoose');

//session
app.use(session({ name:'session',keys:['authenticated','username','password']}));

//users' database
const UserSchema = mongoose.Schema({
    UserID:{type: String, required: true},
    Password: {type:String}
  }
  );

//Inventory database
const InventorySchema = mongoose.Schema({
    inventory_ID:{type: String},
    name: {type:String, required: true},
    type: {type: String},
    quantity: {type:Number},
    photo: {type: String},
    photo_minetype: {type: String},
    inventory_address:[ {
      street: {type: String},
      building: {type: String},
      country: {type: String},
      zipcode: {type: String},
      coord: [{latitude:{type:Number},longitude:{type:Number}}]
    }],
    manager: {type:String, required: true}
  }
  );


const MatchUser = (req,res) => {
    var username = req.body.user_id;
    var password = req.body.user_pw;
    mongoose.connect(mongourl, {useMongoClient: true});
    const db = mongoose.connection;
    
    db.on('error', console.error.bind(console, 'connection error'));
    db.once('open', () => {
        const User = mongoose.model('User', UserSchema);
  
        const criteria = {UserID: username};
        User.find(criteria, (err, results) => {
            console.log(`# documents meeting the criteria ${JSON.stringify(criteria)}: ${results.length}`);
            for (var doc of results) {
                console.log(doc.UserID, doc.Password);
                req.session.authenticated=true;
                req.session.username=doc.UserID;
                req.session.password=doc.Password
                console.log(`# Now is ${req.session.username} and ${req.session.password} `);
            }
            res.redirect('/');
            db.close();
        })
    })
  }


  const InsertInventory = (body,res) => {
    var Inv_Name = body.Inv_Name;
    var Inv_Type = body.Inv_Type;
    var Inv_Quan = body.Inv_Quan;
    var Inv_Street = body.Inv_Street;
    var Inv_Build = body.Inv_Build;
    var Inv_Country = body.Inv_Country;
    var Inv_Zipcode = body.Inv_Zipcode;
    var Inv_Lat = body.Inv_Lat;
    var Inv_Lon = body.Inv_Lon;
    var Inv_Photo = body.Inv_Photo;
    var Inv_ID =0;
    mongoose.connect(mongourl, {useMongoClient: true});
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error'));
    db.once('open', () => {
        const Inventory = mongoose.model('Inventory', InventorySchema);
        Inventory.count({}, function(error, numOfDocs) {
            Inv_ID=numOfDocs;
        });
        // create a Inventory
        const pencil = new Inventory({
            inventory_ID:Inv_ID,
            name: Inv_Name,
            type: Inv_Type,
            quantity: Inv_Quan,
            photo: Inv_Photo,
            photo_minetype: "",
            inventory_address:[ {
              street: Inv_Street,
              building: Inv_Build,
              country: Inv_Country,
              zipcode: Inv_Zipcode,
              coord: [{latitude:Inv_Lat,longitude:Inv_Lon}]
            }],
            manager:"Tony"
          });
    
        pencil.save((err) => {
            if (err) throw err;
            console.log('Inventory created!');
            db.close();
            res.render('/home/developer/proj/database.ejs');
        })
    })
}

//
const ShowInv = (req,res) => {

    mongoose.connect(mongourl, {useMongoClient: true});
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error'));
    db.once('open', () => {
        const Inventory = mongoose.model('Inventory', InventorySchema);
  
        const criteria = {};
        Inventory.find(criteria, (err, results) => {
            console.log(`# documents meeting the criteria ${JSON.stringify(criteria)}: ${results.length}`);
            res.render('/home/developer/proj/database.ejs',{results:results});
            db.close();
        })
    })
  }

//bodyparser
app.set('view engine', 'ejs');
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

app.get('/',function(req,res){
    if(!req.session.authenticated){ 
        res.redirect('/login');
    }
    res.redirect('database');
});


app.get('/login', (req,res) => {
    res.render('/home/developer/proj/login.ejs');
    pageLocation="Login";
});

app.get('/database', (req,res) => {
    ShowInv(req,res);
});



app.get('/create', (req,res) => {
    res.render('/home/developer/proj/create.ejs');
    pageLocation="Create";
    InsertInventory(req.body,res);
    });

//read user id and pw
app.post('/login',(req,res)=>{
    MatchUser(req,res);
})

app.get('/logout',function(req,res){ req.session=null; res.redirect('/');});

const server = app.listen(process.env.PORT || 8099, () => {
const port = server.address().port;
console.log(`Server listening at port ${port}`);
})
