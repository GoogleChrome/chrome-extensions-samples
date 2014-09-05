$(document).ready(function() {

  module("Initialize and Reset Registers");

    test("Basic Initialization", function() {
      var calculator = new Calculator();
      ok(!calculator.operatorNeedsReset);
      equal(calculator.operator, null);
      equal(calculator.decimal, -1);
      ok(!calculator.operandNeedsReset);
      ok(!calculator.accumulatorNeedsReset);
      equal(calculator.operand, 0);
      equal(calculator.accumulator, 0);
    });

    test("Reset Operator", function() {
      var calculator = new Calculator();
      calculator.operator = '+';
      calculator.operatorNeedsReset = true;
      calculator.ResetRegisters();
      ok(!calculator.operatorNeedsReset);
      equal(calculator.operator, null);
    });

    test("Reset Operand", function() {
      var calculator = new Calculator();
      calculator.operand = 50;
      calculator.decimal = -5;
      calculator.operandNeedsReset = true;
      calculator.ResetRegisters();
      ok(!calculator.operatorNeedsReset);
      equal(calculator.operator, null);
      equal(calculator.decimal, -1);
    });

    test("Reset Accumulator", function() {
      var calculator = new Calculator();
      calculator.accumulator = 50;
      calculator.accumulatorNeedsReset = true;
      calculator.ResetRegisters();
      ok(!calculator.accumulatorNeedsReset);
      equal(calculator.accumulator, 0);
    });

  module("Do Operations");

    test("Plus", function() {
      var calculator = new Calculator();
      calculator.operator = '+';
      equal(calculator.accumulator, 0);

      calculator.operand = 5;
      calculator.DoOperation();
      equal(calculator.accumulator, 5);

      calculator.operand = -3;
      calculator.DoOperation();
      equal(calculator.accumulator, 2);

      calculator.operand = -2;
      calculator.DoOperation();
      equal(calculator.accumulator, 0);

      calculator.operand = -1;
      calculator.DoOperation();
      equal(calculator.accumulator, -1);

      calculator.operand = 3;
      calculator.DoOperation();
      equal(calculator.accumulator, 2);

      calculator.operand = 0;
      calculator.DoOperation();
      equal(calculator.accumulator, 2);
    });

    test("Minus", function() {
      var calculator = new Calculator();
      calculator.operator = '-';
      equal(calculator.accumulator, 0);

      calculator.operand = 5;
      calculator.DoOperation();
      equal(calculator.accumulator, -5);

      calculator.operand = -3;
      calculator.DoOperation();
      equal(calculator.accumulator, -2);

      calculator.operand = -2;
      calculator.DoOperation();
      equal(calculator.accumulator, 0);

      calculator.operand = -1;
      calculator.DoOperation();
      equal(calculator.accumulator, 1);

      calculator.operand = 3;
      calculator.DoOperation();
      equal(calculator.accumulator, -2);

      calculator.operand = 0;
      calculator.DoOperation();
      equal(calculator.accumulator, -2);
    });

    test("Multiplication", function() {
      var calculator = new Calculator();
      calculator.operator = '*';
      equal(calculator.accumulator, 0);

      calculator.operand = 5;
      calculator.DoOperation();
      equal(calculator.accumulator, 0);

      calculator.accumulator = 1;
      equal(calculator.accumulator, 1);

      calculator.operand = 5;
      calculator.DoOperation();
      equal(calculator.accumulator, 5);

      calculator.operand = -2;
      calculator.DoOperation();
      equal(calculator.accumulator, -10);

      calculator.operand = 1.5;
      calculator.DoOperation();
      equal(calculator.accumulator, -15);

      calculator.operand = -1;
      calculator.DoOperation();
      equal(calculator.accumulator, 15);

      calculator.operand = 0;
      calculator.DoOperation();
      equal(calculator.accumulator, 0);
    });

    test("Division", function() {
      var calculator = new Calculator();
      calculator.operator = '/';
      equal(calculator.accumulator, 0);

      calculator.operand = 5;
      calculator.DoOperation();
      equal(calculator.accumulator, 0);

      calculator.accumulator = 1;
      equal(calculator.accumulator, 1);

      calculator.operand = 5;
      calculator.DoOperation();
      equal(calculator.accumulator, 0.2);

      calculator.operand = -2;
      calculator.DoOperation();
      equal(calculator.accumulator, -0.1);

      calculator.operand = 0.1;
      calculator.DoOperation();
      equal(calculator.accumulator, -1);

      calculator.operand = -1;
      calculator.DoOperation();
      equal(calculator.accumulator, 1);

      calculator.operand = 0;
      calculator.DoOperation();
      equal(calculator.accumulator, 'Infinity');
    });



});
