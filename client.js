

//Array to hold all vendor names
let vendorNames = [];


//The drop-down menu
let select = document.getElementById("vendor-select");
//Stores the currently selected vendor index to allow it to be set back when switching vendors is cancelled by user
let currentSelectIndex = select.selectedIndex;
//Stores the current vendor to easily retrieve data. The assumption is that this object is following the same format as the data included above. If you retrieve the vendor data from the server and assign it to this variable, the client order form code should work automatically.
let currentVendor;
//Stored the order data. Will have a key with each item ID that is in the order, with the associated value being the number of that item in the order.
let order = {};


//Variable to hold the selected category from the dropdown menu
let selectedCategory = "";





//Called on page load. Initialize the drop-down list, add event handlers, and default to the first vendor.
function init() {
	addHeader();
	document.getElementById("vendor-select").innerHTML = genSelList();
	document.getElementById("vendor-select").onchange = selectVendor;
	selectVendor(true);
}

//Generate new HTML for a drop-down list containing all vendors.
//For A2, you will likely have to make an XMLHttpRequest from here to retrieve the array of vendor names.
function genSelList() {
	
	let xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
    	if (this.readyState == 4 && this.status == 200) {
			vendorNames = JSON.parse(this.response);

			
    	}
	};
	xhttp.open("GET", "/myVendorNames", false);
	xhttp.send();


	let result = '<select name="vendor-select" id="vendor-select">';

	vendorNames.forEach(elem => {
		result += `<option value="${elem}">${elem}</option>`
	});
	result += "</select>";
	return result;

	
}

//Helper function. Returns true if object is empty, false otherwise.
function isEmpty(obj) {
	for (var key in obj) {
		if (obj.hasOwnProperty(key))
			return false;
	}
	return true;
}

//Called when drop-down list item is changed.
//For A2, you will likely have to make an XMLHttpRequest here to retrieve the supplies list data for the selected vendor
function selectVendor(newPage) {
	let result = true;

	//If order is not empty, confirm the user wants to switch vendors
	if (!isEmpty(order)=== true && newPage === true) {
		result = confirm("Are you sure you want to clear your order and switch vendor?");
	}

	//If switch is confirmed, load the new vendor data
	if (result) {

		let selected = select.options[select.selectedIndex].value;
		currentSelectIndex = select.selectedIndex;

		let xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
    		if (this.readyState == 4 && this.status == 200) {
				currentVendor = JSON.parse(this.response);

			
    		}
		};
	xhttp.open("POST", "/myVendor", false);
	xhttp.send(selected);
		
		//Get the selected index and set the current vendor



		//In A2, current vendor will be data you received from the server
		//currentVendor = vendors[selected];

		//Update the page contents to contain the new supply list
		document.getElementById("left").innerHTML = getCategoryHTML(currentVendor);
		assignMiscellaneousValues();

		document.getElementById("middle").innerHTML = getSuppliesHTML(currentVendor);

		//Clear the current oder and update the order summary
		order = {};
		updateOrder();
		
		//Update the vendor info on the page
		let info = document.getElementById("info");
		info.innerHTML = "<h1>" + currentVendor.name + "</h1>" + "<br>Minimum Order: $" + currentVendor.min_order + "<br>Delivery Fee: $" + currentVendor.delivery_fee + "<br><br>";


	} else {
		//If user refused the change of vendor, reset the selected index to what it was before they changed it
		let select = document.getElementById("vendor-select");
		select.selectedIndex = currentSelectIndex;
	}
}

//Given a vendor object, produces HTML for the left column
function getCategoryHTML(vend) {
	let supplies = vend.supplies;
	let result = "<h3>Categories</h3><br>";
	Object.keys(supplies).forEach(key => {
		result += `<a href="#${key}">${key}</a><br>`;
	});

	result = stuffForAddItemToVendor(result);
	return result;
}

//Given a vendor object, produces the supplies HTML for the middle column
function getSuppliesHTML(vend) {
	let supplies = vend.supplies;
	let result = "";
	//For each category in the supply list
	Object.keys(supplies).forEach(key => {
		result += `<b>${key}</b><a name="${key}"></a><br>`;
		//For each item in the category
		Object.keys(supplies[key]).forEach(id => {
			item = supplies[key][id];
			result += `${item.name} (\$${item.price}, stock=${item.stock}) <img src='add.png' style='height:20px;vertical-align:bottom;' onclick='addItem(${item.stock}, ${id})'/> <br>`;
			result += item.description + "<br><br>";
		});
	});
	return result;
}

//Responsible for adding one of the items with given id to the order, updating the summary, and alerting if "Out of stock"
function addItem(stock, id) {

	if ((order.hasOwnProperty(id) && (stock == order[id])) || stock <= 0){
		alert("Out if stock!");
		return;
	} else if (order.hasOwnProperty(id)) {
		order[id] += 1;
	} else {
		order[id] = 1;
	}
	updateOrder();
}

//Responsible for removing one of the items with given id from the order and updating the summary
function removeItem(id) {
	if (order.hasOwnProperty(id)) {
		order[id] -= 1;
		if (order[id] <= 0) {
			delete order[id];
		}
	}
	updateOrder();
}

//Reproduces new HTML containing the order summary and updates the page
//This is called whenever an item is added/removed in the order
function updateOrder() {
	let result = "";
	let subtotal = 0;

	//For each item ID currently in the order
	Object.keys(order).forEach(id => {
		//Retrieve the item from the supplies data using helper function
		//Then update the subtotal and result HTML
		let item = getItemById(id);
		subtotal += (item.price * order[id]);
		result += `${item.name} x ${order[id]} (${(item.price * order[id]).toFixed(2)}) <img src='remove.png' style='height:15px;vertical-align:bottom;' onclick='removeItem(${id})'/><br>`;
	});

	//Add the summary fields to the result HTML, rounding to two decimal places
	result += `<br>Subtotal: \$${subtotal.toFixed(2)}<br>`;
	result += `Tax: \$${(subtotal * 0.1).toFixed(2)}<br>`;
	result += `Delivery Fee: \$${currentVendor.delivery_fee.toFixed(2)}<br>`;
	let total = subtotal + (subtotal * 0.1) + currentVendor.delivery_fee;
	result += `Total: \$${total.toFixed(2)}<br>`;

	//Decide whether to show the Submit Order button or the "Order X more" label
	if (subtotal >= currentVendor.min_order) {
		result += `<button type="button" id="submit" onclick="submitOrder()">Submit Order</button>`
	} else {
		result += `Add \$${(currentVendor.min_order - subtotal).toFixed(2)} more to your order.`;
	}

	document.getElementById("right").innerHTML = result;
}

//Simulated submitting the order
//For A2, you will likely make an XMLHttpRequest here
function submitOrder() {
	let xhttp = new XMLHttpRequest();
	xhttp.open("POST", "/submit", false);
	xhttp.send(JSON.stringify(order));

	alert("Order placed!");
	order = {};
	selectVendor(true);
}

//Helper function. Given an ID of an item in the current vendors' supply list, returns that item object if it exists.
function getItemById(id) {
	let categories = Object.keys(currentVendor.supplies);
	for (let i = 0; i < categories.length; i++) {
		if (currentVendor.supplies[categories[i]].hasOwnProperty(id)) {
			return currentVendor.supplies[categories[i]][id];
		}
	}
	return null;
}


//Function to add headers
function addHeader(){
	let Links = document.getElementById("links");
    Links.innerHTML += "<h2>Links<h2>";
    Links.innerHTML += '<a href="http://localhost:3000/">Home Page</a><br></br>';
    Links.innerHTML += '<a href="http://localhost:3000/orderform.html">Order Form</a><br></br>';
	Links.innerHTML += '<a href="http://localhost:3000/vendorStats.html">Vendor Stats Page</a>';
}


//Function to initialize home page
function init2(){
    let Title = document.getElementById("title");

    Title.innerHTML += "<h1> Welcome To My Home Page<h1>";

	addHeader();


}


//Function to add the html elements necessary to add new items to the vendors
function stuffForAddItemToVendor(result){
	let categories = Object.keys(currentVendor.supplies);
	result += `<br></br><br></br><br></br><br></br>`;
	result += `<h2>Add new item to store</h2>`;
	result += '<select name="category-select" id="category-select" class = "selecto">';

	categories.forEach(elem => {
		result += `<option value="${elem}">${elem}</option>`
	});
	result += "</select>";

	result += `<br></br><br></br><label for="name_field">Name: &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</label> <input type="text" id="name_field" name = "name_field"><br></br>`;
	result += `<label for="price_field">Price: &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</label> <input type="text" id="price_field" name = "price_field"><br></br>`;
	result += `<label for="stock_field">Stock: &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp</label> <input type="text" id="stock_field" name = "stock_field"><br></br>`;
	result += `<label for="description_field">Description:</label> <input type="text" id="description_field" name = "description_field"><br></br>`;

	result += `<button type="button" id = "add_to_vendor_button">Add Item to Store</button>`;



	return result;
}


//Function to get set the selected category in the dropdown menu for categories to add a new item to vendors
function getSelectedCategory(){
	let categorySelect = document.getElementById("category-select");
	let categoryCurrentSelectIndex = categorySelect.selectedIndex;
	let categories = Object.keys(currentVendor.supplies);
	selectedCategory = categories[categoryCurrentSelectIndex];


}

//Function to assign miscellaneous values to the html elements needed to add a new item to vendors
function assignMiscellaneousValues(){
	let nameText = document.getElementById("name_field");
	let priceText = document.getElementById("price_field");
	let stockText = document.getElementById("stock_field");
	let descText = document.getElementById("description_field");
	let addToVendorButton = document.getElementById("add_to_vendor_button");


	nameText.value = "randoName";
	priceText.value = 10;
	stockText.value = 10;
	descText.value = "Whooo I'm a random thing";
	addToVendorButton.onclick = function(){addItemToVendor()};

}


//The function to actually add a new item to a vendor
function addItemToVendor(){

	getSelectedCategory();
	let categoryTextVal = selectedCategory;
	let nameTextVal = document.getElementById("name_field").value;
	let priceTextVal = document.getElementById("price_field").value;
	let stockTextVal = document.getElementById("stock_field").value;
	let descTextVal = document.getElementById("description_field").value;



	let newItem = {category:categoryTextVal, name:nameTextVal, description:descTextVal, stock:stockTextVal, price:priceTextVal};

	let xhttp = new XMLHttpRequest();
	xhttp.open("PUT", "/newItem", false);
	xhttp.send(JSON.stringify(newItem));

	
	selectVendor(false);


}