function $(el) {
  return document.getElementById(el);
}

function $F(el) {
  return $(el).value;
}

function bind(obj, func) {
  return function() {
    return func.apply(obj, arguments);
  };
}

function childNodeWithClass(node, className) {
  var expression = ".//*[@class='" + className + "']";
  return document.evaluate(expression, node,
      null, XPathResult.ANY_TYPE, null).iterateNext();  
}