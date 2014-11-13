var prodButPrefix = "btnProdID-";
var statusDiv;

function init() {
  console.log("App Init");
  statusDiv = $("#status");
  getProductList();
}

/*****************************************************************************
* Get the list of available products from the Chrome Web Store
*****************************************************************************/

function getProductList() {
  console.log("google.payments.inapp.getSkuDetails");
  statusDiv.text("Retreiving list of available products...");
  google.payments.inapp.getSkuDetails({
    'parameters': {env: "prod"},
    'success': onSkuDetails,
    'failure': onSkuDetailsFailed
  });
}

function onSkuDetails(response) {
  console.log("onSkuDetails", response);
  var products = response.response.details.inAppProducts;
  var count = products.length;
  for (var i = 0; i < count; i++) {
    var product = products[i];
    addProductToUI(product);
  }
  statusDiv.text("");
  getLicenses();
}

function onSkuDetailsFailed(response) {
  console.log("onSkuDetailsFailed", response);
  statusDiv.text("Error retreiving product list. (" + response.response.errorType + ")");
}

/*****************************************************************************
* Get the list of purchased products from the Chrome Web Store
*****************************************************************************/

function getLicenses() {
  console.log("google.payments.inapp.getPurchases");
  statusDiv.text("Retreiving list of purchased products...");
  google.payments.inapp.getPurchases({
    'parameters': {env: "prod"},
    'success': onLicenseUpdate,
    'failure': onLicenseUpdateFailed
  });
}

function onLicenseUpdate(response) {
  console.log("onLicenseUpdate", response);
  var licenses = response.response.details;
  var count = licenses.length;
  for (var i = 0; i < count; i++) {
    var license = licenses[i];
    addLicenseDataToProduct(license);
  }
  statusDiv.text("");
}

function onLicenseUpdateFailed(response) {
  console.log("onLicenseUpdateFailed", response);
  statusDiv.text("Error retreiving list of purchased products.");
}


/*****************************************************************************
* Purchase an item
*****************************************************************************/

function buyProduct(sku) {
  console.log("google.payments.inapp.buy", sku);
  statusDiv.text("Kicking off purchase flow for " + sku);
  google.payments.inapp.buy({
    parameters: {'env': "prod"},
    'sku': sku,
    'success': onPurchase,
    'failure': onPurchaseFailed
  });
}

function onPurchase(purchase) {
  console.log("onPurchase", purchase);
  var jwt = purchase.jwt;
  var cartId = purchase.request.cardId;
  var orderId = purchase.response.orderId;
  statusDiv.text("Purchase completed. Order ID: " + orderId);
  getLicenses();
}

function onPurchaseFailed(purchase) {
  console.log("onPurchaseFailed", purchase);
  var reason = purchase.response.errorType;
  statusDiv.text("Purchase failed. " + reason);
}

/*****************************************************************************
* Update/handle the user interface actions
*****************************************************************************/

function addProductToUI(product) {
  var row = $("<tr></tr>");
  var colName = $("<td></td>").text(product.localeData[0].title);
  var colDesc = $("<td></td>").text(product.localeData[0].description);
  var price = parseInt(product.prices[0].valueMicros, 10) / 1000000;
  var colPrice = $("<td></td>").text("$" + price);
  var butAct = $("<button type='button'></button>")
    .data("sku", product.sku)
    .attr("id", prodButPrefix + product.sku)
    .addClass("btn btn-sm")
    .click(onActionButton)
    .text("Purchase")
    .addClass("btn-success");
  var colBut = $("<td></td>").append(butAct);
  row
    .append(colName)
    .append(colDesc)
    .append(colPrice)
    .append(colBut);
  $("tbody").append(row);
}

function addLicenseDataToProduct(license) {
  var butAction = $("#" + prodButPrefix + license.sku);
  butAction
    .text("View license")
    .removeClass("btn-success")
    .removeClass("btn-default")
    .addClass("btn-info")
    .data("license", license);
}

function onActionButton(evt) {
  console.log("onActionButton", evt);
  var actionButton = $(evt.currentTarget);
  if (actionButton.data("license")) {
    showLicense(actionButton.data("license"));
  } else {
    var sku = actionButton.data("sku");
    buyProduct(sku);
  }
}

function showLicense(license) {
  console.log("showLicense", license);
  var modal = $("#modalLicense");
  modal.find(".license").text(JSON.stringify(license, null, 2));
  modal.modal('show');
}

init();