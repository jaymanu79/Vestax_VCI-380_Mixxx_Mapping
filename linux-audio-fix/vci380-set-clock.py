#!/usr/bin/env python3
"""Make the Vestax VCI-380 audio inputs clean on Linux.

At power on, the controller reports 48000 Hz but only really configures its
clock when it receives a "set sample rate" request. The Windows driver always
sends it; Linux skips it because the rate already reads 48000, and the inputs
stutter (a click every ~90 samples). This script sends that single request,
then re-enumerates the USB device so that the Linux sound driver binds again.
The setting lasts until the controller is switched off.

    sudo python3 vci380-set-clock.py

Quit Mixxx (and anything using the sound card) first.
Needs python3-usb (sudo apt install python3-usb).
To run it automatically when the controller is plugged in, see
99-vestax-vci380.rules.
"""
import os
import sys
import time

import usb.core
import usb.util

VID, PID = 0x1AA1, 0x0240
AC_IF = 0                   # AudioControl interface
CLOCK_SOURCE = 41           # "Vestax Internal Clock"
RATE = 48000
DRIVER = "/sys/bus/usb/drivers/snd-usb-audio"

STAMP = "/run/vci380-set-clock.stamp"
if "--wait" in sys.argv:    # started by udev
    # the USB reset below may look like a new plug-in: don't loop
    if os.path.exists(STAMP) and time.time() - os.path.getmtime(STAMP) < 30:
        raise SystemExit(0)
    time.sleep(3)           # let the sound driver bind first
    open(STAMP, "w").close()

dev = usb.core.find(idVendor=VID, idProduct=PID)
if dev is None:
    raise SystemExit("VCI-380 not found")
iface = f"{dev.bus}-{'.'.join(map(str, dev.port_numbers))}:1.{AC_IF}"

# 1. free the AudioControl interface from the Linux sound driver
if os.path.exists(f"{DRIVER}/{iface}"):
    with open(f"{DRIVER}/unbind", "w") as f:
        f.write(iface)
    time.sleep(0.5)

# 2. SET_CUR, sampling frequency control of the clock source (USB Audio 2.0)
usb.util.claim_interface(dev, AC_IF)
try:
    dev.ctrl_transfer(0x21, 0x01, 0x01 << 8, (CLOCK_SOURCE << 8) | AC_IF,
                      RATE.to_bytes(4, "little"), timeout=1000)
    print(f"VCI-380 clock set to {RATE} Hz")
finally:
    usb.util.release_interface(dev, AC_IF)

# 3. re-enumerate the controller, like unplugging and plugging the cable (it
# stays powered and keeps its clock setting): all its drivers bind again
usb.util.dispose_resources(dev)
port = iface.split(":")[0]
with open(f"/sys/bus/usb/devices/{port}/authorized", "w") as f:
    f.write("0")
time.sleep(1)
with open(f"/sys/bus/usb/devices/{port}/authorized", "w") as f:
    f.write("1")
print("sound card restarted")
