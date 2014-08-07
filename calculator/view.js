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
              };

var keyboard = { 49 : 1,
                 50 : 2,
                 51 : 3,
                 52 : 4,
                 53 : 5,
                 54 : 6,
                 55 : 7,
                 56 : 8,
                 57 : 9,
                 48 : 0,
                 187 : '=',
                 13 : '=',
                 190 : '.',
                 189 : '-',
                 191 : '/',
                 65 : 'AC',  // a
                 67 : 'AC',  // c
                 8 : 'back',
                 97 : 1,  // numberpad
                 98 : 2,
                 99 : 3,
                 100 : 4,
                 101 : 5,
                 102 : 6,
                 103 : 7,
                 104 : 8,
                 105 : 9,
                 96 : 0,
                 110 : '.',
                 109 : '-',
                 111 : '/',
                 107 : '+',
                 106 : '*'
              };
var shiftKeyboard = { 187 : '+',
                      56 : '*'
                    };

var shift = false;

function View(calcModel) {
  this.calcElement = $('#calc');
  this.buttonsElement = $('#buttons');
  this.displayElement = $('#display');
  this.lastDisplayElement = null;
  this.BuildWidgets();
  var calc = this;

  Array.prototype.forEach.call(document.querySelectorAll('.calc-button'),
    function(button) {
      var handler = function(e) {
        e.preventDefault();
        var clicked = values[e.target.classList[1]];
        var result = calcModel.HandleButtonClick(clicked);
        calc.buttonClicked(clicked, result);
      };
      button.addEventListener('touchstart', handler);
      button.addEventListener('click', handler);
      button.addEventListener('touchstart', function(e) {
        e.target.classList.add('active');
      });
      button.addEventListener('touchend', function(e) {
        e.target.classList.remove('active');
      });
    });

  window.addEventListener("copy", function(e) {
    var result = calcModel.accumulator;
    e.preventDefault();
    e.clipboardData.setData("text/plain",result);
  });

  $(document).keydown(function(event) {
    if (event.ctrlKey && event.keyCode == 67) {
      return;
    }
    var clicked = null;
    if (event.which == 16)
      shift = true;
    else if (shift && event.which in shiftKeyboard)
      clicked = shiftKeyboard[event.which];
    else if (!shift && event.which in keyboard)
      clicked = keyboard[event.which];
    if (clicked != null) {
      var result = calcModel.HandleButtonClick(clicked);
      calc.buttonClicked(clicked, result);
    }
  });

  $(document).keyup(function(event) {
    if (event.which == 16)
      shift = false;
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

View.prototype.buttonClicked = function(clicked, result) {
  var operator = result[0];
  var operand = displayNumber(result[1]);
  var accumulator = displayNumber(result[2]);
  if (clicked == 'AC') {
    this.displayElement.text('');
    this.AddDisplayEquation('', 0, '');
  }
  else if (clicked == 'back' && operator == 'back') {
    this.UpdateDisplayEquation('', '', '');
  }
  else if (operators.indexOf(clicked) != -1) {
    if (this.lastDisplayElement)
      this.UpdateTotal(accumulator);
    operand = '';
    accumulator = '';
    this.AddDisplayEquation(operator, operand, accumulator);
  }
  else if (clicked == '=') {
    this.displayElement.append('<div class="hr"></div>');
    this.AddDisplayEquation('', accumulator, accumulator);
    this.lastDisplayElement = null;
  }
  else if (clicked == '+ / -') {
    this.UpdateDisplayEquation(operator, operand, '');
  }
  else if (this.lastDisplayElement) {
    accumulator = '';
    this.UpdateDisplayEquation(operator, operand, accumulator);
  }
  else {
    accumulator = '';
    operator = '';
    this.AddDisplayEquation(operator, operand, accumulator);
  }
}

View.prototype.BuildWidgets = function() {
  // this.AddButtons(this.calcElement);
  this.AddDisplayEquation('', 0, '');
}

View.prototype.UpdateTotal = function(accumulator) {
  $(this.lastDisplayElement).children('.accumulator').text(accumulator);
}

View.prototype.AddDisplayEquation = function(operator, operand, accumulator) {
  this.displayElement.append(
      '<div class="equation">'
      + '<div class="operand">' + operand + '</div>'
      + '<div class="operator">' + operator + '</div>'
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
