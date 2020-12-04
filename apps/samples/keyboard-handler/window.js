/*
  Adapted from
  http://github.com/scheib/HTMLMisc/blob/gh-pages/KeyboardState.html and
  http://www.cryer.co.uk/resources/javascript/script20_respond_to_keypress.htm
*/
"use strict";

var keyStateDict = {};

function updateInnerHTML(idToUpdate, description)
{
  var cell = document.getElementById(idToUpdate);
  cell.innerHTML = description;
}
function displayKeyState()
{
  var s = document.getElementById("keyStateDisplay");
  // Take JSON of keyStateDict and replace structure characters with new lines.
  var ss = JSON.stringify(keyStateDict);
  var re = new RegExp("[,{}] *", "g");
  ss = ss.replace(re, "\n");
  s.innerHTML = ss;
}
function updateKeyState(event, description)
{
  keyStateDict[GetCodeFor(event)] = description;
  displayKeyState();
}
function logEvent(description)
{
  var logDiv = document.getElementById("keyLog");
  var entry = document.createElement("div");
  entry.innerText = description;
  logDiv.insertBefore(entry, logDiv.firstChild)
}
function GetCodeFor(e)
{
  if ((e.charCode) && (e.keyCode==0))
  {
    return e.charCode;
  } else {
    return e.keyCode;
  }
}
function GetDescriptionFor(e)
{
  var result, code;
  if ((e.charCode) && (e.keyCode==0))
  {
    result = "charCode: " + e.charCode;
    code = e.charCode;
  } else {
    result = "keyCode: " + e.keyCode;
    code = e.keyCode;
  }
  if (code == 8) result += " BKSP"
  else if (code == 9) result += " TAB"
  else if (code == 46) result += " DEL"
  else if ((code >= 41) && (code <=126)) result += " '" + String.fromCharCode(code) + "'";
  if (e.shiftKey) result += " shift";
  if (e.ctrlKey) result += " ctrl";
  if (e.altKey) result += " alt";

  return result;
}
function MonitorKeyDown(e)
{
  if (!e) e=window.event;
  var d = GetDescriptionFor(e);
  updateInnerHTML("td-keydown", d);
  updateKeyState(e, d + " == DOWN");
  logEvent(d + " == down");
  return false;
}
function MonitorKeyUp(e)
{
  if (!e) e=window.event;
  var d = GetDescriptionFor(e);
  updateInnerHTML("td-keyup", d);
  updateKeyState(e, d + " == up");
  logEvent(d + " == up");
  return false;
}
function MonitorKeyPress(e)
{
  if (!e) e=window.event;
  var d = GetDescriptionFor(e);
  updateInnerHTML("td-keypress", d);
  logEvent(d + " == press");
  return false;
}
function MonitorBlur()
{
  for (key in keyStateDict)
  {
    if (keyStateDict[key].indexOf("blurred") < 0)
      keyStateDict[key] += "; when document blurred"
  }
  displayKeyState();
  logEvent("blur");
}
function MonitorFocus()
{
  logEvent("focus");
}

document.addEventListener('keydown', MonitorKeyDown, false)
document.addEventListener('keyup', MonitorKeyUp, false)
document.addEventListener('keypress', MonitorKeyPress, false)
document.body.onblur = MonitorBlur;
document.body.onfocus = MonitorFocus;
