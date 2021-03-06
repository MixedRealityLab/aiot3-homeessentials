var express = require('express');
var router = express.Router();
var request = require('request');
var sleep = require('sleep');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var session = require('express-session');



var Product = require('../data_models/products');
var Inventory = require('../data_models/inventory');
var InEvent = require('../data_models/in_events');
var OutEvent = require('../data_models/out_events');
var User = require('../data_models/user');

//**********************************************************************************************************************
router.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
    //cookie: { secure: true }
}));

router.use(passport.initialize());
router.use(passport.session());

// Configure the local strategy for use by Passport.
passport.use(new Strategy(
    function(username, password, cb) {
        User.findByUsername(username, function(err, user) {
            if (err) { return cb(err); }
            if (!user) { return cb(null, false); }
            if (user.password != password) { return cb(null, false); }
            return cb(null, user);
        });
    }));


passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    User.findById(id, function (err, user) {
        if (err) { return cb(err); }
        cb(null, user);
    });
});


//**********************************************************************************************************************


/* GET home page. */
router.get('/', function(req, res, next){ // this authentication fail :(
//router.get('/' ,function(req, res, next) {
    console.log(req.user);
    console.log(req.isAuthenticated());
    res.render('index',{ user: req.user });
    //res.render('index', { username: req.body.username, session: req.session.success, errors: req.session.errors, messageItem : 0 });
    //res.render('index', { username: req.body.username, session: 'success', errors: req.session.errors, messageItem : 0 });

    //req.session.errors = null;
});



/*  PRODUCTS  */

//after scan, check if the basic data of a product is on db
router.post('/checkBarcode', function (req,res, next) {
    var userId=req.user.id;
    sleep.msleep(5000);
    var codeProduct = req.body.codeProduct; //barcode from client side
    var eanCodeProducts = Product.getProductByEan(codeProduct);
    var userInventory = getInventoryUser(userId); //get all products from user=1 and send them back to inserted products

    if(eanCodeProducts.status == 'success'){ //if barcode is in product db
        var eanCode = eanCodeProducts.data.EAN;

        //****** update inventory using  Inventory.updateInventoryListingStock and In_event.add_event ******************
        //update the inventory stock(I don't need to update product data)
        var userInventoryUpdated =updateInventory2(userId,eanCode);
        console.log('userInventoryUpdated:'+ userInventoryUpdated.status);
        //**************************************************************************************************************

        if (userInventoryUpdated.status == 'success') {
            var description = eanCodeProducts.data.description;
            res.render('insertProduct', {messageItem: 3, description: description, userInventory: userInventory, user: req.user});
        }
        else{
            res.render('insertProduct', {messageItem: 3, description: 'something wrong', userInventory: userInventory, user: req.user});
        }
    }
    else { //the barcode isn't the product database

        connectTesco(codeProduct, function(response){  //look at tesco API
            // Here you have access to your variable
            var tescoApiData =  response;
            //console.log(tescoApiData.status);
            //console.log(tescoApiData.data.description);
            console.log('TESCO DATA:'+tescoApiData);


            if (tescoApiData.status == 'success'){
                // add data to the product db
                var addNewProduct = Product.addNewProduct(codeProduct, tescoApiData.data);
                if(addNewProduct.status == 'success'){ // if product was succesfully added to the global db then upgrade inventory

                    //****** update inventory **************************************************************************
                    // add the product to the user inventory
                    var userInventoryUpdated = updateInventory2(userId,codeProduct);
                    console.log('***check***'+userInventoryUpdated.status + ':'+userInventoryUpdated.msg);
                    //**************************************************************************************************


                    if(userInventoryUpdated.status == 'success'){
                        // render to add item view
                        var description = tescoApiData.data.description.substring(0,25);
                        // then render view /insertProduct view with messageItem : 3
                        res.render('insertProduct',{messageItem : 3, description: description, userInventory: userInventory, user: req.user});

                    }
                    else{
                        var description = tescoApiData.data.description.substring(0,25);
                        res.render('insertProduct',{messageItem : 3, description: description+ '' + '' +userInventoryUpdated.msg, userInventory: userInventory, user: req.user});

                    }


                }
                else{
                    res.render('insertProduct',{messageItem : 3, description: addNewProduct.error_message, userInventory: userInventory, user: req.user});

                    //res.render('error',{errorMessage:addNewProduct.error_message});
                }

            }

            else{ //the barcode isn't in tesco api
                //ask user for basic data using item_data view
                //item_data view will submit to /insertProduct
                res.render('checkBarcode',{messageItem : 2, eancode: codeProduct, userInventory: userInventory, user: req.user});


            }
        });
    }

});

//**************************************************************************************************
function updateInventory2(userId,eanCode){ //add item-using scan In
    console.log('user Id:'+ userId);
    console.log('ean:'+eanCode);

    var inventoryList = Inventory.getInventoryListing(userId,eanCode); // get inventory listing
    console.log('***inventory listing:***'+ inventoryList.status);

        if (inventoryList.status=='success') // there is an inventory listing known
        {
            var inventoryId =  inventoryList.data.inventory_id;    //get inventory id
            var getStockLevel = inventoryList.data.stock_level;    //get actual stock level
            var newStockLevel = getStockLevel + 1;                 //create new stock level
            var updateInventoryListing = Inventory.updateInventoryListingStock(inventoryId,newStockLevel); //update inventory listing
            var addToInventory = InEvent.add_event(inventoryId,getStockLevel,newStockLevel); //add to inventory
            console.log('**addToInventory**'+addToInventory.status);

            if (updateInventoryListing.status == 'success' && addToInventory.status == 'success')
            {
                return ({"status": "success"});

            }
            else
            {
                return ({"status": "fail", "msg":addToInventory.error_message});

            }

        }
        else
        {
            //else if the product exists but there is no inventory listing for it
            var newInventoryList = Inventory.addNewInventoryListing(userId,eanCode);

            if (newInventoryList.status == 'success')
            {
                var inventoryId = newInventoryList.data.inventory_id;
                var getStockLevel = 0;    //get actual stock level
                var newStockLevel = newInventoryList.data.stock_level;
                var updateInventoryListing = Inventory.updateInventoryListingStock(inventoryId,newStockLevel); //update inventory listing
                var addToInventory = InEvent.add_event(inventoryId,getStockLevel,newStockLevel); //add to inventory
                if (updateInventoryListing.status == 'success' && addToInventory.status == 'success')
                {
                    return ({"status": "success"})
                }
                else
                {
                    return ({"status": "fail", "msg":addToInventory.error_message});
                }
            }
            else
            {
                return ({"status": "fail", "msg":newInventoryList.error_message});

            }


        }
}
//**************************************************************************************************

//checkbarcode logic (just for scan in process)
//get barcode
//if the barcode is in the product/global db
    //if there is inventory listing known
        //get inventory_id from Inventory.getInventoryListing
        //get old and new stock level
        //add the product to the user inventory listing
        //use In_event.add_event to update the inventory(+1) (stock level)
        //render to add item view
    //else if the product exists but there is no inventory listing for it
        //make an inventory list Inventory.addNewInventoryListing using barcode and userId
        //get the inventory id
        //get old and new stock level
        //update the stock level using Inventory.updateInventoryListingStock
        //use In_event.add_event to update the inventory(+1) (stock level)
        //render to add item view

//else (the barcode isn't the product database/ the product does not exist at all)
    //if the barcode is in tesco api?
        //get data from tesco api
        //Use Product.addNewProduct to add the product to the global database
        //make an inventory list Inventory.addNewInventoryListing using barcode and userId
        //get the inventory id
        //get old and new stock level
        //update the stock level using Inventory.updateInventoryListingStock
        //use In_event.add_event to update the inventory(+1) (stock level)
        //render to add item view
    //else (the barcode isn't in tesco api)
        //render to checkBarcode view
        //ask user for basic data
        //Use Product.addNewProduct to add the product to the global database
        //make an inventory list Inventory.addNewInventoryListing using barcode and userId
        //get the inventory id
        //get old and new stock level
        //update the stock level using Inventory.updateInventoryListingStock
        //use In_event.add_event to update the inventory(+1) (stock level)
        //render added item view





//insert in the inventory and render to item added view
router.post('/insertProduct', function (req,res,next) {
    var userId = req.user.id;
    //Post unknown item details to global product database
    var eanCode = req.body.productEan; // scanned barcode
    var addNewProduct = Product.addNewProduct(req.body.productEan,req.body);
    var description = req.body.productDescription;
    console.log(addNewProduct.status); //we will add into the global? inventory or both?
    console.log(addNewProduct.message);

    //get last 5 products from user=1 and send them back to render view of inserted products
    var userInventory = getInventoryUser(userId);

    if(addNewProduct.status){

        //After add new product to db, update inventory
        //****** update inventory **************************************************************************
            var userInventoryUpdated = updateInventory2(userId,eanCode);
            console.log('***check***'+userInventoryUpdated.status + ':'+userInventoryUpdated.msg);

        //**************************************************************************************************
        if(userInventoryUpdated.status == 'success'){
            res.render('insertProduct',{messageItem : 3, description: description, userInventory: userInventory, user: req.user});

        }
        else{
            res.render('insertProduct',{messageItem : 3, description: userInventoryUpdated.msg, userInventory: userInventory, user: req.user});

        }

    }
    else{
        console.log('error'); // redirecting to added item view with error message
        res.render('insertProduct',{messageItem : 3, description: addNewProduct.error_message, userInventory: userInventory, user: req.user});

    }
});


//**** scan out logic *******
//get barcode from scanout view
//if barcode is on user inventory
    //get stock level and products details from user inventory
    //ask about stock level to confirm
    //Ask user if item was “used up or wasted” - where store in the model?
    //Confirm item details and new inventory stock level
    // (inventory means the households local listing of items)
    //update stock_level (-1)
    //then render scannedOutProduct view
//else if barcode isn't on user inventory
    //do something
    //render to scannedOutProduct with message 1


//scan out logic 2
//if barcode is on user inventory and have description
    //get stock level and products details from user inventory
    //ask about stock level to confirm
    //Ask user if item was “used up or wasted” - where store in the model?
    //Confirm item details and new inventory stock level
    // (inventory means the households local listing of items)
    //update stock_level (-1)
    //then render scannedOutProduct view
// else if barcode is on user inventory but it doesn't have description
    // get barcode
    // prompt user to “add product details now”
    ///Ask user if item was “used up or wasted” - where store in the model?
    //Confirm item details and new inventory stock level
    // (inventory means the households local listing of items)
    //update stock_level (-1)
    //then render scannedOutProduct view
//else if barcode isn't on user inventory
    //get barcode
    //prompt user to add as "scanned in product"
    //back end: add this product as scanned in
    //Prompt user to “use up/wasted” product
    //Go back to “ready to scan out” view with table of scanned out products
    //render to scannedOutProduct with message 1





router.post('/scanOutProduct',function (req,res,next) {
    console.log('user id scanout****:'+ req.user.id);

    var userId=req.user.id;
    sleep.msleep(4000); //this is for show the barcode scanned
    console.log(req.body);
    var wasted = req.body.wastedProductOut;
    var codeProduct = req.body.codeProductOut; //barcode from client side
    var eanCodeProducts = Product.getProductByEan(codeProduct);
    var descriptionOut='not found';
    if (eanCodeProducts.status == 'success'){
        var descriptionOut = eanCodeProducts.data.description;

    }

    var userInventoryOut = updateInventoryOut(userId,codeProduct,wasted);
    var lastUserInventoryOut = getOutInventoryUser(userId);
    console.log('**inventory out***'+lastUserInventoryOut[0].description);

    if (userInventoryOut.status == 'success'){ //if barcode is on user inventory

        //res.render('scannedOutProduct',{messageScanOut:0, eanProduct:codeProduct});
        res.render('scannedOutProduct',{messageScanOut:0,descriptionOut:descriptionOut, lastUserInventoryOut:lastUserInventoryOut, user: req.user});
    }else{//barcode isn't on user inventory

        res.render('scannedOutProduct',{messageScanOut:1,descriptionOut:userInventoryOut.msg, lastUserInventoryOut:lastUserInventoryOut, user: req.user});

    }




    console.log('scanning out code:'+ codeProduct);

});



//********************************************* OUT OF INVENTORY *******************************************************
function updateInventoryOut(userId,eanCode,wasted){ //add item-using scan In
    console.log('user Id:'+ userId);
    console.log('ean:'+eanCode);
    console.log('wasted:'+wasted);


    var inventoryList = Inventory.getInventoryListing(userId,eanCode); // get inventory listing
    console.log('***inventory listing:***'+ inventoryList.status);

    if (inventoryList.status=='success') // there is an inventory listing known
    {
        var inventoryId =  inventoryList.data.inventory_id;    //get inventory id
        var getStockLevel = inventoryList.data.stock_level;    //get actual stock level
        var newStockLevel = getStockLevel - 1;                 //decrease actual stock level
        var updateInventoryListing = Inventory.updateInventoryListingStock(inventoryId,newStockLevel); //update inventory listing
        var outOfInventory = OutEvent.add_event(inventoryId,getStockLevel,newStockLevel,wasted); //add Out to inventory
        console.log('**Out of Inventory**'+outOfInventory.status);

        if (updateInventoryListing.status == 'success' && outOfInventory.status == 'success')
        {
            return ({"status": "success"});

        }
        else
        {
            return ({"status": "fail", "msg":outOfInventory.error_message});

        }

    }
    else
    {
        return ({"status": "fail", "msg":inventoryList.error_message});
        /*
        //else if the product exists but there is no inventory listing for it
        var newInventoryList = Inventory.addNewInventoryListing(userId,eanCode);

        if (newInventoryList.status == 'success')
        {
            var inventoryId = newInventoryList.data.inventory_id;
            var getStockLevel = 0;    //get actual stock level
            var newStockLevel = newInventoryList.data.stock_level;
            var updateInventoryListing = Inventory.updateInventoryListingStock(inventoryId,newStockLevel); //update inventory listing
            var outOfInventory = OutEvent.add_event(inventoryId,getStockLevel,newStockLevel); //add to inventory
            if (updateInventoryListing.status == 'success' && outOfInventory.status == 'success')
            {
                return ({"status": "success"})
            }
            else
            {
                return ({"status": "fail", "msg":outOfInventory.error_message});
            }
        }
        else
        {
            return ({"status": "fail", "msg":newInventoryList.error_message});

        }
        */

    }
}
//**************************************************************************************************




router.post('/getInventoryData',function (req,res,next) {
    console.log(req.body);
    var userId=req.body.userId;
    var data = Inventory.getProductsForUser(userId);

    // HERE I NEED TO USER Inventory.getProductFromInventoryId method
    // get inventory id
    //with inventory id get ean
    //with ean get product details
    //add to data
    console.log(data);
    console.log('request by dataTable ajax');
    res.json(data);

});


router.post('/getInventoryDataOut',function (req,res,next) {
    var userId = req.body.userId;
    //var data = {description: "xxx", lastAdded: "07/07/27", usedUp: "16/08/17"};

    var data = OutEvent.get_most_recent_for_user(userId,5);
    console.log(data);
    res.json(data);


});

router.post('/scanInAgain', function (req,res,next) {
    var userId = req.body.userId;
    //this is just for render again scan in process
    console.log('ready to scan in again');
    console.log('get data from user and send it back')
    //GET LAST 5 ITEMS AND SEND BACK TO INSERTPRODUCT VIEW
    var userInventory = getInventoryUser(userId);

    var data = {messageItem:4};
    res.send({messageItem:4, userInventory:userInventory});
    //res.send(userInventory);

});


router.post('/scanOutAgain', function(req,res,next){
    var userId =  req.body.userId;
    console.log('ready to scan out again');
    //GET LAST 5 ITEMS AND SEND BACK TO ****** VIEW
    var userInventoryOut = getOutInventoryUser(userId);
    res.send({messageItem:5, userInventoryOut:userInventoryOut});

});



router.post('/editProduct',function(req,res,next){

    var inventoryId = req.body.inventoryId;

    var newStockLevel = req.body.newStockLevel;
    var inventoryUpdate =  Inventory.updateInventoryListingStock(inventoryId,newStockLevel);

    if (inventoryUpdate.status == 'success'){
        //send to front data
        console.log('inventoryID:'+inventoryId);
        console.log(newStockLevel);
        var data = {data:newStockLevel, msg:inventoryUpdate.status}
        res.json(data);
    }
    else{
        console.log('inventoryID:'+inventoryId);
        var data = {data:newStockLevel, msg:inventoryUpdate.error_message}
        res.json(data);

    }

});


router.post('/stopTrack',function(req,res,next){
    var inventoryId = req.body.inventoryId;
    var stopTrack = Inventory.stopTracking(inventoryId);

    if (stopTrack.status =='success'){
        var data = {msg:stopTrack.status}
        res.json(data);

    }
    else{
        var data = {msg:stopTrack.error_message}
        res.json(data);

    }

});

router.post('/bin',function(req,res,next){
    var data = req.body;
    console.log(data);
    res.json(data);

});




//************************************ functions *************************************************

//function to get inventory listing if exists for user
function getInventoryUser(user){
    var lastInventory = InEvent.get_most_recent_for_user(user,5);
    lastInventory = lastInventory["data"];
    console.log('***last inventory:'+ lastInventory);
    return lastInventory;
}


function getOutInventoryUser(user){
    var lastInventoryOut = OutEvent.get_most_recent_for_user(user,5);
    lastInventoryOut = lastInventoryOut["data"];
    console.log('***last inventory out:'+ lastInventoryOut);
    return lastInventoryOut;
}



//function to connect and consume TESCO API.
function connectTesco(eanSelected,callback){

    eanSelected1 = '0'+ eanSelected;
    var options = {
        method: 'GET',
        hostname: 'dev.tescolabs.com',
        //url: 'https://dev.tescolabs.com/product/?gtin=04548736003446', //05022996000135',
        url: 'https://dev.tescolabs.com/product/?gtin='+eanSelected1, //05022996000135',
        headers: {
            'Ocp-Apim-Subscription-Key': 'd00f3cbe704e4aec8aa8fb91b94d43f0'
        },
        rejectUnauthorized: false
    };

    request(options, function (error, response, body) {
        if (!error) {
            console.log('*statusCode:', response && response.statusCode); // Print the response status code if a response was received
            //var productsTesco = JSON.parse(body);
            var productsTesco = body;
            //console.log('** product details:**'+productsTesco);

            if (Object.keys(productsTesco).length==22) { // if I don't get information from tesco API

                var returnData= {"status": 'fail', "msg":'no internet connection'};
                return callback(returnData);

            }else{

                //console.log(body);
                var returnData = JSON.parse(body);
                //console.log('just return***'+returnData);
                //console.log('just data:***'+returnData["products"][0]["description"]);
                //console.log('quantity:***'+returnData["products"][0]["qtyContents"].quantity);

                var dataCollection = {
                        "status": 'success',
                        "data": {
                            ean: eanSelected,
                            tpnb:returnData["products"][0]["tpnb"],
                            tpnc:returnData["products"][0]["tpnc"],
                            brand_name:returnData["products"][0]["brand"],
                            description:returnData["products"][0]["description"],
                            quantity: returnData["products"][0]["qtyContents"].quantity,
                            quanitiy_unit: returnData["products"][0]["qtyContents"].quantityUom,
                            netContent: returnData["products"][0]["qtyContents"].netContents
                            }


                    };

               return callback(dataCollection);


            }


        }else{
            console.log('error:', error);
            console.log('statusCode:', response && response.statusCode);
            var returnData= {"status": 'api fail', "msg":'no internet connection'};
            return callback(returnData);

        }


    });

}


//*************************************** LOGIN AND REGISTER  **********************************************************
// move to own files

router.get('/login',
    function(req, res){
        res.render('login');
    });

router.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function(req, res) {
        console.log('Im here login');
        console.log(req.body);
        res.redirect('/');
        //res.render('index',{ user: req.user });

    });

router.get('/logout',
    function(req, res){
        req.logout();
        res.redirect('/login');
    });


router.get('/profile',
    require('connect-ensure-login').ensureLoggedIn(),
    function(req, res){
        res.render('profile', { user: req.user });
    });



router.get('/register', function(req, res,next){
    res.render('register');
});

// Register User
router.post('/register', function(req, res, next) {

    var username = req.body.username;
    var password = req.body.password;

    console.log('event: try to register');

    req.check('username', 'Username is required').notEmpty();
    req.check('password', 'Password is invalid').isLength({min: 4}).equals(req.body.password2);

    var registerEvent = User.createNew(username, password);

    if (registerEvent.status == 'success') {
        //req.session.success = true;
        res.redirect('/login');
    }
    else {
        console.log('fail:' + registerEvent.error);
        res.redirect('/register');
    }

});


//*********************************************************************************************************************





module.exports = router;
