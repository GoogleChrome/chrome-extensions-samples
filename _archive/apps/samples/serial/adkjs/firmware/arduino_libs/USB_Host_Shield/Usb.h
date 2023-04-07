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

/* USB functions */
#ifndef _usb_h_
#define _usb_h_

#include <Max3421e.h>
#include "ch9.h"

/* Common setup data constant combinations  */
#define bmREQ_GET_DESCR     USB_SETUP_DEVICE_TO_HOST|USB_SETUP_TYPE_STANDARD|USB_SETUP_RECIPIENT_DEVICE     //get descriptor request type
#define bmREQ_SET           USB_SETUP_HOST_TO_DEVICE|USB_SETUP_TYPE_STANDARD|USB_SETUP_RECIPIENT_DEVICE     //set request type for all but 'set feature' and 'set interface'
#define bmREQ_CL_GET_INTF   USB_SETUP_DEVICE_TO_HOST|USB_SETUP_TYPE_CLASS|USB_SETUP_RECIPIENT_INTERFACE     //get interface request type
/* HID requests */
#define bmREQ_HIDOUT        USB_SETUP_HOST_TO_DEVICE|USB_SETUP_TYPE_CLASS|USB_SETUP_RECIPIENT_INTERFACE
#define bmREQ_HIDIN         USB_SETUP_DEVICE_TO_HOST|USB_SETUP_TYPE_CLASS|USB_SETUP_RECIPIENT_INTERFACE 
#define bmREQ_HIDREPORT     USB_SETUP_DEVICE_TO_HOST|USB_SETUP_TYPE_STANDARD|USB_SETUP_RECIPIENT_INTERFACE

#define USB_XFER_TIMEOUT    5000    //USB transfer timeout in milliseconds, per section 9.2.6.1 of USB 2.0 spec
#define USB_NAK_LIMIT       32000   //NAK limit for a transfer. o meand NAKs are not counted
#define USB_RETRY_LIMIT     3       //retry limit for a transfer
#define USB_SETTLE_DELAY    200     //settle delay in milliseconds
#define USB_NAK_NOWAIT      1       //used in Richard's PS2/Wiimote code

#define USB_NUMDEVICES  2           //number of USB devices

/* USB state machine states */

#define USB_STATE_MASK                                      0xf0

#define USB_STATE_DETACHED                                  0x10
#define USB_DETACHED_SUBSTATE_INITIALIZE                    0x11        
#define USB_DETACHED_SUBSTATE_WAIT_FOR_DEVICE               0x12
#define USB_DETACHED_SUBSTATE_ILLEGAL                       0x13
#define USB_ATTACHED_SUBSTATE_SETTLE                        0x20
#define USB_ATTACHED_SUBSTATE_RESET_DEVICE                  0x30    
#define USB_ATTACHED_SUBSTATE_WAIT_RESET_COMPLETE           0x40
#define USB_ATTACHED_SUBSTATE_WAIT_SOF                      0x50
#define USB_ATTACHED_SUBSTATE_GET_DEVICE_DESCRIPTOR_SIZE    0x60
#define USB_STATE_ADDRESSING                                0x70
#define USB_STATE_CONFIGURING                               0x80
#define USB_STATE_RUNNING                                   0x90
#define USB_STATE_ERROR                                     0xa0

// byte usb_task_state = USB_DETACHED_SUBSTATE_INITIALIZE

/* USB Setup Packet Structure   */
typedef struct {
    union {                          // offset   description
        byte bmRequestType;         //   0      Bit-map of request type
        struct {
            byte    recipient:  5;  //          Recipient of the request
            byte    type:       2;  //          Type of request
            byte    direction:  1;  //          Direction of data X-fer
        };
    }ReqType_u;
    byte    bRequest;               //   1      Request
    union {
        unsigned int    wValue;             //   2      Depends on bRequest
        struct {
        byte    wValueLo;
        byte    wValueHi;
        };
    }wVal_u;
    unsigned int    wIndex;                 //   4      Depends on bRequest
    unsigned int    wLength;                //   6      Depends on bRequest
} SETUP_PKT, *PSETUP_PKT;

/* Endpoint information structure               */
/* bToggle of endpoint 0 initialized to 0xff    */
/* during enumeration bToggle is set to 00      */
typedef struct {        
    byte epAddr;        //copy from endpoint descriptor. Bit 7 indicates direction ( ignored for control endpoints )
    byte Attr;          // Endpoint transfer type.
    unsigned int MaxPktSize;    // Maximum packet size.
    byte Interval;      // Polling interval in frames.
    byte sndToggle;     //last toggle value, bitmask for HCTL toggle bits
    byte rcvToggle;     //last toggle value, bitmask for HCTL toggle bits
    /* not sure if both are necessary */
} EP_RECORD;
/* device record structure */
typedef struct {
    EP_RECORD* epinfo;      //device endpoint information
    byte devclass;          //device class    
} DEV_RECORD;



class USB : public MAX3421E {
//data structures    
/* device table. Filled during enumeration              */
/* index corresponds to device address                  */
/* each entry contains pointer to endpoint structure    */
/* and device class to use in various places            */             
//DEV_RECORD devtable[ USB_NUMDEVICES + 1 ];
//EP_RECORD dev0ep;         //Endpoint data structure used during enumeration for uninitialized device

//byte usb_task_state;

    public:
        USB( void );
        byte getUsbTaskState( void );
        void setUsbTaskState( byte state );
        EP_RECORD* getDevTableEntry( byte addr, byte ep );
        void setDevTableEntry( byte addr, EP_RECORD* eprecord_ptr );
        byte ctrlReq( byte addr, byte ep, byte bmReqType, byte bRequest, byte wValLo, byte wValHi, unsigned int wInd, unsigned int nbytes, char* dataptr, unsigned int nak_limit = USB_NAK_LIMIT );
        /* Control requests */
        byte getDevDescr( byte addr, byte ep, unsigned int nbytes, char* dataptr, unsigned int nak_limit = USB_NAK_LIMIT );
        byte getConfDescr( byte addr, byte ep, unsigned int nbytes, byte conf, char* dataptr, unsigned int nak_limit = USB_NAK_LIMIT );
        byte getStrDescr( byte addr, byte ep, unsigned int nbytes, byte index, unsigned int langid, char* dataptr, unsigned int nak_limit = USB_NAK_LIMIT );
        byte setAddr( byte oldaddr, byte ep, byte newaddr, unsigned int nak_limit = USB_NAK_LIMIT );
        byte setConf( byte addr, byte ep, byte conf_value, unsigned int nak_limit = USB_NAK_LIMIT );
        /**/
        byte setProto( byte addr, byte ep, byte interface, byte protocol, unsigned int nak_limit = USB_NAK_LIMIT );
        byte getProto( byte addr, byte ep, byte interface, char* dataptr, unsigned int nak_limit = USB_NAK_LIMIT );
        byte getReportDescr( byte addr, byte ep, unsigned int nbytes, char* dataptr, unsigned int nak_limit = USB_NAK_LIMIT );
        byte setReport( byte addr, byte ep, unsigned int nbytes, byte interface, byte report_type, byte report_id, char* dataptr, unsigned int nak_limit = USB_NAK_LIMIT );
	      byte getReport( byte addr, byte ep, unsigned int nbytes, byte interface, byte report_type, byte report_id, char* dataptr, unsigned int nak_limit = USB_NAK_LIMIT );
        byte getIdle( byte addr, byte ep, byte interface, byte reportID, char* dataptr, unsigned int nak_limit = USB_NAK_LIMIT );
        byte setIdle( byte addr, byte ep, byte interface, byte reportID, byte duration, unsigned int nak_limit = USB_NAK_LIMIT );
        /**/
        byte ctrlData( byte addr, byte ep, unsigned int nbytes, char* dataptr, boolean direction, unsigned int nak_limit = USB_NAK_LIMIT );
        byte ctrlStatus( byte ep, boolean direction, unsigned int nak_limit = USB_NAK_LIMIT );
        byte inTransfer( byte addr, byte ep, unsigned int nbytes, char* data, unsigned int nak_limit = USB_NAK_LIMIT );
		int newInTransfer( byte addr, byte ep, unsigned int nbytes, char* data, unsigned int nak_limit  = USB_NAK_LIMIT);
        byte outTransfer( byte addr, byte ep, unsigned int nbytes, char* data, unsigned int nak_limit = USB_NAK_LIMIT );
        byte dispatchPkt( byte token, byte ep, unsigned int nak_limit = USB_NAK_LIMIT );
        void Task( void );
    private:
        void init();
};

//get device descriptor
inline byte USB::getDevDescr( byte addr, byte ep, unsigned int nbytes, char* dataptr, unsigned int nak_limit ) {
    return( ctrlReq( addr, ep, bmREQ_GET_DESCR, USB_REQUEST_GET_DESCRIPTOR, 0x00, USB_DESCRIPTOR_DEVICE, 0x0000, nbytes, dataptr, nak_limit ));
}
//get configuration descriptor  
inline byte USB::getConfDescr( byte addr, byte ep, unsigned int nbytes, byte conf, char* dataptr, unsigned int nak_limit ) {
        return( ctrlReq( addr, ep, bmREQ_GET_DESCR, USB_REQUEST_GET_DESCRIPTOR, conf, USB_DESCRIPTOR_CONFIGURATION, 0x0000, nbytes, dataptr, nak_limit ));
}
//get string descriptor
inline byte USB::getStrDescr( byte addr, byte ep, unsigned int nbytes, byte index, unsigned int langid, char* dataptr, unsigned int nak_limit ) {
    return( ctrlReq( addr, ep, bmREQ_GET_DESCR, USB_REQUEST_GET_DESCRIPTOR, index, USB_DESCRIPTOR_STRING, langid, nbytes, dataptr, nak_limit ));
}
//set address 
inline byte USB::setAddr( byte oldaddr, byte ep, byte newaddr, unsigned int nak_limit ) {
    return( ctrlReq( oldaddr, ep, bmREQ_SET, USB_REQUEST_SET_ADDRESS, newaddr, 0x00, 0x0000, 0x0000, NULL, nak_limit ));
}
//set configuration
inline byte USB::setConf( byte addr, byte ep, byte conf_value, unsigned int nak_limit ) {
    return( ctrlReq( addr, ep, bmREQ_SET, USB_REQUEST_SET_CONFIGURATION, conf_value, 0x00, 0x0000, 0x0000, NULL, nak_limit ));         
}
//class requests
inline byte USB::setProto( byte addr, byte ep, byte interface, byte protocol, unsigned int nak_limit ) {
        return( ctrlReq( addr, ep, bmREQ_HIDOUT, HID_REQUEST_SET_PROTOCOL, protocol, 0x00, interface, 0x0000, NULL, nak_limit ));
}
inline byte USB::getProto( byte addr, byte ep, byte interface, char* dataptr, unsigned int nak_limit ) {
        return( ctrlReq( addr, ep, bmREQ_HIDIN, HID_REQUEST_GET_PROTOCOL, 0x00, 0x00, interface, 0x0001, dataptr, nak_limit ));        
}
//get HID report descriptor 
inline byte USB::getReportDescr( byte addr, byte ep, unsigned int nbytes, char* dataptr, unsigned int nak_limit ) {
        return( ctrlReq( addr, ep, bmREQ_HIDREPORT, USB_REQUEST_GET_DESCRIPTOR, 0x00, HID_DESCRIPTOR_REPORT, 0x0000, nbytes, dataptr, nak_limit ));
}
inline byte USB::setReport( byte addr, byte ep, unsigned int nbytes, byte interface, byte report_type, byte report_id, char* dataptr, unsigned int nak_limit ) {
    return( ctrlReq( addr, ep, bmREQ_HIDOUT, HID_REQUEST_SET_REPORT, report_id, report_type, interface, nbytes, dataptr, nak_limit ));
}
inline byte USB::getReport( byte addr, byte ep, unsigned int nbytes, byte interface, byte report_type, byte report_id, char* dataptr, unsigned int nak_limit ) { // ** RI 04/11/09
    return( ctrlReq( addr, ep, bmREQ_HIDIN, HID_REQUEST_GET_REPORT, report_id, report_type, interface, nbytes, dataptr, nak_limit ));
}
/* returns one byte of data in dataptr */
inline byte USB::getIdle( byte addr, byte ep, byte interface, byte reportID, char* dataptr, unsigned int nak_limit ) {
        return( ctrlReq( addr, ep, bmREQ_HIDIN, HID_REQUEST_GET_IDLE, reportID, 0, interface, 0x0001, dataptr, nak_limit ));    
}
inline byte USB::setIdle( byte addr, byte ep, byte interface, byte reportID, byte duration, unsigned int nak_limit ) {
           return( ctrlReq( addr, ep, bmREQ_HIDOUT, HID_REQUEST_SET_IDLE, reportID, duration, interface, 0x0000, NULL, nak_limit ));
          }
#endif //_usb_h_
