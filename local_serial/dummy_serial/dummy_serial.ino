/* 
Run this to test the serial receive on computer.
Mimics data format of actual Windchimes data output.
*/

// Configurables
// Serial baud rate, no reason to go faster
#define BAUD 9600
// wait_time_ms - delay time (ms) between data updates.
// will be about 2 minutes (120000) in demo.
const unsigned long wait_time_ms = 10 * 1000;
// end Configurables 

unsigned long time;
unsigned long last_time;

void setup (void)
{
  Serial.begin(BAUD);
  delay(1000);
}

void loop (void)
{
  time = millis();
  if (time - last_time > wait_time_ms) 
  {
    last_time = time;
    Serial.print((22.30 + float(random(100))/100.0*10));
    Serial.print(',');
    Serial.print((42.60 + float(random(100))/100.0*10));
    Serial.print(',');
    Serial.print((0.00 + float(random(100))/100.0*10));
    Serial.print(',');
    Serial.print((45.00 + float(random(100))/100.0*10));
    Serial.print(',');
    Serial.print((0.00 + float(random(100))/100.0*10));
    Serial.print(',');
    Serial.print((70.50 + float(random(100))/100.0*10));
    Serial.print(',');
    Serial.print((53.73 + float(random(100))/100.0*10));
    Serial.println();
  }
}
