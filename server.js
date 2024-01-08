//Requiring stuff
const http = require('http');
const fs = require("fs");
const pug = require('pug');

//Setting a function for my pug file
const renderStats = pug.compileFile("vendorStats.pug");

//Declaring various necessary arrays and objects
let vendors = {};
let vendorNames = [];
let selected = "";

//These are all for vendor stats page
let allOrders = {};
let allOrderPrices = {};
let avgOrderTotals = {};
let mostPopItemNames = {};
let totalOrdersRecieved = {}
let vendorData = {};






//reading in all json files in vendors directory
fs.readdir("./vendors", (err, files)=> { 
	if (err)
	  console.log(err);
	else {
	  files.forEach(file => {
		fs.readFile(`${process.cwd()}/vendors/${file}`, function(err, data){
			if(err){
				console.log(err);
			}
			
			else{
				let a = JSON.parse(data.toString());
				
				vendors[a.name] = a;
				allOrders[a.name] = [];
				allOrderPrices[a.name] = [];
				avgOrderTotals[a.name] = 0;
				mostPopItemNames[a.name] = "";
				totalOrdersRecieved[a.name] = 0;
				vendorData[a.name] = [];

				
				
			}
		});
	  });
	}



	//Starting server
	const server = http.createServer(function (request, response) {


		//if GET
		if(request.method === "GET"){
			//Getting homepage
			if(request.url === "/"){
				fs.readFile("homepage.html", function(err, data){
					if(err){
						response.statusCode = 500;
						response.write("Server error.");
						response.end();
						return;
					}
					response.statusCode = 200;
					response.setHeader("Content-Type", "text/html");
					response.write(data);
					response.end();
				});
			}
			//Getting order form
			else if(request.url === "/orderform.html"){
				fs.readFile("orderform.html", function(err, data){
					if(err){
						response.statusCode = 500;
						response.write("Server error.");
						response.end();
						return;
					}
					response.statusCode = 200;
					response.setHeader("Content-Type", "text/html");
					response.write(data);
					response.end();
				});
			//Getting client js file
			}else if(request.url === "/client.js"){
				fs.readFile("client.js", function(err, data){
					if(err){
						response.statusCode = 500;
						response.write("Server error.");
						response.end();
						return;
					}
					response.statusCode = 200;
					response.setHeader("Content-Type", "application/javascript");
					response.write(data);
					response.end();
				});
	
				

			}
	
			//Getting css file
			else if(request.url === "/styles.css"){
				fs.readFile("styles.css", function(err, data){
					if(err){
						response.statusCode = 500;
						response.write("Server error.");
						response.end();
						return;
					}
					response.statusCode = 200;
					response.setHeader("Content-Type", "text/css");
					response.write(data);
					response.end();
				});
			}
			//getting add picture
			else if(request.url === "/add.png"){
				fs.readFile("add.png", function(err, data){
					if(err){
						response.statusCode = 500;
						response.write("Server error.");
						response.end();
						return;
					}
					response.statusCode = 200;
					response.setHeader("Content-Type", "image/png");
					response.write(data);
					response.end();
				});	
			}
			//getting remove picture
			else if(request.url === "/remove.png"){
				fs.readFile("remove.png", function(err, data){
					if(err){
						response.statusCode = 500;
						response.write("Server error.");
						response.end();
						return;
					}
					response.statusCode = 200;
					response.setHeader("Content-Type", "image/png");
					response.write(data);
					response.end();
				});	
			}
			//Getting my vendor names
			else if(request.url === "/myVendorNames"){
				vendorNames = [];
				response.setHeader("Content-Type", "application/json");
				Object.keys(vendors).forEach(elem => {
					vendorNames.push(elem);
				});
				response.write(JSON.stringify(vendorNames));
				response.statusCode = 200;
				response.end();
			}

			//Going to pug file with info
			else if(request.url === "/vendorStats.html"){
				vendorData = {};
				vendorNames.forEach(elem =>{
					vendorData[elem] = [];
				});
				vendorNames.forEach(elem =>{
					vendorData[elem].push("Total number of orders:");
					vendorData[elem].push(getNumOrders(elem));

					vendorData[elem].push("Average price per order:");
					vendorData[elem].push(getAvgOrderPrice(elem));

					vendorData[elem].push("Most popular item:");
					vendorData[elem].push(getMostPopItem(elem));
				});


				let data = renderStats({vendorData:vendorData});
				response.setHeader("Content-Type", "text/html");
				response.statusCode = 200;
				response.end(data);
			}
			
			else{
				response.statusCode = 404;
				response.write("Unknwn resource.");
				response.end();
			}
		//If POST
		}else if(request.method === "POST"){
	
			//Getting the asked for vendor
			if(request.url === "/myVendor"){
				
				request.on("data", (chunk) => {
					selected = "";
					selected = chunk.toString();
					
					response.setHeader("Content-Type", "application/json");
					response.write(JSON.stringify(vendors[selected]));
					response.statusCode = 200;
					response.end();
					
				});
				

			}

			//Submitting an order
			else if(request.url === "/submit"){
				
				request.on("data", (chunk) => {
					let currentVendor = vendors[selected];

					let order = JSON.parse(chunk.toString());
				
					allOrders[currentVendor.name].push(order);

					let orderPrice = 0;
					
					
					Object.keys(order).forEach(elem => {
						let categories = Object.keys(vendors[selected].supplies);
						
						let id = elem;
						for (let i = 0; i < categories.length; i++) {
							if (currentVendor.supplies[categories[i]].hasOwnProperty(id)) {
								currentVendor.supplies[categories[i]][id].stock = currentVendor.supplies[categories[i]][id].stock - order[elem];

								orderPrice += order[elem] * currentVendor.supplies[categories[i]][id].price;
								orderPrice = orderPrice *1.1;
								orderPrice += currentVendor.delivery_fee;
							}
						}
					});

					allOrderPrices[currentVendor.name].push(orderPrice);

					
					response.statusCode = 200;
					response.end();
					
				});
				

			}
			else{
				response.statusCode = 404;
				response.write("Unknwn resource.");
				response.end();
			}
	
		}
	
		//Putting in a new item
		else if(request.method === "PUT"){

			if(request.url === "/newItem"){
				request.on("data", (chunk) => {
					let newItem = JSON.parse(chunk.toString());
					let thisCategory = newItem.category;
					delete newItem.category;

					let categories = Object.keys(vendors[selected].supplies);
					let currentVendor = vendors[selected];

					let counter = 0;
					let rightIndex;
					let rightCategory;

					
					let newSupplies = {};

					for (let i = 0; i < categories.length; i++) {
						
						if (categories[i] === thisCategory) {
							rightIndex = Object.keys(currentVendor.supplies[categories[i]]).length + counter;
							rightCategory = categories[i];


						}

						for(let j = 0; j < Object.keys(currentVendor.supplies[categories[i]]).length; j++){
							counter++;

						}
					}

					for(let j = 0; j < categories.length; j++){
						newSupplies[categories[j]] = {};
						Object.keys(currentVendor.supplies[categories[j]]).forEach(key => {
							if(key < rightIndex){
								newSupplies[categories[j]][key] = currentVendor.supplies[categories[j]][key];
							}
							else{
								let newKey = key-1+2;
								newSupplies[categories[j]][newKey] = currentVendor.supplies[categories[j]][key];
							}
						});
						
					}
					newSupplies[rightCategory][rightIndex] = newItem;
							
					currentVendor.supplies = newSupplies;

					
					
					response.statusCode = 200;
					response.end();
					
				});
			}
			else{
				response.statusCode = 404;
				response.write("Unknwn resource.");
				response.end();
			}
			
		}
	});
	
	//Server listens on port 3000
	server.listen(3000);
	console.log('http://localhost:3000/');
});


//Function to get number of orders for that vendor
function getNumOrders(thisVendor){
	return allOrders[thisVendor].length;
}

//Function to get average order price for that vendor
function getAvgOrderPrice(thisVendor){
	let orderTotal = 0;
	let avgOrderTotal = 0;
	if(allOrderPrices[thisVendor].length != 0){
		allOrderPrices[thisVendor].forEach(elem => {
			orderTotal += elem;
		});
		avgOrderTotal = orderTotal / allOrderPrices[thisVendor].length;
	}
	

	return avgOrderTotal;
}


//Function to get the most popular item for that vendor
function getMostPopItem(thisVendor){
	let itemNums = {};
	let currentVendor = vendors[selected];

	if(allOrders[thisVendor].length > 0){
		allOrders[thisVendor].forEach(elem => {
			Object.keys(elem).forEach(elem1 =>{
				if(itemNums.hasOwnProperty(elem1)){
					itemNums[elem1] += elem[elem1];
				}
				else{
					itemNums[elem1] = elem[elem1];
				}
				
			});
		});
	
		let mostPopItemNum = 0;
		let mostPopItemIndex = 0;
		let mostPopItemName = "";
	
		
		Object.keys(itemNums).forEach(elem =>{
			if(itemNums[elem] > mostPopItemNum){
				mostPopItemNum = itemNums[elem];
				mostPopItemIndex = elem;
			}
		});
	
		let categories = Object.keys(currentVendor.supplies);
	
		let id = mostPopItemIndex;
		for (let i = 0; i < categories.length; i++) {
			if (currentVendor.supplies[categories[i]].hasOwnProperty(id)) {
				mostPopItemName = currentVendor.supplies[categories[i]][id].name;
			}
		}
	
		return mostPopItemName;
	}

	return "N/A";
	

}