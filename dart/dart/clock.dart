// Copyright (c) 2012, the Dart project authors.  Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// BSD-style license that can be found in the LICENSE file.

library clock;

import 'dart:html';
import 'dart:math';

part 'balls.dart';
part 'numbers.dart';

void main() {
  new CountDownClock();
}

double fpsAverage;

/**
 * Display the animation's FPS in a div.
 */
void showFps(num fps) {
  if (fpsAverage == null) {
    fpsAverage = fps;
  } else {
    fpsAverage = fps * 0.05 + fpsAverage * 0.95;

    query("#notes").text = "${fpsAverage.round().toInt()} fps";
  }
}

class CountDownClock {
  static const int NUMBER_SPACING = 19;
  static const double BALL_WIDTH = 19.0;
  static const double BALL_HEIGHT = 19.0;

  List<ClockNumber> hours = new List<ClockNumber>(2);
  List<ClockNumber> minutes = new List<ClockNumber>(2);
  List<ClockNumber> seconds = new List<ClockNumber>(2);
  int displayedHour = 0;
  int displayedMinute = 0;
  int displayedSecond = 0;
  Balls balls = new Balls();

  CountDownClock() {
    var parent = query("#canvas-content");

    createNumbers(parent, parent.clientWidth, parent.clientHeight);

    updateTime(new Date.now());

    window.requestAnimationFrame(tick);
  }

  void tick(num time) {
    updateTime(new Date.now());
    balls.tick(time);
    window.requestAnimationFrame(tick);
  }

  void updateTime(Date now) {
    if (now.hour != displayedHour) {
      setDigits(pad2(now.hour), hours);
      displayedHour = now.hour;
    }

    if (now.minute != displayedMinute) {
      setDigits(pad2(now.minute), minutes);
      displayedMinute = now.minute;
    }

    if (now.second != displayedSecond) {
      setDigits(pad2(now.second), seconds);
      displayedSecond = now.second;
    }
  }

  void setDigits(String digits, List<ClockNumber> numbers) {
    for (int i = 0; i < numbers.length; ++i) {
      int digit = digits.charCodeAt(i) - '0'.charCodeAt(0);
      numbers[i].setPixels(ClockNumbers.PIXELS[digit]);
    }
  }

  String pad3(int number) {
    if (number < 10) {
      return "00${number}";
    }
    if (number < 100) {
      return "0${number}";
    }
    return "${number}";
  }

  String pad2(int number) {
    if (number < 10) {
      return "0${number}";
    }
    return "${number}";
  }

  void createNumbers(Element parent, num width, num height) {
    DivElement root = new DivElement();
    makeRelative(root);
    root.style.textAlign = 'center';
    query("#canvas-content").nodes.add(root);

    double hSize = (BALL_WIDTH * ClockNumber.WIDTH + NUMBER_SPACING) * 6
        + (BALL_WIDTH + NUMBER_SPACING) * 2;
    hSize -= NUMBER_SPACING;

    double vSize = BALL_HEIGHT * ClockNumber.HEIGHT;

    double x = (width - hSize) / 2;
    double y = (height - vSize) / 3;

    for (int i = 0; i < hours.length; ++i) {
      hours[i] = new ClockNumber(this, x, Balls.BLUE_BALL_INDEX);
      root.nodes.add(hours[i].root);
      setElementPosition(hours[i].root, x, y);
      x += BALL_WIDTH * ClockNumber.WIDTH + NUMBER_SPACING;
    }

    root.nodes.add(new Colon(x, y).root);
    x += BALL_WIDTH + NUMBER_SPACING;

    for (int i = 0; i < minutes.length; ++i) {
      minutes[i] = new ClockNumber(this, x, Balls.RED_BALL_INDEX);
      root.nodes.add(minutes[i].root);
      setElementPosition(minutes[i].root, x, y);
      x += BALL_WIDTH * ClockNumber.WIDTH + NUMBER_SPACING;
    }

    root.nodes.add(new Colon(x, y).root);
    x += BALL_WIDTH + NUMBER_SPACING;

    for (int i = 0; i < seconds.length; ++i) {
      seconds[i] = new ClockNumber(this, x, Balls.GREEN_BALL_INDEX);
      root.nodes.add(seconds[i].root);
      setElementPosition(seconds[i].root, x, y);
      x += BALL_WIDTH * ClockNumber.WIDTH + NUMBER_SPACING;
    }
  }
}

void makeAbsolute(Element elem) {
  elem.style.position = 'absolute';
}

void makeRelative(Element elem) {
  elem.style.position = 'relative';
}

void setElementPosition(Element elem, double x, double y) {
  elem.style.left = "${x}px";
  elem.style.top = "${y}px";
}

void setElementSize(Element elem, double l, double t, double r, double b) {
  setElementPosition(elem, l, t);
  elem.style.right = "${r}px";
  elem.style.bottom = "${b}px";
}
