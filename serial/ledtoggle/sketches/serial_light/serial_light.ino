#define LED 2

void setup() {
  Serial.begin(57600);
  Serial.print("\r\nStart");


  pinMode(LED, OUTPUT);
  // Turn it off for now.
  digitalWrite(LED, LOW);
}

int incomingByte = 0;
void loop() {
  // Check if there's a serial message waiting.
  if (Serial.available() > 0) {
    // If there is, read the incoming byte.
    incomingByte = Serial.read();
    if (incomingByte == 'y') {
      digitalWrite(LED, HIGH);
    } else if (incomingByte == 'n') {
      digitalWrite(LED, LOW);
    }
    Serial.write(incomingByte);
  }
}

