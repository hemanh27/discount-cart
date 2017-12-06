<?php
error_reporting(0);
if( isset($_POST['action']) && $_POST['action'] == 'sl_get_contents'){
	session_start();
	$total_price = calculate_total( $_SESSION['sl_cart']['items'] );
	$new_items = $_SESSION['sl_cart']['items'] ?: array();
	echo json_encode( array(
		'status'			=> 'success',
		'session_values' 	=> $_SESSION['sl_cart'],
		'new_items'			=> $new_items,
		'modified_items'	=> array(),
		'deleted_items'		=> '',
		'total_price'		=> $total_price['final_price'],
		'discount_10'		=> $total_price['discount_10'],
		'discount_20'		=> $total_price['discount_20'],
		'discount_switches'		=> $total_price['discount_switches'],
		) );
	die();
}
if( isset($_POST['action']) && $_POST['action'] == 'sl_add_item'){
	session_start();
	extract($_POST);
	$item_id = trim($item_id);
	if( !is_array($_SESSION['sl_cart']['items_ids']) ){
		$_SESSION['sl_cart']['items_ids'] = array();
		$_SESSION['sl_cart']['items'] = array();
	}
	$new_items = array();
	$modified_items = array();
	$deleted_items = '';
	if( !in_array($item_id, $_SESSION['sl_cart']['items_ids']) ){
		$_SESSION['sl_cart']['items_ids'][] = $item_id;
		$_SESSION['sl_cart']['items'][$item_id] = array(
			'item_id'		=> $item_id,
			'item_name'		=> $item_name,
			'item_price'	=> $item_price,
			'item_quantity'	=> $item_quantity,
			'item_category'	=> $item_category,
			);
		$new_items[$item_id] = $_SESSION['sl_cart']['items'][$item_id];

	}
	else{
		$_SESSION['sl_cart']['items'][$item_id]['item_quantity'] += $item_quantity;
		$modified_items[$item_id] = $_SESSION['sl_cart']['items'][$item_id]['item_quantity'];
	}

	$total_price = calculate_total( $_SESSION['sl_cart']['items'] );
	echo json_encode( array(
		'status'			=> 'success',
		'session_values' 	=> $_SESSION['sl_cart'],
		'new_items'			=> $new_items,
		'modified_items'	=> $modified_items,
		'deleted_items'		=> $deleted_items,
		'total_price'		=> $total_price['final_price'],
		'discount_10'		=> $total_price['discount_10'],
		'discount_20'		=> $total_price['discount_20'],
		'discount_switches'		=> $total_price['discount_switches'],
		) );
	die();
}
if( isset($_POST) && $_POST['action'] == 'sl_remove_from_cart' ){
	session_start();
	extract($_POST);
	$item_id = trim($item_id);
	$new_items = array();
	$modified_items = array();
	$deleted_items = '';
	if( $_SESSION['sl_cart']['items'][$item_id]['item_quantity'] == $r_item_quantity ){
		unset( $_SESSION['sl_cart']['items'][$item_id] );	
		if( ($key = array_search($item_id, $_SESSION['sl_cart']['items_ids']) ) !== false)
			unset($_SESSION['sl_cart']['items_ids'][$key]);
		$deleted_items = $item_id;
	}
	else{
		$_SESSION['sl_cart']['items'][$item_id]['item_quantity'] -= $r_item_quantity;
		$modified_items[$item_id] = $_SESSION['sl_cart']['items'][$item_id]['item_quantity'];
	}
	$total_price = calculate_total( $_SESSION['sl_cart']['items'] );
	echo json_encode( array(
		'status'			=> 'success',
		'session_values' 	=> $_SESSION['sl_cart'],
		'new_items'			=> $new_items,
		'modified_items'	=> $modified_items,
		'deleted_items'		=> $deleted_items,
		'total_price'		=> $total_price['final_price'],
		'discount_10'		=> $total_price['discount_10'],
		'discount_20'		=> $total_price['discount_20'],
		'discount_switches'		=> $total_price['discount_switches'],
		) );
	die();
}
// Calculatiing the total price
function calculate_total($items){
	
	$total_price = 0;
	$number_of_tools 	= 0;
	$cheapest_tool 		= 999999999999;

	$disc_switches_arr	= array();

	foreach ($items as $key => $item) {
		if($item['item_category'] == 'Category: Tools'){
			$number_of_tools ++;
			if($cheapest_tool > $item['item_price'])
				$cheapest_tool = $item['item_price'];
		}
		if($item['item_category'] == 'Category: Switches'){
			$number_of_switches ++;
			if( $item['item_quantity'] > 5 )
				$disc_switches_arr[ $item['item_id'] ] = $item['item_price'];	
		}

		$total_price += ( floatval($item['item_price']) * floatval( $item['item_quantity']) );
	}

	//Calculating Discounts
	$discount_10 		= 0;
	$discount_20 		= 0;
	$discount_switches 	= 0;
	// Discount 1000 EUR
	if( $total_price > 1000)
		$discount_10 = $total_price * 10 /100;
	// Discount Tools
	if( $number_of_tools >= 2)
		$discount_20 = 20 * $cheapest_tool / 100;
	// Discount Switches
	foreach ($disc_switches_arr as $key => $price) {
		$discount_switches += $price;
	}

	$total_price -= $discount_10;
	$total_price -= $discount_20;
	$total_price -= $discount_switches;

	return array(
		'final_price' 		=> $total_price,
		'discount_10' 		=> $discount_10,
		'discount_20' 		=> $discount_20,
		'discount_switches' => $discount_switches,
		);
}
