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

/* USB chapter 9 structures */
#ifndef _ch9_h_
#define _ch9_h_

/* Misc.USB constants */
#define DEV_DESCR_LEN   18      //device descriptor length
#define CONF_DESCR_LEN  9       //configuration descriptor length
#define INTR_DESCR_LEN  9       //interface descriptor length
#define EP_DESCR_LEN    7       //endpoint descriptor length

/* Standard Device Requests */

#define USB_REQUEST_GET_STATUS                  0       // Standard Device Request - GET STATUS
#define USB_REQUEST_CLEAR_FEATURE               1       // Standard Device Request - CLEAR FEATURE
#define USB_REQUEST_SET_FEATURE                 3       // Standard Device Request - SET FEATURE
#define USB_REQUEST_SET_ADDRESS                 5       // Standard Device Request - SET ADDRESS
#define USB_REQUEST_GET_DESCRIPTOR              6       // Standard Device Request - GET DESCRIPTOR
#define USB_REQUEST_SET_DESCRIPTOR              7       // Standard Device Request - SET DESCRIPTOR
#define USB_REQUEST_GET_CONFIGURATION           8       // Standard Device Request - GET CONFIGURATION
#define USB_REQUEST_SET_CONFIGURATION           9       // Standard Device Request - SET CONFIGURATION
#define USB_REQUEST_GET_INTERFACE               10      // Standard Device Request - GET INTERFACE
#define USB_REQUEST_SET_INTERFACE               11      // Standard Device Request - SET INTERFACE
#define USB_REQUEST_SYNCH_FRAME                 12      // Standard Device Request - SYNCH FRAME

#define USB_FEATURE_ENDPOINT_HALT               0       // CLEAR/SET FEATURE - Endpoint Halt
#define USB_FEATURE_DEVICE_REMOTE_WAKEUP        1       // CLEAR/SET FEATURE - Device remote wake-up
#define USB_FEATURE_TEST_MODE                   2       // CLEAR/SET FEATURE - Test mode

/* Setup Data Constants */

#define USB_SETUP_HOST_TO_DEVICE                0x00    // Device Request bmRequestType transfer direction - host to device transfer
#define USB_SETUP_DEVICE_TO_HOST                0x80    // Device Request bmRequestType transfer direction - device to host transfer
#define USB_SETUP_TYPE_STANDARD                 0x00    // Device Request bmRequestType type - standard
#define USB_SETUP_TYPE_CLASS                    0x20    // Device Request bmRequestType type - class
#define USB_SETUP_TYPE_VENDOR                   0x40    // Device Request bmRequestType type - vendor
#define USB_SETUP_RECIPIENT_DEVICE              0x00    // Device Request bmRequestType recipient - device
#define USB_SETUP_RECIPIENT_INTERFACE           0x01    // Device Request bmRequestType recipient - interface
#define USB_SETUP_RECIPIENT_ENDPOINT            0x02    // Device Request bmRequestType recipient - endpoint
#define USB_SETUP_RECIPIENT_OTHER               0x03    // Device Request bmRequestType recipient - other

/* USB descriptors  */

#define USB_DESCRIPTOR_DEVICE           0x01    // bDescriptorType for a Device Descriptor.
#define USB_DESCRIPTOR_CONFIGURATION    0x02    // bDescriptorType for a Configuration Descriptor.
#define USB_DESCRIPTOR_STRING           0x03    // bDescriptorType for a String Descriptor.
#define USB_DESCRIPTOR_INTERFACE        0x04    // bDescriptorType for an Interface Descriptor.
#define USB_DESCRIPTOR_ENDPOINT         0x05    // bDescriptorType for an Endpoint Descriptor.
#define USB_DESCRIPTOR_DEVICE_QUALIFIER 0x06    // bDescriptorType for a Device Qualifier.
#define USB_DESCRIPTOR_OTHER_SPEED      0x07    // bDescriptorType for a Other Speed Configuration.
#define USB_DESCRIPTOR_INTERFACE_POWER  0x08    // bDescriptorType for Interface Power.
#define USB_DESCRIPTOR_OTG              0x09    // bDescriptorType for an OTG Descriptor.

/* OTG SET FEATURE Constants    */
#define OTG_FEATURE_B_HNP_ENABLE                3       // SET FEATURE OTG - Enable B device to perform HNP
#define OTG_FEATURE_A_HNP_SUPPORT               4       // SET FEATURE OTG - A device supports HNP
#define OTG_FEATURE_A_ALT_HNP_SUPPORT           5       // SET FEATURE OTG - Another port on the A device supports HNP

/* USB Endpoint Transfer Types  */
#define USB_TRANSFER_TYPE_CONTROL               0x00    // Endpoint is a control endpoint.
#define USB_TRANSFER_TYPE_ISOCHRONOUS           0x01    // Endpoint is an isochronous endpoint.
#define USB_TRANSFER_TYPE_BULK                  0x02    // Endpoint is a bulk endpoint.
#define USB_TRANSFER_TYPE_INTERRUPT             0x03    // Endpoint is an interrupt endpoint.
#define bmUSB_TRANSFER_TYPE                     0x03    // bit mask to separate transfer type from ISO attributes


/* Standard Feature Selectors for CLEAR_FEATURE Requests    */
#define USB_FEATURE_ENDPOINT_STALL              0       // Endpoint recipient
#define USB_FEATURE_DEVICE_REMOTE_WAKEUP        1       // Device recipient
#define USB_FEATURE_TEST_MODE                   2       // Device recipient

/* HID constants. Not part of chapter 9 */
/* Class-Specific Requests */
#define HID_REQUEST_GET_REPORT      0x01
#define HID_REQUEST_GET_IDLE        0x02
#define HID_REQUEST_GET_PROTOCOL    0x03
#define HID_REQUEST_SET_REPORT      0x09
#define HID_REQUEST_SET_IDLE        0x0A
#define HID_REQUEST_SET_PROTOCOL    0x0B

/* Class Descriptor Types */
#define HID_DESCRIPTOR_HID      0x21
#define HID_DESCRIPTOR_REPORT   0x22
#define HID_DESRIPTOR_PHY       0x23

/* Protocol Selection */
#define BOOT_PROTOCOL   0x00
#define RPT_PROTOCOL    0x01
/* HID Interface Class Code */
#define HID_INTF                    0x03
/* HID Interface Class SubClass Codes */
#define BOOT_INTF_SUBCLASS          0x01
/* HID Interface Class Protocol Codes */
#define HID_PROTOCOL_NONE           0x00
#define HID_PROTOCOL_KEYBOARD       0x01
#define HID_PROTOCOL_MOUSE          0x02


/* descriptor data structures */

/* Device descriptor structure */
typedef struct {
    byte bLength;               // Length of this descriptor.
    byte bDescriptorType;       // DEVICE descriptor type (USB_DESCRIPTOR_DEVICE).
    unsigned int bcdUSB;        // USB Spec Release Number (BCD).
    byte bDeviceClass;          // Class code (assigned by the USB-IF). 0xFF-Vendor specific.
    byte bDeviceSubClass;       // Subclass code (assigned by the USB-IF).
    byte bDeviceProtocol;       // Protocol code (assigned by the USB-IF). 0xFF-Vendor specific.
    byte bMaxPacketSize0;       // Maximum packet size for endpoint 0.
    unsigned int idVendor;      // Vendor ID (assigned by the USB-IF).
    unsigned int idProduct;     // Product ID (assigned by the manufacturer).
    unsigned int bcdDevice;      // Device release number (BCD).
    byte iManufacturer;         // Index of String Descriptor describing the manufacturer.
    byte iProduct;              // Index of String Descriptor describing the product.
    byte iSerialNumber;         // Index of String Descriptor with the device's serial number.
    byte bNumConfigurations;    // Number of possible configurations.
} USB_DEVICE_DESCRIPTOR;

/* Configuration descriptor structure */
typedef struct
{
    byte bLength;               // Length of this descriptor.
    byte bDescriptorType;       // CONFIGURATION descriptor type (USB_DESCRIPTOR_CONFIGURATION).
    unsigned int wTotalLength;          // Total length of all descriptors for this configuration.
    byte bNumInterfaces;        // Number of interfaces in this configuration.
    byte bConfigurationValue;   // Value of this configuration (1 based).
    byte iConfiguration;        // Index of String Descriptor describing the configuration.
    byte bmAttributes;          // Configuration characteristics.
    byte bMaxPower;             // Maximum power consumed by this configuration.
} USB_CONFIGURATION_DESCRIPTOR;

/* Interface descriptor structure */
typedef struct
{
    byte bLength;               // Length of this descriptor.
    byte bDescriptorType;       // INTERFACE descriptor type (USB_DESCRIPTOR_INTERFACE).
    byte bInterfaceNumber;      // Number of this interface (0 based).
    byte bAlternateSetting;     // Value of this alternate interface setting.
    byte bNumEndpoints;         // Number of endpoints in this interface.
    byte bInterfaceClass;       // Class code (assigned by the USB-IF).  0xFF-Vendor specific.
    byte bInterfaceSubClass;    // Subclass code (assigned by the USB-IF).
    byte bInterfaceProtocol;    // Protocol code (assigned by the USB-IF).  0xFF-Vendor specific.
    byte iInterface;            // Index of String Descriptor describing the interface.
} USB_INTERFACE_DESCRIPTOR;

/* Endpoint descriptor structure */
typedef struct
{
    byte bLength;               // Length of this descriptor.
    byte bDescriptorType;       // ENDPOINT descriptor type (USB_DESCRIPTOR_ENDPOINT).
    byte bEndpointAddress;      // Endpoint address. Bit 7 indicates direction (0=OUT, 1=IN).
    byte bmAttributes;          // Endpoint transfer type.
    unsigned int wMaxPacketSize;        // Maximum packet size.
    byte bInterval;             // Polling interval in frames.
} USB_ENDPOINT_DESCRIPTOR;

/* HID descriptor */
typedef struct {
    byte bLength;                       
        byte bDescriptorType;   
        unsigned int bcdHID;                    
    byte bCountryCode;          
        byte bNumDescriptors;
        byte bDescrType;                        
    unsigned int wDescriptorLength;
} USB_HID_DESCRIPTOR;

#endif // _ch9_h_
