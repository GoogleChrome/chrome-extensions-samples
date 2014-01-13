/**
 * Prints a list of tasks on a list with a specified |listId|.
 */
function printTasks(listId, jsonResp, rawResp) {
  if (jsonResp) {
    var taskListsList = document.querySelector('#' + listId);
    jsonResp.items.forEach(function(item) {
      var entry = document.createElement('li');
      entry.textContent = item.title;
      taskListsList.appendChild(entry);
    });
  }
}

/**
 * Gets all of the tasks on a task list identitfied by a specified |listId| and
 * then prints them.
 */
function getTasksOnList(listId) {
  gapi.client.request({
    'path': '/tasks/v1/lists/' + listId + '/tasks',
    'callback': printTasks.bind(null, listId)
  });
}

/**
 * Takes the |jsonResp| and prints all of the lists of tasks found in the items
 * property.
 */
function printTaskLists(jsonResp, rawResp) {
  if (jsonResp && jsonResp.items && jsonResp.items.length > 0) {
    var documentBody = document.querySelector("body");
    jsonResp.items.forEach(function(item) {
      var listHeader = document.createElement("h2");
      listHeader.textContent = item.title;
      documentBody.appendChild(listHeader);
      var list = document.createElement("ul");
      list.id = item.id;
      documentBody.appendChild(list);
      getTasksOnList(item.id);
    });
  }
}

/**
 * Gets the list of task lists owned by the user.
 */
function getListsOfTasks() {
  gapi.client.request({
    'path': '/tasks/v1/users/@me/lists',
    'callback': printTaskLists
  });
}

/**
 * Prompts the user for authorization and then proceeds to 
 */
function authorize(params, callback) {
  gapi.auth.authorize(params, function(accessToken) {
    if (!accessToken) {
      var error = document.createElement("p");
      error.textContent = 'Unauthorized';
      document.querySelector("body").appendChild(error);
    } else {
      callback();
    }
  });
}

function gapiIsLoaded() {
  var params = { 'immediate': false };
  if (!(chrome && chrome.app && chrome.app.runtime)) {
    // This part of the sample assumes that the code is run as a web page, and
    // not an actual Chrome application, which means it takes advantage of the
    // GAPI lib loaded from https://apis.google.com/. The client used below
    // should be working on http://localhost:8000 to avoid origin_mismatch error
    // when making the authorize calls.
    params.scope = "https://www.googleapis.com/auth/tasks.readonly";
    params.client_id = "966771758693-dlbl9dr57ufeovdll13bb0evko6al7o3.apps.googleusercontent.com";
    gapi.auth.init(authorize.bind(null, params, getListsOfTasks));
  } else {
    authorize(params, getListsOfTasks);
  }
}
