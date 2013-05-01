/* 
Run this to test the serial receive on computer.
Mimics data format of actual Windchimes data output.
*/

// Configurables
// Serial baud rate, no reason to go faster
#define BAUD 9600
// wait_time_ms - delay time (ms) between data updates.
// will be about 2 minutes (120000) in demo.
const unsigned long wait_time_ms = 5 * 1000;
// end Configurables 

unsigned long time;
unsigned long last_time;

void setup (void)
{
  Serial.begin(BAUD);
}

void loop (void)
{
  time = millis();
  if (time - last_time > wait_time_ms) 
  {
    Serial.print(22.30);
    Serial.print(',');
    Serial.print(42.60);
    Serial.print(',');
    Serial.print(0.00);
    Serial.print(',');
    Serial.print(45.00);
    Serial.print(',');
    Serial.print(0.00);
    Serial.print(',');
    Serial.print(70.50);
    Serial.print(',');
    Serial.print(53.73);
    Serial.println();
  }
}
