#include <Servo.h>

#if 1
// Normal servo that doesn't freak out with standard zero range.
#define MIN_PULSE_WIDTH (544)
#else
// Off-brand servo that does freak out.
#define MIN_PULSE_WIDTH (800)
#endif

#define SERVO_PIN (2)
#define POT_PIN (7)
Servo myservo;

void handle_commands() {
  if (Serial.available()) {
    char b = Serial.read();
    if (b >= '0' && b <= '9') {
      int d = (b - '0') * 18;
      myservo.write(d);
    }
  }
}

void generate_status() {
  static char last_pot_char = 0;
  int pot = analogRead(0);
  char pot_char = '0' + pot / 103;
  if (pot_char != last_pot_char) {
    Serial.print(pot_char);
    last_pot_char = pot_char;
  }
}

void set_up_servo() {
  myservo.attach(SERVO_PIN, MIN_PULSE_WIDTH, 2400);

  // Run through full range to make sure we're working.
  myservo.write(180);
  delay(500);
  myservo.write(0);
  delay(500);
}

void set_up_pot() {
  // AREF should equal power supply voltage (5V).
  analogReference(DEFAULT);

  // Supply current to pot. We did this because we'd already used
  // up the 5V socket for the servo.
  pinMode(POT_PIN, OUTPUT);
  digitalWrite(POT_PIN, HIGH);
}

void setup() {
  Serial.begin(57600);
  set_up_pot();
  set_up_servo();
}

void loop() {
  handle_commands();
  generate_status();
}
