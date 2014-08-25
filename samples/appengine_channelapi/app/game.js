
ROOT = 'http:/localhost:8080';

window.addEventListener('DOMContentLoaded', init);

function init() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', ROOT);
  xhr.onload = function(e) {
    game(JSON.parse(e.target.responseText));
  };
  xhr.send();
}


function game(data) {

  // event listeners:
  document.querySelector('#go').addEventListener('click', function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', ROOT+'/?g='+document.querySelector('#another_game_key').value);
    xhr.onload = function(e) {
      initialize(JSON.parse(e.target.responseText));
    };
    xhr.send();
  });

  var handleMouseOver = function(e) { highlightSquare(parseInt(e.target.id)) };
  var handleOnClick = function(e) { moveInSquare(parseInt(e.target.id)) };
  var i;
  for (i = 0; i < 9; i++) {
    var square = document.getElementById(i);
    square.onmouseover = handleMouseOver;
    square.onclick = handleOnClick;
  }


  var state = {
  };

  updateGame = function() {
    for (i = 0; i < 9; i++) {
      var square = document.getElementById(i);
      square.innerHTML = state.board[i];
      if (state.winner != '' && state.winningBoard != '') {
        if (state.winningBoard[i] == state.board[i]) {
          if (state.winner == state.me) {
            square.style.background = "green";
          } else {
            square.style.background = "red";
          }
        } else {
          square.style.background = "white";
        }
      }
    }
    
    var display = {
      'other-player': 'none',
      'your-move': 'none',
      'their-move': 'none',
      'you-won': 'none',
      'you-lost': 'none',
      'board': 'block'
    }; 

    if (!state.userO || state.userO == '') {
      display['other-player'] = 'block';
      display['board'] = 'none';
    } else if (state.winner == state.me) {
      display['you-won'] = 'block';
    } else if (state.winner != '') {
      display['you-lost'] = 'block';
    } else if (isMyMove()) {
      display['your-move'] = 'block';
    } else {
      display['their-move'] = 'block';
    }
    
    for (var label in display) {
      document.getElementById(label).style.display = display[label];
    }
  };
  
  isMyMove = function() {
    return (state.winner == "") && 
        (state.moveX == (state.userX == state.me));
  }

  myPiece = function() {
    return state.userX == state.me ? 'X' : 'O';
  }

  sendMessage = function(path, opt_param) {
    path = ROOT + path + '?g=' + state.game_key;
    if (state.me) {
      path += '&u=' + state.me;
    }
    if (opt_param) {
      path += '&' + opt_param;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('POST', path, true);
    xhr.send();
  };

  moveInSquare = function(id) {
    if (isMyMove() && state.board[id] == ' ') {
      sendMessage('/move', 'i=' + id);
    }
  }

  highlightSquare = function(id) {
    if (state.winner != "") {
      return;
    }
    for (i = 0; i < 9; i++) {
      if (i == id  && isMyMove()) {
        if (state.board[i] = ' ') {
          color = 'lightBlue';
        } else {
          color = 'lightGrey';
        }
      } else {
        color = 'white';
      }

      document.getElementById(i).style['background'] = color;
    }
  }
  
  onOpened = function() {
    sendMessage('/opened');
  };
  
  onMessage = function(m) {
    var newState = JSON.parse(m.data);
    state.board = newState.board || state.board;
    state.userX = newState.userX || state.userX;
    state.userO = newState.userO || state.userO;
    state.moveX = newState.moveX;
    state.winner = newState.winner || "";
    state.winningBoard = newState.winningBoard || "";
    updateGame();
  }
  
  initialize = function(data) {
    state = {
      game_key: data.game_key,
      me: data.me
    }
    var gamelinks = document.querySelectorAll('.gamelink');
    for (var i=0; i<gamelinks.length; i++) {
      gamelinks[i].textContent=data.game_key;
    }
    channelAPI.openChannel(data.token);
    onMessage({data: data.initial_message});
  }      

  var channelAPI = new ChannelInAWebview( ROOT );
  channelAPI.onOpened = onOpened;
  channelAPI.onMessage = onMessage;

  setTimeout( function() {initialize(data)}, 100 );


}
