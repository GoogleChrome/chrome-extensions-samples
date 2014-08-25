/*
 * Copyright 2009-2011 Oleg Mazurov, Circuits At Home, http://www.circuitsathome.com
 * MAX3421E USB host controller support
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the authors nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

/* MAX3421E functions */
#ifndef _MAX3421E_H_
#define _MAX3421E_H_


//#include <Spi.h>
//#include <WProgram.h>
#include "WProgram.h"
#include "Max3421e_constants.h"

class MAX3421E /* : public SPI */ {
    // byte vbusState;
    public:
        MAX3421E( void );
        byte getVbusState( void );
//        void toggle( byte pin );
        static void regWr( byte, byte );
        char * bytesWr( byte, byte, char * );
        static void gpioWr( byte );
        byte regRd( byte );
        char * bytesRd( byte, byte, char * );
        byte gpioRd( void );
        boolean reset();
        boolean vbusPwr ( boolean );
        void busprobe( void );
        void powerOn();
        byte IntHandler();
        byte GpxHandler();
        byte Task();
    private:
	static void pinInit(void);
	static void setRST(uint8_t val);
	static uint8_t readINT(void);
	static uint8_t readGPX(void);

      static void spi_init() {
        uint8_t tmp;
        // initialize SPI pins
        pinMode(SCK_PIN, OUTPUT);
        pinMode(MOSI_PIN, OUTPUT);
        pinMode(MISO_PIN, INPUT);
        pinMode(SS_PIN, OUTPUT);
        /* mode 00 (CPOL=0, CPHA=0) master, fclk/2. Mode 11 (CPOL=11, CPHA=11) is also supported by MAX3421E */
        SPCR = 0x50;
        SPSR = 0x01;
        /**/
        tmp = SPSR;
        tmp = SPDR;
    }
//        void init();
    friend class Max_LCD;        
};




#endif //_MAX3421E_H_
