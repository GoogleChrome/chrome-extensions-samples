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

#include "Usb.h"

static byte usb_error = 0;
static byte usb_task_state;
DEV_RECORD devtable[ USB_NUMDEVICES + 1 ];
EP_RECORD dev0ep;           //Endpoint data structure used during enumeration for uninitialized device


/* constructor */

USB::USB () {
    usb_task_state = USB_DETACHED_SUBSTATE_INITIALIZE;  //set up state machine
    init(); 
}
/* Initialize data structures */
void USB::init()
{
  byte i;
    for( i = 0; i < ( USB_NUMDEVICES + 1 ); i++ ) {
        devtable[ i ].epinfo = NULL;       //clear device table
        devtable[ i ].devclass = 0;
    }
    devtable[ 0 ].epinfo = &dev0ep; //set single ep for uninitialized device  
    // not necessary dev0ep.MaxPktSize = 8;          //minimum possible                        	
    dev0ep.sndToggle = bmSNDTOG0;   //set DATA0/1 toggles to 0
    dev0ep.rcvToggle = bmRCVTOG0;
}
byte USB::getUsbTaskState( void )
{
    return( usb_task_state );
}
void USB::setUsbTaskState( byte state )
{
    usb_task_state = state;
}     
EP_RECORD* USB::getDevTableEntry( byte addr, byte ep )
{
  EP_RECORD* ptr;
    ptr = devtable[ addr ].epinfo;
    ptr += ep;
    return( ptr );
}
/* set device table entry */
/* each device is different and has different number of endpoints. This function plugs endpoint record structure, defined in application, to devtable */
void USB::setDevTableEntry( byte addr, EP_RECORD* eprecord_ptr )
{
    devtable[ addr ].epinfo = eprecord_ptr;
    //return();
}
/* Control transfer. Sets address, endpoint, fills control packet with necessary data, dispatches control packet, and initiates bulk IN transfer,   */
/* depending on request. Actual requests are defined as inlines                                                                                      */
/* return codes:                */
/* 00       =   success         */
/* 01-0f    =   non-zero HRSLT  */
byte USB::ctrlReq( byte addr, byte ep, byte bmReqType, byte bRequest, byte wValLo, byte wValHi, unsigned int wInd, unsigned int nbytes, char* dataptr, unsigned int nak_limit )
{
 boolean direction = false;     //request direction, IN or OUT
 byte rcode;   
 SETUP_PKT setup_pkt;

  regWr( rPERADDR, addr );                    //set peripheral address
  if( bmReqType & 0x80 ) {
    direction = true;                       //determine request direction
  }
    /* fill in setup packet */
    setup_pkt.ReqType_u.bmRequestType = bmReqType;
    setup_pkt.bRequest = bRequest;
    setup_pkt.wVal_u.wValueLo = wValLo;
    setup_pkt.wVal_u.wValueHi = wValHi;
    setup_pkt.wIndex = wInd;
    setup_pkt.wLength = nbytes;
    bytesWr( rSUDFIFO, 8, ( char *)&setup_pkt );    //transfer to setup packet FIFO
    rcode = dispatchPkt( tokSETUP, ep, nak_limit );            //dispatch packet
    //Serial.println("Setup packet");   //DEBUG
    if( rcode ) {                                   //return HRSLT if not zero
        Serial.print("Setup packet error: ");
        Serial.print( rcode, HEX );                                          
        return( rcode );
    }
    //Serial.println( direction, HEX ); 
    if( dataptr != NULL ) {                         //data stage, if present
        rcode = ctrlData( addr, ep, nbytes, dataptr, direction );
    }
    if( rcode ) {   //return error
        Serial.print("Data packet error: ");
        Serial.print( rcode, HEX );                                          
        return( rcode );
    }
    rcode = ctrlStatus( ep, direction );                //status stage
    return( rcode );
}
/* Control transfer with status stage and no data stage */
/* Assumed peripheral address is already set */
byte USB::ctrlStatus( byte ep, boolean direction, unsigned int nak_limit )
{
  byte rcode;
    if( direction ) { //GET
        rcode = dispatchPkt( tokOUTHS, ep, nak_limit );
    }
    else {
        rcode = dispatchPkt( tokINHS, ep, nak_limit );
    }
    return( rcode );
}
/* Control transfer with data stage. Stages 2 and 3 of control transfer. Assumes preipheral address is set and setup packet has been sent */
byte USB::ctrlData( byte addr, byte ep, unsigned int nbytes, char* dataptr, boolean direction, unsigned int nak_limit )
{
 byte rcode;
  if( direction ) {                      //IN transfer
    devtable[ addr ].epinfo[ ep ].rcvToggle = bmRCVTOG1;
    rcode = inTransfer( addr, ep, nbytes, dataptr, nak_limit );
    return( rcode );
  }
  else {              //OUT transfer
    devtable[ addr ].epinfo[ ep ].sndToggle = bmSNDTOG1;
    rcode = outTransfer( addr, ep, nbytes, dataptr, nak_limit );
    return( rcode );
  }    
}
/* IN transfer to arbitrary endpoint. Assumes PERADDR is set. Handles multiple packets if necessary. Transfers 'nbytes' bytes. */
/* Keep sending INs and writes data to memory area pointed by 'data'                                                           */
/* rcode 0 if no errors. rcode 01-0f is relayed from dispatchPkt(). Rcode f0 means RCVDAVIRQ error,
            fe USB xfer timeout */
byte USB::inTransfer( byte addr, byte ep, unsigned int nbytes, char* data, unsigned int nak_limit )
{
 byte rcode;
 byte pktsize;
 byte maxpktsize = devtable[ addr ].epinfo[ ep ].MaxPktSize; 
 unsigned int xfrlen = 0;
    regWr( rHCTL, devtable[ addr ].epinfo[ ep ].rcvToggle );    //set toggle value
    while( 1 ) { // use a 'return' to exit this loop
        rcode = dispatchPkt( tokIN, ep, nak_limit );           //IN packet to EP-'endpoint'. Function takes care of NAKS.
        if( rcode ) {
            return( rcode );                            //should be 0, indicating ACK. Else return error code.
        }
        /* check for RCVDAVIRQ and generate error if not present */ 
        /* the only case when absense of RCVDAVIRQ makes sense is when toggle error occured. Need to add handling for that */
        if(( regRd( rHIRQ ) & bmRCVDAVIRQ ) == 0 ) {
            return ( 0xf0 );                            //receive error
        }
        pktsize = regRd( rRCVBC );                      //number of received bytes
        data = bytesRd( rRCVFIFO, pktsize, data );
        regWr( rHIRQ, bmRCVDAVIRQ );                    // Clear the IRQ & free the buffer
        xfrlen += pktsize;                              // add this packet's byte count to total transfer length
        /* The transfer is complete under two conditions:           */
        /* 1. The device sent a short packet (L.T. maxPacketSize)   */
        /* 2. 'nbytes' have been transferred.                       */
        if (( pktsize < maxpktsize ) || (xfrlen >= nbytes )) {      // have we transferred 'nbytes' bytes?
            if( regRd( rHRSL ) & bmRCVTOGRD ) {                     //save toggle value
                devtable[ addr ].epinfo[ ep ].rcvToggle = bmRCVTOG1;
            }
            else {
                devtable[ addr ].epinfo[ ep ].rcvToggle = bmRCVTOG0;
            }
            return( 0 );
        }
  }//while( 1 )
}

int USB::newInTransfer( byte addr, byte ep, unsigned int nbytes, char* data, unsigned int nak_limit )
{
 byte rcode;
 byte pktsize;
 byte maxpktsize = devtable[ addr ].epinfo[ ep ].MaxPktSize; 
 unsigned int xfrlen = 0;
    regWr( rHCTL, devtable[ addr ].epinfo[ ep ].rcvToggle );    //set toggle value
    while( 1 ) { // use a 'return' to exit this loop
        rcode = dispatchPkt( tokIN, ep, nak_limit );           //IN packet to EP-'endpoint'. Function takes care of NAKS.
        if( rcode ) {
		return -1;                            //should be 0, indicating ACK. Else return error code.
        }
        /* check for RCVDAVIRQ and generate error if not present */ 
        /* the only case when absense of RCVDAVIRQ makes sense is when toggle error occured. Need to add handling for that */
        if(( regRd( rHIRQ ) & bmRCVDAVIRQ ) == 0 ) {
            return -1;                            //receive error
        }
        pktsize = regRd( rRCVBC );                      //number of received bytes
        data = bytesRd( rRCVFIFO, pktsize, data );
        regWr( rHIRQ, bmRCVDAVIRQ );                    // Clear the IRQ & free the buffer
        xfrlen += pktsize;                              // add this packet's byte count to total transfer length
        /* The transfer is complete under two conditions:           */
        /* 1. The device sent a short packet (L.T. maxPacketSize)   */
        /* 2. 'nbytes' have been transferred.                       */
        if (( pktsize < maxpktsize ) || (xfrlen >= nbytes )) {      // have we transferred 'nbytes' bytes?
            if( regRd( rHRSL ) & bmRCVTOGRD ) {                     //save toggle value
                devtable[ addr ].epinfo[ ep ].rcvToggle = bmRCVTOG1;
            }
            else {
                devtable[ addr ].epinfo[ ep ].rcvToggle = bmRCVTOG0;
            }
            return xfrlen;
        }
  }//while( 1 )
}

/* OUT transfer to arbitrary endpoint. Assumes PERADDR is set. Handles multiple packets if necessary. Transfers 'nbytes' bytes. */
/* Handles NAK bug per Maxim Application Note 4000 for single buffer transfer   */
/* rcode 0 if no errors. rcode 01-0f is relayed from HRSL                       */
/* major part of this function borrowed from code shared by Richard Ibbotson    */
byte USB::outTransfer( byte addr, byte ep, unsigned int nbytes, char* data, unsigned int nak_limit )
{
 byte rcode, retry_count;
 char* data_p = data;   //local copy of the data pointer
 unsigned int bytes_tosend, nak_count;
 unsigned int bytes_left = nbytes;
 byte maxpktsize = devtable[ addr ].epinfo[ ep ].MaxPktSize; 
 unsigned long timeout = millis() + USB_XFER_TIMEOUT;
 
  if (!maxpktsize) { //todo: move this check close to epinfo init. Make it 1< pktsize <64
    return 0xFE;
  }
 
  regWr( rHCTL, devtable[ addr ].epinfo[ ep ].sndToggle );    //set toggle value
  while( bytes_left ) {
    retry_count = 0;
    nak_count = 0;
    bytes_tosend = ( bytes_left >= maxpktsize ) ? maxpktsize : bytes_left;
    bytesWr( rSNDFIFO, bytes_tosend, data_p );      //filling output FIFO
    regWr( rSNDBC, bytes_tosend );                  //set number of bytes    
    regWr( rHXFR, ( tokOUT | ep ));                 //dispatch packet
    while(!(regRd( rHIRQ ) & bmHXFRDNIRQ ));        //wait for the completion IRQ
    regWr( rHIRQ, bmHXFRDNIRQ );                    //clear IRQ
    rcode = ( regRd( rHRSL ) & 0x0f );
    while( rcode && ( timeout > millis())) {
      switch( rcode ) {
        case hrNAK:
          nak_count++;
          if( nak_limit && ( nak_count == USB_NAK_LIMIT )) {
            return( rcode);                                   //return NAK
          }
          break;
        case hrTIMEOUT:
          retry_count++;
          if( retry_count == USB_RETRY_LIMIT ) {
            return( rcode );    //return TIMEOUT
          }
          break;
        default:  
          return( rcode );
      }//switch( rcode...
      /* process NAK according to Host out NAK bug */
      regWr( rSNDBC, 0 );
      regWr( rSNDFIFO, *data_p );
      regWr( rSNDBC, bytes_tosend );
      regWr( rHXFR, ( tokOUT | ep ));                 //dispatch packet
      while(!(regRd( rHIRQ ) & bmHXFRDNIRQ ));        //wait for the completion IRQ
      regWr( rHIRQ, bmHXFRDNIRQ );                    //clear IRQ
      rcode = ( regRd( rHRSL ) & 0x0f );
    }//while( rcode && ....
    bytes_left -= bytes_tosend;
    data_p += bytes_tosend;
  }//while( bytes_left...
  devtable[ addr ].epinfo[ ep ].sndToggle = ( regRd( rHRSL ) & bmSNDTOGRD ) ? bmSNDTOG1 : bmSNDTOG0;  //update toggle
  return( rcode );    //should be 0 in all cases
}
/* dispatch usb packet. Assumes peripheral address is set and relevant buffer is loaded/empty       */
/* If NAK, tries to re-send up to nak_limit times                                                   */
/* If nak_limit == 0, do not count NAKs, exit after timeout                                         */
/* If bus timeout, re-sends up to USB_RETRY_LIMIT times                                             */
/* return codes 0x00-0x0f are HRSLT( 0x00 being success ), 0xff means timeout                       */
byte USB::dispatchPkt( byte token, byte ep, unsigned int nak_limit )
{
 unsigned long timeout = millis() + USB_XFER_TIMEOUT;
 byte tmpdata;   
 byte rcode;
 unsigned int nak_count = 0;
 char retry_count = 0;

  while( timeout > millis() ) {
    regWr( rHXFR, ( token|ep ));            //launch the transfer
    rcode = 0xff;   
    while( millis() < timeout ) {           //wait for transfer completion
      tmpdata = regRd( rHIRQ );
      if( tmpdata & bmHXFRDNIRQ ) {
        regWr( rHIRQ, bmHXFRDNIRQ );    //clear the interrupt
        rcode = 0x00;
        break;
      }//if( tmpdata & bmHXFRDNIRQ
    }//while ( millis() < timeout
    if( rcode != 0x00 ) {                //exit if timeout
      return( rcode );
    }
    rcode = ( regRd( rHRSL ) & 0x0f );  //analyze transfer result
    switch( rcode ) {
      case hrNAK:
        nak_count ++;
        if( nak_limit && ( nak_count == nak_limit )) {
          return( rcode );
        }
        break;
      case hrTIMEOUT:
        retry_count ++;
        if( retry_count == USB_RETRY_LIMIT ) {
          return( rcode );
        }
        break;
      default:
        return( rcode );
    }//switch( rcode
  }//while( timeout > millis() 
  return( rcode );
}
/* USB main task. Performs enumeration/cleanup */
void USB::Task( void )      //USB state machine
{
  byte i;   
  byte rcode;
  static byte tmpaddr; 
  byte tmpdata;
  static unsigned long delay = 0;
  USB_DEVICE_DESCRIPTOR buf;
    tmpdata = getVbusState();
    /* modify USB task state if Vbus changed */

    switch( tmpdata ) {
        case SE1:   //illegal state
            usb_task_state = USB_DETACHED_SUBSTATE_ILLEGAL;
            break;
        case SE0:   //disconnected
            if(( usb_task_state & USB_STATE_MASK ) != USB_STATE_DETACHED ) {
                usb_task_state = USB_DETACHED_SUBSTATE_INITIALIZE;
            }
            break;
        case FSHOST:    //attached
        case LSHOST:
            if(( usb_task_state & USB_STATE_MASK ) == USB_STATE_DETACHED ) {
                delay = millis() + USB_SETTLE_DELAY;
                usb_task_state = USB_ATTACHED_SUBSTATE_SETTLE;
            }
            break;
        }// switch( tmpdata
    //Serial.print("USB task state: ");
    //Serial.println( usb_task_state, HEX );
    switch( usb_task_state ) {
        case USB_DETACHED_SUBSTATE_INITIALIZE:
            init();
            usb_task_state = USB_DETACHED_SUBSTATE_WAIT_FOR_DEVICE;
            break;
        case USB_DETACHED_SUBSTATE_WAIT_FOR_DEVICE:     //just sit here
            break;
        case USB_DETACHED_SUBSTATE_ILLEGAL:             //just sit here
            break;
        case USB_ATTACHED_SUBSTATE_SETTLE:              //setlle time for just attached device                  
            if( delay < millis() ) {
                usb_task_state = USB_ATTACHED_SUBSTATE_RESET_DEVICE;
            }
            break;
        case USB_ATTACHED_SUBSTATE_RESET_DEVICE:
            regWr( rHCTL, bmBUSRST );                   //issue bus reset
            usb_task_state = USB_ATTACHED_SUBSTATE_WAIT_RESET_COMPLETE;
            break;
        case USB_ATTACHED_SUBSTATE_WAIT_RESET_COMPLETE:
            if(( regRd( rHCTL ) & bmBUSRST ) == 0 ) {
                tmpdata = regRd( rMODE ) | bmSOFKAENAB;                 //start SOF generation
                regWr( rMODE, tmpdata );
//                  regWr( rMODE, bmSOFKAENAB );
                usb_task_state = USB_ATTACHED_SUBSTATE_WAIT_SOF;
                delay = millis() + 20; //20ms wait after reset per USB spec
            }
            break;
        case USB_ATTACHED_SUBSTATE_WAIT_SOF:  //todo: change check order
            if( regRd( rHIRQ ) & bmFRAMEIRQ ) {                         //when first SOF received we can continue
              if( delay < millis() ) {                                    //20ms passed
                usb_task_state = USB_ATTACHED_SUBSTATE_GET_DEVICE_DESCRIPTOR_SIZE;
              }
            }
            break;
        case USB_ATTACHED_SUBSTATE_GET_DEVICE_DESCRIPTOR_SIZE:
            // toggle( BPNT_0 );
            devtable[ 0 ].epinfo->MaxPktSize = 8;   //set max.packet size to min.allowed
            rcode = getDevDescr( 0, 0, 8, ( char* )&buf );
            if( rcode == 0 ) {
                devtable[ 0 ].epinfo->MaxPktSize = buf.bMaxPacketSize0;
                usb_task_state = USB_STATE_ADDRESSING;
            }
            else {
                usb_error = USB_ATTACHED_SUBSTATE_GET_DEVICE_DESCRIPTOR_SIZE;
                usb_task_state = USB_STATE_ERROR;
            }
            break;
        case USB_STATE_ADDRESSING:
            for( i = 1; i < USB_NUMDEVICES; i++ ) {
                if( devtable[ i ].epinfo == NULL ) {
                    devtable[ i ].epinfo = devtable[ 0 ].epinfo;        //set correct MaxPktSize
                                                                        //temporary record
                                                                        //until plugged with real device endpoint structure
                    rcode = setAddr( 0, 0, i );
                    if( rcode == 0 ) {
                        tmpaddr = i;
                        usb_task_state = USB_STATE_CONFIGURING;
                    }
                    else {
                        usb_error = USB_STATE_ADDRESSING;          //set address error
                        usb_task_state = USB_STATE_ERROR;
                    }
                    break;  //break if address assigned or error occured during address assignment attempt                      
                }
            }//for( i = 1; i < USB_NUMDEVICES; i++
            if( usb_task_state == USB_STATE_ADDRESSING ) {     //no vacant place in devtable
                usb_error = 0xfe;
                usb_task_state = USB_STATE_ERROR;
            }
            break;
        case USB_STATE_CONFIGURING:
            break;
        case USB_STATE_RUNNING:
            break;
        case USB_STATE_ERROR:
            break;
    }// switch( usb_task_state
}    
  
