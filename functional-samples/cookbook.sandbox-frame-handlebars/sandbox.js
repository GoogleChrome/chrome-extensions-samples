let templates = [];

let source = document.getElementById('hello-world-template').innerHTML;

// eslint-disable-next-line no-undef
templates['hello'] = Handlebars.compile(source);

// Set up message event handler:

window.addEventListener('message', function (event) {
  console.log('sandbox message received');

  let command = event.data.command;

  let name = event.data.name || 'hello';

  switch (command) {
    case 'render':
      event.source.postMessage(
        {
          name: name,

          html: templates[name](event.data.context)
        },
        event.origin
      );

      break;

    // You could imagine additional functionality. For instance:

    //

    // case 'new':

    //   templates[event.data.name] = Handlebars.compile(event.data.source);

    //   event.source.postMessage({name: name, success: true}, event.origin);

    //   break;
  }
});
