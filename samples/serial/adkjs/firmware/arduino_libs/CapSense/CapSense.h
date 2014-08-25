/*
  CapacitiveSense.h v.04 - Capacitive Sensing Library for 'duino / Wiring
  Copyright (c) 2008 Paul Bagder  All rights reserved.
  Version 04 by Paul Stoffregen - Arduino 1.0 compatibility, issue 146 fix
  vim: set ts=4:
*/

// ensure this library description is only included once
#ifndef CapSense_h
#define CapSense_h

#if ARDUINO >= 100
#include "Arduino.h"
#else
#include "WProgram.h"
#endif

// library interface description
class CapSense
{
  // user-accessible "public" interface
  public:
  // methods
	CapSense(uint8_t sendPin, uint8_t receivePin);
	long capSenseRaw(uint8_t samples);
	long capSense(uint8_t samples);
	void set_CS_Timeout_Millis(unsigned long timeout_millis);
	void reset_CS_AutoCal();
	void set_CS_AutocaL_Millis(unsigned long autoCal_millis);
  // library-accessible "private" interface
  private:
  // variables
	int error;
	unsigned long  leastTotal;
	unsigned int   loopTimingFactor;
	unsigned long  CS_Timeout_Millis;
	unsigned long  CS_AutocaL_Millis;
	unsigned long  lastCal;
	unsigned long  total;
	uint8_t sBit;   // send pin's ports and bitmask
	volatile uint8_t *sReg;
	volatile uint8_t *sOut;
	uint8_t rBit;    // receive pin's ports and bitmask 
	volatile uint8_t *rReg;
	volatile uint8_t *rIn;
	volatile uint8_t *rOut;
  // methods
	int SenseOneCycle(void);
};

#endif
