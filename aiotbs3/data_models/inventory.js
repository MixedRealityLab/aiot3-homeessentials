var db = require("../db/db.js");
var schemas = require("./schemas.js");
var product = require("./products.js");
var user = require("./user.js");

var _ = require("lodash");


var Inventory = function (data) {
    //this.data = this.sanitize(data);
}

Inventory.getProductsForUser = function (userId) {
	if(userId == 1) {
		console.log('loading all product from userId == 1');
		// how do I know about date/timestamp, I need the last 5 products added to the inventory.

		// TODO: For each of the below, need to map invetory data to product data before returning
		return ({
				  "data": [
				  { inventory_id: 0,
				  	Description : "heinz",
				    stock_amount: 4,
				    stock_unit: "tins",
				    predicted_need_date : "27/08/2017"
				  },
				  { 
				  	inventory_id: 1,
				  	Description : "heinz 2",
				    stock_amount: 4,
				    stock_unit: "tins",
				    predicted_need_date : "27/09/2017"
				  },
				  { inventory_id: 2,
				  	Description : "heinz 3",
				    stock_amount: 4,
				    stock_unit: "tins",
				    predicted_need_date : "27/04/2017"
				  },
				  { inventory_id: 3,
				  	Description : "heinz 4",
				    stock_amount: 4,
				    stock_unit: "tins",
				    predicted_need_date : "27/07/2017"
				  }
				  ]
				});

	}
	else {
		return ({"status": "fail", "error code": 101, "error message": "user does not exist"});
	}
}

Inventory.getProductForInventoryId = function(inventory_id) {
	// search for inventory item
	// lookup  ean based on inventory item
	// return product information from ean
}

Inventory.getProductForUser = function (userId, EAN) {
	if(userId == 1 && EAN == "1234567890") {
		return({"status": "success", "data": {
		inventory_id: 0,
		EAN: '1234567890',
	    	stock_level: '4',
	    	stock_unit: 'tins'}});
	}
	else {
		return ({"status": "fail", "error code": 101, "error message": "inventory item does not exist"});
	}
}

Inventory.updateProductForUser = function (userId, EAN, new_stock_level) {
	if(userId == 1 && EAN == "1234567890") {
		return({"status": "success", "data": {
			EAN: '1234567890',
	    	updated_stock_level: '5',
	    	stock_unit: 'tins'}});
	}
	else {
		return ({"status": "fail", "error code": 101, "error_message": "inventory item product does not exist"});
	}
}

module.exports = Inventory;
