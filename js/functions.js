jQuery(document).ready(function($){
	/**
	** Getting Product Date From api/products.json
	**/
	$.getJSON( 'api/products.json', function(prodcuts){
		var output 		= '<div class="row">';
		var categories 	= ['Tools', 'Switches'];
		$.each( prodcuts, function(index, product){
			output += '<div class="col-sm-4 col-xs-6">';
			output += '<div id="product-'+product.id+'" class="product-box margin-bottom margin-top">';
			output += '<div style="background: #E0D5C1; height: 300px; width:100%; line-height: 300px; text-align:center;" class="margin-bottom product-id"> #'+product.id+'</div>';
			output += '<div class="text-info product-name">'+product.description+'</div>';
			output += '<div class="text-muted product-category"><i>Category: '+categories[parseInt(product.category)-1]+'</i></div>';
			output += '<div class="text-success text-center product-price">€ '+product.price+'</div>';
			output += '<div class="text-center margin-top"><div class="btn btn-warning add-to-cart" data-toggle="modal" data-target="#qty-popup"> Add To Cart</div></div></div><!-- end of product box -->';
			output += '</div>';
		});
		output += '<div class="clearfix"></div>';
		output += '</div><!-- end of row -->'
		$("#products-area").html(output);
	});

	/**
	** Cart Initialization
	**/
	$.post('services/cart-services.php', {action:'sl_get_contents'}, function(data){
		var cartContents = $.parseJSON(data);
		displayCartContent( cartContents );
	})

	/**
	** Modal Initialization (adding items)
	** Product "Add To Cart" Click Event
	**/
	$(document).on('click', '.add-to-cart', function(event){
		$("#current-product").val( $(this).closest('.product-box').attr('id') );
		$("#product-quantity").val( 1 );
		$('#modal-confirm').removeClass('hidden');
		$("#modal-remove").addClass('hidden');
	});
	/**
	** Add To Cart Routine
	** "Add To Cart" Click Event
	**/
	$(document).on('click','#modal-confirm',function(event){
		console.log($("#current-product").val());
		var productElement 	= $( "#"+ $("#current-product").val() );
		var productID 		= productElement.find('.product-id').text().replace('#','');
		var productName 	= productElement.find('.product-name').text();
		var productCategory = productElement.find('.product-category').text();
		var productPrice 	= productElement.find('.product-price').text().replace('€','');
		var productQuantity	= $('#product-quantity').val();
		addElementCart( productElement, productID, productName, productCategory, productPrice, productQuantity);
		resetQuantity();
	});

	/**
	** Modal Initialization (removing items)
	** Delete Product click event
	**/
	$(document).on('click', '.delete-product', function(event){
		$("#current-product").val( $(this).closest('tr').attr('id').replace('item-id-','') );
		$("#product-quantity").val( $('#item-id-'+$(this).closest('.product-box').attr('id') ).text() );
		$('#modal-confirm').addClass('hidden');
		$("#modal-remove").removeClass('hidden');
	});
	/**
	** Remove Form Cart Routine
	** "Remove From Cart" Click Event
	**/
	$(document).on('click','#modal-remove',function(event){
		var productElement 	= $( "#product-"+ $("#current-product").val() );
		var productID 		= productElement.find('.product-id').text().replace('#','');
		var productName 	= productElement.find('.product-name').text();
		var productCategory = productElement.find('.productt-category').text();
		var productPrice 	= productElement.find('.product-price').text().replace('€','');
		var productQuantity	= $('#product-quantity').val();
		removeElementCart( productElement, productID, productName, productCategory, productPrice, productQuantity);
		resetQuantity();
	});
});

function addElementCart(element, ID, name, category, price, qty){
	if( qty == '')
		qty = 0;
	$.post('services/cart-services.php',{action: 'sl_add_item', item_id: ID, item_name: name, item_category: category, item_price: price, item_quantity: qty}, function(data){
		var cartContents 	= $.parseJSON( data );
		displayCartContent(cartContents)
		
	});
}
function removeElementCart(element, ID, name, category, price, qty){
	if( qty > parseInt( $("tr#item-id-"+ID.replace(' ','')+" td:last-child").text() ) ){
		alert('Please Select a valid value to remove from cart');
		return false;
	}
	if( qty == '')
		qty = 0;
	$.post('services/cart-services.php', {action: 'sl_remove_from_cart', item_id: ID, r_item_quantity: qty}, function(data){
		var cartContents = $.parseJSON( data );
		displayCartContent(cartContents);
	});
}
function cartCheckout(){

}
function checkDiscounts(){
	checkThousandDiscount();
	checkFivePieces();
	checkToolsDiscount();
}
function resetQuantity(){
	$("#product-quantity").val('');
}

function displayCartContent(contentJSON){

	var $ = jQuery;

	var newObjects 		= contentJSON.new_items;
	var modifiedObjects = contentJSON.modified_items;
	var deletedObjects 	= contentJSON.deleted_items;
	if( (newObjects.length == 0 && modifiedObjects.length == 0 && deletedObjects.length == 0) ){
		$(".cart-content").html('<p class="text-center">Nothing in Cart</p>');
		return false;
	}
	if( $("#items-table").length == 0){
		var tables = '<table id="items-table" class="full-width"><thead><tr><th></th><th class="text-center" style="width: 55%;">Product Name</th><th class="text-center" style="width: 20%;">Price</th><th class="text-center" style="width: 20%;">Quantity</th></tr></thead><tbody></tbody></table><hr><table id="discounts-table" class="full-width"><thead></thead><tbody>	</tbody</table>';
		$('.cart-content').html(tables);
	}
	// Displaying new objects
	$.each( newObjects, function(index, singleProduct){
		var items_content = '<tr id="item-id-'+index.replace(' ','')+'">';
		items_content 	+= '<td class="text-center padding"><span class="glyphicon glyphicon-minus icon-bg delete-product" data-target="#qty-popup" data-toggle="modal"></span></td>';
		items_content 	+= '<td class="text-center padding">'+singleProduct.item_name+'</td>';
		items_content 	+= '<td class="text-center padding">'+singleProduct.item_price+'</td>';
		items_content 	+= '<td class="text-center padding">'+singleProduct.item_quantity+'</td>';
		items_content 	+= '</tr>';
		$("#items-table").append(items_content);
	});
	// Update Existing Objects
	$.each( modifiedObjects, function( index, productQuantity){
		$("tr#item-id-"+index.replace(' ', '')).find("td:last-child").text(productQuantity);
	});
	// Delete Deleted Objects
	$("tr#item-id-"+deletedObjects.replace(' ','')).remove();

	// Displaying Discounts Over 1000
	if( $("#discount-over").length == 0)
		$('table#discounts-table').append('<tr id="discount-over"></tr>');
	$("#discount-over").html('<td class="text-center" style="width: 60%;"><strong>Discount over € 1000</strong></td><td class="text-center text-success" style="width: 20%"><strong>'+contentJSON.discount_10+'</strong></td><td style="width: 20%"></td>');
	// Displaying Discounts Tools 20% 
	if( $("#discount-tools").length == 0)
		$('table#discounts-table').append('<tr id="discount-tools"></tr>');
	$("#discount-tools").html('<td class="text-center" style="width: 60%;"><strong>Discount on Tools</strong></td><td class="text-center text-success" style="width: 20%"><strong>'+contentJSON.discount_20+'</strong></td><td style="width: 20%"></td>');
	// Displaying Discounts Switches 
	if( $("#discount-switchs").length == 0)
		$('table#discounts-table').append('<tr id="discount-switchs"></tr>');
	$("#discount-switchs").html('<td class="text-center" style="width: 60%;"><strong>Discount on Switches</strong></td><td class="text-center text-success" style="width: 20%"><strong>'+contentJSON.discount_switches+'</strong></td><td style="width: 20%"></td>');
	
	// Displaying Total amount
	if( $("tr#total-amount").length == 0 )
		$('table#discounts-table').append('<tr id="total-amount"></tr>');
	$("#total-amount").html('<td class="text-center" style="width: 60%;"><strong>Total</strong></td><td class="text-center text-success" style="width: 20%"><strong>'+contentJSON.total_price+'</strong></td><td style="width: 20%"></td>');
}


 function isNumberKey(evt)
{
	var charCode = (evt.which) ? evt.which : evt.keyCode;
	if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)){
		evt.preventDefault();
		return false;
	}
	return true;
}