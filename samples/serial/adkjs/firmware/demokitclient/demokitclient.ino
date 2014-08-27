#include <Wire.h>
#include <Servo.h>
#include <CapSense.h>


String inputString = "";         // a string to hold incoming data
boolean inputComplete = false;  // whether the string is complete
boolean sendSensors = false;

long count_timer = 0;


/*

RX commands:
  
  0x1: reset board (turn all off and default servo's position)
  0x2: set servos and leds
       0x0..0x2: led 1
       0x3..0x5: led 2
       0x6..0x8: led 3
       0x10: servo 1
       0x11: servo 2
       0x12: servo 3
       
  0x3: set relays
       0x0: relay 1
       0x1: relay 2

TX commands:
  
  0x1: button statuses
  
       0x0 button 1
       0x1 button 2
       0x2 button 3
       0x3: cap sense
       0x4: joy switch
  
  0x4: temp
  0x5: light
  0x6: joy analogic


*/




#define  LED3_RED       2
#define  LED3_GREEN     4
#define  LED3_BLUE      3

#define  LED2_RED       5
#define  LED2_GREEN     7
#define  LED2_BLUE      6

#define  LED1_RED       8
#define  LED1_GREEN     10
#define  LED1_BLUE      9

#define  SERVO1         11
#define  SERVO2         12
#define  SERVO3         13

#define  TOUCH_RECV     14
#define  TOUCH_SEND     15

#define  RELAY1         A0
#define  RELAY2         A1

#define  LIGHT_SENSOR   A2
#define  TEMP_SENSOR    A3

#define  BUTTON1        A6
#define  BUTTON2        A7
#define  BUTTON3        A8

#define  JOY_SWITCH     A9      // pulls line down when pressed
#define  JOY_nINT       A10     // active low interrupt input
#define  JOY_nRESET     A11     // active low reset output


Servo servos[3];

// 10M ohm resistor on demo shield
CapSense   touch_robot = CapSense(TOUCH_SEND, TOUCH_RECV);

void setup();
void loop();

void init_buttons()
{
  pinMode(BUTTON1, INPUT);
  pinMode(BUTTON2, INPUT);
  pinMode(BUTTON3, INPUT);
  pinMode(JOY_SWITCH, INPUT);
  
  // enable the internal pullups
  digitalWrite(BUTTON1, HIGH);
  digitalWrite(BUTTON2, HIGH);
  digitalWrite(BUTTON3, HIGH);
  digitalWrite(JOY_SWITCH, HIGH);
}


void init_relays()
{
  pinMode(RELAY1, OUTPUT);
  pinMode(RELAY2, OUTPUT);
}


void init_leds()
{
  digitalWrite(LED1_RED, 1);
  digitalWrite(LED1_GREEN, 1);
  digitalWrite(LED1_BLUE, 1);
  
  pinMode(LED1_RED, OUTPUT);
  pinMode(LED1_GREEN, OUTPUT);
  pinMode(LED1_BLUE, OUTPUT);
  
  digitalWrite(LED2_RED, 1);
  digitalWrite(LED2_GREEN, 1);
  digitalWrite(LED2_BLUE, 1);
  
  pinMode(LED2_RED, OUTPUT);
  pinMode(LED2_GREEN, OUTPUT);
  pinMode(LED2_BLUE, OUTPUT);
  
  digitalWrite(LED3_RED, 1);
  digitalWrite(LED3_GREEN, 1);
  digitalWrite(LED3_BLUE, 1);
  
  pinMode(LED3_RED, OUTPUT);
  pinMode(LED3_GREEN, OUTPUT);
  pinMode(LED3_BLUE, OUTPUT);
}

void init_joystick(int threshold);

byte b1, b2, b3, b4;
boolean c;

void setup()
{
  inputString.reserve(200);

  Serial.begin(57600);
  Serial.println("\r\nStart");
  
  init_leds();
  init_relays();
  init_buttons();
  init_joystick( 5 );
  
  // autocalibrate OFF
  touch_robot.set_CS_AutocaL_Millis(0xFFFFFFFF);
  
  servos[0].attach(SERVO1);
  servos[0].write(90);
  servos[1].attach(SERVO2);
  servos[1].write(90);
  servos[2].attach(SERVO3);
  servos[2].write(90);
  
  
  b1 = digitalRead(BUTTON1);
  b2 = digitalRead(BUTTON2);
  b3 = digitalRead(BUTTON3);
  b4 = digitalRead(JOY_SWITCH);
  c = 0;
  
  count_timer = millis();

}


void serialEvent() {
  while (Serial.available()) {
    // get the new byte:
    char inChar = (char)Serial.read(); 
    // if the incoming character is a newline, set a flag
    // so the main loop can do something about it:
    if (inChar == '\n' || inChar == '.') {
      inputComplete = true;
    } else {
      // add it to the inputString:
      inputString += inChar;
    }
  }
}


void getData() {
  inputComplete = false;

  
  if (inputString=="data") {
    sendSensors=true;
  } else if (inputString.length() > 0) {
    char cmd = inputString[0];
    char control = inputString[1];
    char v1 = inputString[2];
    char v2 = inputString[3];
    char value=0;
    if (v1>='0' && v1<='9') {
      value+=(v1-'0');
    } else if (v1>='a' && v1<='f'){
      value+=(10+v1-'a');
    }
    value=value<<4;
    if (v2>='0' && v2<='9') {
      value+=(v2-'0');
    } else if (v2>='a' && v2<='f'){
      value+=(10+v2-'a');
    }
    
    
    Serial.print("log:"); Serial.println(inputString);
    
    // assumes only one command per packet
    if (cmd == 'r') {
      // reset outputs to default values on disconnect
      analogWrite(LED1_RED, 255);
      analogWrite(LED1_GREEN, 255);
      analogWrite(LED1_BLUE, 255);
      analogWrite(LED2_RED, 255);
      analogWrite(LED2_GREEN, 255);
      analogWrite(LED2_BLUE, 255);
      analogWrite(LED3_RED, 255);
      analogWrite(LED3_GREEN, 255);
      analogWrite(LED3_BLUE, 255);
      servos[0].write(90);
      servos[0].write(90);
      servos[0].write(90);
      digitalWrite(RELAY1, LOW);
      digitalWrite(RELAY2, LOW);
      
    } else if (cmd == 'c') {
      if (control == '0')
        analogWrite(LED1_RED, 255 - value);
      else if (control == '1')
        analogWrite(LED1_GREEN, 255 - value);
      else if (control == '2')
        analogWrite(LED1_BLUE, 255 - value);
        
      else if (control == '3')
        analogWrite(LED2_RED, 255 - value);
      else if (control == '4')
        analogWrite(LED2_GREEN, 255 - value);
      else if (control == '5')
        analogWrite(LED2_BLUE, 255 - value);
        
      else if (control == '6')
        analogWrite(LED3_RED, 255 - value);
      else if (control == '7')
        analogWrite(LED3_GREEN, 255 - value);
      else if (control == '8')
        analogWrite(LED3_BLUE, 255 - value);
        
    } else if (cmd == 's') {
      if (control == '0')
        servos[0].write(map(value, 0, 255, 0, 180));
      else if (control == '1')
        servos[1].write(map(value, 0, 255, 0, 180));
      else if (control == '2')
        servos[2].write(map(value, 0, 255, 0, 180));
        
    } else if (cmd == 't') {
      if (control == '0')
        digitalWrite(RELAY1, value ? HIGH : LOW);
      else if (control == '1')
        digitalWrite(RELAY2, value ? HIGH : LOW);
    }
  }
  inputString = "";
}


void sendData() {
  int i;
  byte b;
  uint16_t val;
  int x, y;
  boolean c0;
  
  static byte count = 0;
  long touchcount;

  
  char msg[4];

  msg[0] = '1';
  
  b = digitalRead(BUTTON1);
  if (b != b1) {
    Serial.print("b1:"); Serial.println((b ? '0' : '1'));
    //acc.write(msg, 3);
    b1 = b;
  }
  
  b = digitalRead(BUTTON2);
  if (b != b2) {
    Serial.print("b2:"); Serial.println((b ? '0' : '1'));
    //acc.write(msg, 3);
    b2 = b;
  }
  
  b = digitalRead(BUTTON3);
  if (b != b3) {
    Serial.print("b3:"); Serial.println((b ? '0' : '1'));
    //acc.write(msg, 3);
    b3 = b;
  }
  
  
  b = digitalRead(JOY_SWITCH);
  if (b != b4) {
    Serial.print("js:"); Serial.println((b ? '0' : '1'));
    //acc.write(msg, 3);
    b4 = b;
  }
  
  touchcount = touch_robot.capSense(5);
  c0 = touchcount > 300;
  if (c0 != c) {
    Serial.print("c:"); Serial.print(c0 ? '1' : '0');
    c = c0;
  }

  
  
  if (sendSensors) {
    sendSensors=false;

    val = analogRead(TEMP_SENSOR);
    Serial.print("t:"); Serial.println(val);

    val = analogRead(LIGHT_SENSOR);
    Serial.print("l:"); Serial.println(val);

    read_joystick(&x, &y);

    Serial.print("jxy:"); Serial.print(constrain(x, -128, 127));
    Serial.print(","); Serial.println(constrain(y, -128, 127));


  }

}

void loop()
{

  if (inputComplete) {
    getData();
    // clear the string:
    inputString = "";
    inputComplete = false;
  }
  
  if (millis() - count_timer > 10) {
    count_timer = millis();
    sendData();
  }
  //delay(10);
}

// ==============================================================================
// Austria Microsystems i2c Joystick
void init_joystick(int threshold)
{
  byte status = 0;
  
  pinMode(JOY_SWITCH, INPUT);
  digitalWrite(JOY_SWITCH, HIGH);
  
  pinMode(JOY_nINT, INPUT);
  digitalWrite(JOY_nINT, HIGH);
  
  pinMode(JOY_nRESET, OUTPUT);
  
  digitalWrite(JOY_nRESET, 1);
  delay(1);
  digitalWrite(JOY_nRESET, 0);
  delay(1);
  digitalWrite(JOY_nRESET, 1);
  
  Wire.begin();
  
  do {
    status = read_joy_reg(0x0f);
  } while ((status & 0xf0) != 0xf0);
  
  // invert magnet polarity setting, per datasheet
  write_joy_reg(0x2e, 0x86);
  
  calibrate_joystick(threshold);
}


int offset_X, offset_Y;

void calibrate_joystick(int dz)
{
  char iii;
  int x_cal = 0;
  int y_cal = 0;
  
  // Low Power Mode, 20ms auto wakeup
  // INTn output enabled
  // INTn active after each measurement
  // Normal (non-Reset) mode
  write_joy_reg(0x0f, 0x00);
  delay(1);
  
  // dummy read of Y_reg to reset interrupt
  read_joy_reg(0x11);
  
  for(iii = 0; iii != 16; iii++) {
    while(!joystick_interrupt()) {}
    
    x_cal += read_joy_reg(0x10);
    y_cal += read_joy_reg(0x11);
  }
  
  // divide by 16 to get average
  offset_X = -(x_cal>>4);
  offset_Y = -(y_cal>>4);
  
  write_joy_reg(0x12, dz - offset_X);  // Xp, LEFT threshold for INTn
  write_joy_reg(0x13, -dz - offset_X);  // Xn, RIGHT threshold for INTn
  write_joy_reg(0x14, dz - offset_Y);  // Yp, UP threshold for INTn
  write_joy_reg(0x15, -dz - offset_Y);  // Yn, DOWN threshold for INTn
  
  // dead zone threshold detect requested?
  if (dz)
  write_joy_reg(0x0f, 0x04);
}


void read_joystick(int *x, int *y)
{
  *x = read_joy_reg(0x10) + offset_X;
  *y = read_joy_reg(0x11) + offset_Y;  // reading Y clears the interrupt
}

char joystick_interrupt()
{
  return digitalRead(JOY_nINT) == 0;
}


#define  JOY_I2C_ADDR    0x40

char read_joy_reg(char reg_addr)
{
  char c;
  
  Wire.beginTransmission(JOY_I2C_ADDR);
  Wire.write(reg_addr);
  Wire.endTransmission();
  
  Wire.requestFrom(JOY_I2C_ADDR, 1);
  
  while(Wire.available())
    c = Wire.read();
  
  return c;
}

void write_joy_reg(char reg_addr, char val)
{
  Wire.beginTransmission(JOY_I2C_ADDR);
  Wire.write(reg_addr);
  Wire.write(val);
  Wire.endTransmission();
}
