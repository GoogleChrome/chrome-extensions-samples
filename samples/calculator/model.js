function Calculator() {
  this.operatorNeedsReset = true;
  this.operandNeedsReset = true;
  this.accumulatorNeedsReset = true;
  this.decimal = -1;
  this.ResetRegisters();
}

Calculator.prototype.DoOperation = function() {
  switch (this.operator) {
    case '+':
      this.accumulator += this.operand;
      break;
    case '-':
      this.accumulator -= this.operand;
      break;
    case '/':
      this.accumulator /= this.operand;
      break;
    case '*':
      this.accumulator *= this.operand;
      break;
    default:
      this.accumulator = this.operand;
    break;
  }
  return this.accumulator;
}

Calculator.prototype.SendAccumulatorByUDP = function() {
  var calcResult = this.accumulator;
}

Calculator.prototype.ResetRegisters = function() {
  if (this.operatorNeedsReset) {
    this.operatorNeedsReset = false;
    this.operator = null;
  }
  if (this.operandNeedsReset) {
    this.operandNeedsReset = false;
    this.operand = 0;
    this.decimal = -1;
  }
  if (this.accumulatorNeedsReset) {
    this.accumulatorNeedsReset = false;
    this.accumulator = 0;
  }
}

Calculator.prototype.HandleButtonClick = function(buttonValue) {
  var result;

  switch (buttonValue) {
    case '+':
    case '-':
    case '/':
    case '*':
      this.decimal = -1;
      if (this.operatorNeedsReset) {
        this.operatorNeedsReset = false;
        this.operator = null;
        this.operand = this.accumulator;
      }
      this.operandNeedsReset = true;
      result = this.DoOperation();
      this.operator = buttonValue;
      break;
    case '=':
      this.decimal = -1;
      this.operandNeedsReset = true;
      this.operatorNeedsReset = true;
      this.DoOperation();
      this.SendAccumulatorByUDP();
      break;
    case 'AC':
      this.decimal = -1;
      this.accumulatorNeedsReset = true;
      this.operandNeedsReset = true;
      this.operatorNeedsReset = true;
      this.ResetRegisters();
      break;
    case '.':
      if (this.decimal < 0)
        this.decimal = 0;
      this.operand = parseFloat(this.operand);
      result = this.operand;
      break;
    case '+ / -':
      this.operand *= -1;
      break;
    case 'back':
      this.accumulatorNeedsReset = false;
      this.ResetRegisters();
      if (this.operand == 0) {
        this.operator = 'back';
        this.operatorNeedsReset = true;
      }
      else {
        var operandStr = this.operand + '';
        operandStr = operandStr.slice(0, operandStr.length - 1);
        if (operandStr == '') this.operand = 0;
        else this.operand = parseFloat(operandStr);
      }
      break;
    default:
      this.ResetRegisters();
      if (this.decimal >= 0) {
        this.decimal += 1;
        this.operand += ( Math.pow(10, -1 * this.decimal)
                          * parseInt(buttonValue));
      } else {
        this.operand *= 10;
        this.operand += parseInt(buttonValue);
      }
      result = this.operand;
      break;
  }

  if (result == null) {
    result = this.accumulator;
  }

  var rstr_len = (result + '').length;
  if ((result >= 0 && rstr_len > 8) ||
      (result < 0 && rstr_len > 9)) {
    result = 'Overflow';
  }
  return [this.operator, this.operand, this.accumulator];
}
