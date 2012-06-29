onload = function() {
  document.getElementById('main-form').onsubmit = function(e) {
    e.preventDefault();

    document.getElementById('output').innerHTML =
        document.getElementById('your-name').value;
  };
};
