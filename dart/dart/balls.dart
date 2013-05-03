// Copyright (c) 2012, the Dart project authors.  Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// BSD-style license that can be found in the LICENSE file.

part of clock;

int get clientWidth => window.innerWidth;

int get clientHeight => window.innerHeight;

class Balls {
  static const double RADIUS2 = Ball.RADIUS * Ball.RADIUS;

  static const int LT_GRAY_BALL_INDEX = 0;
  static const int GREEN_BALL_INDEX = 1;
  static const int BLUE_BALL_INDEX = 2;

  static const int DK_GRAY_BALL_INDEX = 4;
  static const int RED_BALL_INDEX = 5;
  static const int MD_GRAY_BALL_INDEX = 6;

  static const List<String> PNGS = const [
      "images/ball-d9d9d9.png", "images/ball-009a49.png",
      "images/ball-13acfa.png", "images/ball-265897.png",
      "images/ball-b6b4b5.png", "images/ball-c0000b.png",
      "images/ball-c9c9c9.png"
  ];

  DivElement root;
  num lastTime;
  List<Ball> balls;

  Balls() :
      lastTime = new Date.now().millisecondsSinceEpoch,
      balls = new List<Ball>() {
    root = new DivElement();
    document.body.nodes.add(root);
    makeAbsolute(root);
    setElementSize(root, 0.0, 0.0, 0.0, 0.0);
  }

  void tick(num now) {
    showFps(1000.0 / (now - lastTime + 0.01));

    double delta = min((now - lastTime) / 1000.0, 0.1);
    lastTime = now;

    // incrementally move each ball, removing balls that are offscreen
    balls = balls.filter((ball) => ball.tick(delta));
    collideBalls(delta);
  }

  void collideBalls(double delta) {
    balls.forEach((b0) {
      balls.forEach((b1) {
        // See if the two balls are intersecting.
        double dx = (b0.x - b1.x).abs();
        double dy = (b0.y - b1.y).abs();
        double d2 = dx * dx + dy * dy;

        if (d2 < RADIUS2) {
          // Make sure they're actually on a collision path
          // (not intersecting while moving apart).
          // This keeps balls that end up intersecting from getting stuck
          // without all the complexity of keeping them strictly separated.
          if (newDistanceSquared(delta, b0, b1) > d2) {
            return;
          }

          // They've collided. Normalize the collision vector.
          double d = sqrt(d2);

          if (d == 0) {
            // TODO: move balls apart.

            return;
          }

          dx /= d;
          dy /= d;

          // Calculate the impact velocity and speed along the collision vector.
          double impactx = b0.vx - b1.vx;
          double impacty = b0.vy - b1.vy;
          double impactSpeed = impactx * dx + impacty * dy;

          // Bump.
          b0.vx -= dx * impactSpeed;
          b0.vy -= dy * impactSpeed;
          b1.vx += dx * impactSpeed;
          b1.vy += dy * impactSpeed;
        }
      });
    });
  }

  double newDistanceSquared(double delta, Ball b0, Ball b1) {
    double nb0x = b0.x + b0.vx * delta;
    double nb0y = b0.y + b0.vy * delta;
    double nb1x = b1.x + b1.vx * delta;
    double nb1y = b1.y + b1.vy * delta;
    double ndx = (nb0x - nb1x).abs();
    double ndy = (nb0y - nb1y).abs();
    double nd2 = ndx * ndx + ndy * ndy;
    return nd2;
  }

  void add(double x, double y, int color) {
    balls.add(new Ball(root, x, y, color));
  }
}

class Ball {
  static const double GRAVITY = 400.0;
  static const double RESTITUTION = 0.8;
  static const double MIN_VELOCITY = 100.0;
  static const double INIT_VELOCITY = 800.0;
  static const double RADIUS = 14.0;

  static Random random;

  static double randomVelocity() {
    if (random == null) {
      random = new Random();
    }

    return (random.nextDouble() - 0.5) * INIT_VELOCITY;
  }

  Element root;
  ImageElement elem;
  double x, y;
  double vx, vy;
  double ax, ay;
  double age;

  Ball(this.root, this.x, this.y, int color) {
    elem = new ImageElement(src: Balls.PNGS[color]);
    makeAbsolute(elem);
    setElementPosition(elem, x, y);
    root.nodes.add(elem);

    ax = 0.0;
    ay = GRAVITY;

    vx = randomVelocity();
    vy = randomVelocity();
  }

  // return false => remove me
  bool tick(double delta) {
    // Update velocity and position.
    vx += ax * delta;
    vy += ay * delta;

    x += vx * delta;
    y += vy * delta;

    // Handle falling off the edge.
    if ((x < RADIUS) || (x > clientWidth)) {
      elem.remove();
      return false;
    }

    // Handle ground collisions.
    if (y > clientHeight) {
      y = clientHeight.toDouble();
      vy *= -RESTITUTION;
    }

    // Position the element.
    setElementPosition(elem, x - RADIUS, y - RADIUS);

    return true;
  }
}
