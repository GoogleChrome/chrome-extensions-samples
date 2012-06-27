function View(calcModel) {
  this.calcElement = $('#calc');
  this.BuildWidgets();
  var displayElement = $('#display');
  $('.calc-button').click(function() {
      displayElement.val(calcModel.HandleButtonClick($(this).val()));
    });
}

View.prototype.BuildWidgets = function() {
  this.AddDisplay(this.calcElement);
  this.AddButtons(this.calcElement);
}

View.prototype.AddDisplay = function() {
  this.displayElement = this.calcElement.append(
      '<input id="display" class="calc-display" type="text" value="0" />');
}

View.prototype.AddButtons = function() {
  var row;
  row = this.AddRow();
  this.AddButton(row, 7);
  this.AddButton(row, 8);
  this.AddButton(row, 9);
  this.AddButton(row, '-');

  row = this.AddRow();
  this.AddButton(row, 4);
  this.AddButton(row, 5);
  this.AddButton(row, 6);
  this.AddButton(row, '+');

  row = this.AddRow();
  this.AddButton(row, 1);
  this.AddButton(row, 2);
  this.AddButton(row, 3);
  this.AddButton(row, 'C');

  row = this.AddRow();
  this.AddButton(row, 0, true);
  this.AddButton(row, '=', true);
}

View.prototype.AddRow = function() {
  var row = $('<div/>');
  this.calcElement.append(row);
  return row;
}

View.prototype.AddButton = function(row, value, big) {
  var class_suffix = big ? ' big' : '';
  row.append('<input class="calc-button' + class_suffix +
             '" type="button" value="' +
             value + '" />');
}
