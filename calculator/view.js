var operators = ['+', '-', '/', '*'];

var values = { 'one'   : 1,
               'two'   : 2,
               'three' : 3,
               'four'  : 4,
               'five'  : 5,
               'six'   : 6,
               'seven' : 7,
               'eight' : 8,
               'nine'  : 9,
               'zero'  : 0,
               'plus'  : '+',
               'minus' : '-',
               'div'   : '/',
               'mult'  : '*',
               'equals': '=',
               'point' : '.',
               'AC'    : 'AC',
               'plus-minus' : '+ / -'
              }

function View(calcModel) {
  this.calcElement = $('#calc');
  this.buttonsElement = $('#buttons');
  this.displayElement = $('#display');
  this.lastDisplayElement = null;
  this.BuildWidgets();
  var calc = this;
  $('.calc-button').click(function() {
    var clicked = values[$(this).attr('class').split(' ')[1]];

    var result = calcModel.HandleButtonClick(clicked);
    var operator = result[0];
    var operand = displayNumber(result[1]);
    var accumulator = displayNumber(result[2]);
    if (clicked == 'AC') {
      calc.displayElement.text('');
      calc.lastDisplayElement = null;
    }
    else if (operators.indexOf(clicked) != -1) {
      if (calc.lastDisplayElement)
        calc.UpdateTotal(accumulator);
      operand = '';
      accumulator = '';
      calc.AddDisplayEquation(operator, operand, accumulator);
    }
    else if (clicked == '=') {
      calc.displayElement.append('<div class="hr"></div>');
      calc.AddDisplayEquation('', '', accumulator);
      this.lastDisplayElement = null;
    }
    else if (clicked == '+ / -') {
      calc.UpdateDisplayEquation(operator, operand, accumulator);
    }
    else if (calc.lastDisplayElement) {
      accumulator = '';
      calc.UpdateDisplayEquation(operator, operand, accumulator);
    }
    else {
      accumulator = '';
      operator = '';
      calc.AddDisplayEquation(operator, operand, accumulator)
    }
  });
}

function displayNumber(number) {
  var digits = (number + '').length;
  if ((number >= 0 && digits > 8) || (number < 0 && digits > 9)) {
    if (number % 1 != 0) {
      number = parseFloat((number + '').slice(0, 8));
      if (number % 1 != 0) return number;
    }
    var pow = (number + '').length - 1;
    var extra_length = (pow + '').length + 2;
    number = number * Math.pow(10, -1*pow);
    number = (number + '').slice(0, 8 - extra_length) + 'e' + pow;
  }
  return number;
}

View.prototype.BuildWidgets = function() {
  this.AddButtons(this.calcElement);
}

View.prototype.UpdateTotal = function(accumulator) {
  $(this.lastDisplayElement).children('.accumulator').text(accumulator);
}

View.prototype.AddDisplayEquation = function(operator, operand, accumulator) {
  this.displayElement.append(
      '<div class="equation">'
      + '<div class="operator">' + operator + '</div>'
      + '<div class="operand">' + operand + '</div>'
      + '<div class="accumulator">' + accumulator + '</div'
      + '</div>');
  this.lastDisplayElement = $('.equation').last();
  this.displayElement.scrollTop(this.displayElement[0].scrollHeight);
}

View.prototype.UpdateDisplayEquation = function(operator, operand, accumulator) {
  $(this.lastDisplayElement).children('.operator').text(operator);
  $(this.lastDisplayElement).children('.operand').text(operand);
  $(this.lastDisplayElement).children('.accumulator').text(accumulator);
  this.displayElement.scrollTop(this.displayElement[0].scrollHeight);
}

View.prototype.AddButtons = function() {
  var row;

  row = this.AddRow();
  this.AddButton(row, 'AC', 'AC');
  this.AddButton(row, 'plus-minus', 'plus-minus');
  this.AddButton(row, 'div', 'div');
  this.AddButton(row, 'mult', 'mult');

  row = this.AddRow();
  this.AddButton(row, 7, 'seven');
  this.AddButton(row, 8, 'eight');
  this.AddButton(row, 9, 'nine');
  this.AddButton(row, 'minus', 'minus');

  row = this.AddRow();
  this.AddButton(row, 4, 'four');
  this.AddButton(row, 5, 'five');
  this.AddButton(row, 6, 'six');
  this.AddButton(row, 'plus', 'plus');

  row = this.AddRow();
  this.AddButton(row, 1, 'one');
  this.AddButton(row, 2, 'two');
  this.AddButton(row, 3, 'three');
  this.AddButton(row, 'equals', 'equals');

  row = this.AddRow();
  this.AddButton(row, 0, 'zero');
  this.AddButton(row, 'point', 'point')
}

View.prototype.AddRow = function() {
  var row = $('<div/>');
  this.buttonsElement.append(row);
  return row;
}

View.prototype.AddButton = function(row, value, button_value) {
  // var special = ''
  // if (value == 0) special += ' zero';
  // if (value == '=') special += ' equals';
  // if (value == '.') special += ' point';
  // if (operators.indexOf(value) != -1) special += ' operator'
  row.append('<div class="calc-button ' + button_value + '">' + '</div>');
}
