if(process.env.NODE_ENV!="production"){
    require('dotenv').config();
}

console.log(process.env.SECRET);

const express=require("express");
const app =express();
const mongoose=require("mongoose");
// const Listing=require("./models/listing.js");
const path =require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
// const wrapAsync=require("./utils/WrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
// const {listingSchema, reviewSchema}=require("./schema.js");   
// const review=require("./models/review.js");  

const listingRouter =require("./routes/listing.js")
const reviewRouter=require("./routes/review.js");
const session=require("express-session");
//mongo connect 
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js")

const userRouter=require("./routes/user.js");


const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";

// const dburl=process.env.ATLASDB_URL;
const dbUrl=process.env.ATLASDB_URL;

main().then(()=>{
    console.log("connected to DB");
    
}).catch(err=>{
    console.log(err);
    
})
// async function main(){
//     await mongoose.connect(MONGO_URL);
// }
async function main(){
    await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extented:true}));
app.use(methodOverride("_method")); 
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));



const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto: {
        secret: process.env.SECRET
      } ,
    touchAfter:24 * 3600
});

store.on("error",()=>{
    console.log("error in mongosesionStore",err);
    
});

const sessionOptions= {
    store,
    secret: process.env.SECRET,
    resave:false,
    saveUninitialized:true,
cookie:{
    expires:Date.now()+7*24*60*60*1000,
    maxAge:7*24*60*60*1000,
        httpOnly:true
}};


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//fisrt into page
// app.get("/",(req,res)=>{
//     res.send("hiii , here is your trvael agent")
// })


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    console.log(res.locals.success);
    res.locals.currUser=req.user;
    next();
});

// app.get("/demoUser",async (req,res)=>{
//     let fakeUser=new User ({
//         email:"student@gmail.com",
//         username:"delta-student"
//     });
//    let registeredUser=  await User.register(fakeUser,"helloworld");
//    res.send(registeredUser);        
// })

app.use("/listings",listingRouter)
app.use("/listings/:id/reviews",reviewRouter)
app.use("/",userRouter);

// 
// app.get("/api",(req,res)=>{
//     res.send("data");
// })



// app.get("/testListing",async(req,res)=>{

//     let samplelisting=new Listing({
//         title:"my new beach ",
//         description:"by the beach lane",
//         price:1200,
//         location :"kerla",
//         country:"india",
//     });

//    await samplelisting.save();
//    console.log("sample was saved ");
//    res.send("sucessful testing");
   

// })
app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"page not found!"));
});


app.use((err,req,res ,next)=>{
    let {statusCode=500,message="Something went wrong"}=err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs",{message});
})

app.listen(8080,()=>{
    console.log("server is started listening to 8080");
    
});