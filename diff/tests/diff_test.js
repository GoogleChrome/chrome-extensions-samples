$(document).ready(function() {

  module("setTextFromUrl");

  module("computeDiff");
    var text1 = "abcde\nfghij\nklmno\npqrst\nuvwxy\n12345";
    var text2 = "abcde\nklmno\npqrst\nuvwxy\n12345";

    test("Diff text with itself", function() {
      ok(true, "all pass");
    });

    test("second test within module", function() {
      ok(true, "all pass");
    });

  module("Module B");

    test("some other test", function() {
      expect(2);
      equal(true, false, "failing test");
      equal(true, true, "passing test");
    });

});
