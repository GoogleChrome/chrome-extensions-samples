# not required for ChromeOS. May be required for other operational systems, like Linux or Mac
import usb

dev = usb.core.find(idVendor=0x0922, idProduct=0x0020)

dev.detach_kernel_driver(0)

