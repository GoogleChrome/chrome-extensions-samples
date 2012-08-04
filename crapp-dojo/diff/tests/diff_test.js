$(document).ready(function() {

  var t1 = "I am the very model of a modern Major-General,\n"
           + "I've information vegetable, animal, and mineral,\n"
           + "I know the kings of England, and I quote the fights historical,\n"
           + "From Marathon to Waterloo, in order categorical.\n"
           + "\n"
           + "I'm very well acquainted, too, with matters mathematical,\n"
           + "I understand equations, both the simple and quadratical,\n"
           + "About binomial theorem I'm teeming with a lot o' news,\n"
           + "With many cheerful facts about the square of the hypotenuse.\n"
           + "\n"
           + "I'm very good at integral and differential calculus;\n"
           + "I know the scientific names of beings animalculous:\n"
           + "In short, in matters vegetable, animal, and mineral,\n"
           + "I am the very model of a modern Major-General.\n"
  var t2 = "I am the very model of a cartoon Major-General,\n"
           + "I've information comical, unusual, and whimsical,\n"
           + "I know the kings of England, and I quote the plays historical,\n"
           + "From wicked puns to stupid jokes, in order categorical."
           + "\n"
           + "I'm very good at integral and differential calculus;\n"
           + "I know the scientific names of beings animalculous:\n"
           + "In short, in matters comical, unusual, and whimsical,\n"
           + "I am the very model of a cartoon Major-General.\n";

  module("computeDiff");

    test("Diff text with itself", function() {
      texts = [t1, t1];
      computeDiff(t1, t1);
      var d1 = getText(1);
      var d2 = getText(2);
      equal(d1, t1, 'Displayed text should be the same as input text');
      equal(d1, d2, 'Displayed text should be the same on both sides');
    });

    test("Diff text", function() {
      texts = [t1, t2];
      computeDiff(t1, t2);
      var d1 = getText(1);
      var d2 = getText(2);
      equal(t1, d1, 'Displayed text on left should be the same as input t1');
      equal(t2, d2, 'Displayed text on right should be the same as input t2');
    });

  module("SetLineNums");

    test("Blank lines", function() {
      texts = [t1, t2];
      computeDiff(t1, t2);
      var left_blanks = $('.file-diff.1 div.blank');
      equal(left_blanks.length, 0, 'There should be 0 blank lines');
      var right_blanks = $('.file-diff.2 div.blank');
      equal(right_blanks.length, 5, 'There should be 5 blank lines');
      ok($(right_blanks[0]).hasClass('realLine-6'),
         'The first blank line is on line 6');
    });

});
