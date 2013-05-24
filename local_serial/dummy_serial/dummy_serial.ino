/* 
Run this to test the serial receive on computer.
Mimics data format of actual Windchimes data output.
*/

// Configurables
// Serial baud rate, no reason to go faster
#define BAUD 9600
#define SERIAL_CONTROL_PIN 2
// wait_time_ms - delay time (ms) between data updates.
// will be about 2 minutes (120000) in demo.
const unsigned long wait_time_ms = 15 * 1000;
// end Configurables 

unsigned long time;
unsigned long last_time;

void setup (void)
{
  pinMode(SERIAL_CONTROL_PIN, OUTPUT);
  Serial.begin(BAUD);
  delay(2000);
  send_sensor();
}

void loop (void)
{
  digitalWrite(SERIAL_CONTROL_PIN, LOW);
  time = millis();
  if (time - last_time > wait_time_ms) 
  {
    send_sensor();
    last_time = time;
  }
}

void send_sensor(void)
{
  digitalWrite(SERIAL_CONTROL_PIN, HIGH);
  delay(10);
  Serial.print((22.30));// + float(random(100))/100.0*10));
  Serial.print(',');
  Serial.print((42.60));// + float(random(100))/100.0*10));
  Serial.print(',');
  Serial.print((0.00));// + float(random(100))/100.0*10));
  Serial.print(',');
  Serial.print((45.00));// + float(random(100))/100.0*10));
  Serial.print(',');
  Serial.print((0.00));// + float(random(100))/100.0*10));
  Serial.print(',');
  Serial.print((70.50));// + float(random(100))/100.0*10));
  Serial.print(',');
  Serial.print((53.73));// + float(random(100))/100.0*10));
  Serial.print('\r');
  delay(10);
  digitalWrite(SERIAL_CONTROL_PIN, LOW);
}
