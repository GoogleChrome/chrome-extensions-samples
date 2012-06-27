function Calculator() {
  this.operatorNeedsReset = true;
  this.operandNeedsReset = true;
  this.accumulatorNeedsReset = true;
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
      // This block feels like a hack. It's to deal with this case:
      //
      // 2+5=-1=
      //
      // which should give us 6.
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
      this.operandNeedsReset = true;
      this.operatorNeedsReset = true;
      this.DoOperation();
      this.SendAccumulatorByUDP();
      break;
    case 'C':
      this.accumulatorNeedsReset = true;
      this.operandNeedsReset = true;
      this.operatorNeedsReset = true;
      this.ResetRegisters();
      break;
    default:
      this.ResetRegisters();
      if (this.operand < 10000000) {
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
  return result;
}
