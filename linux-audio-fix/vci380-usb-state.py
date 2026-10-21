#!/usr/bin/env python3
"""Read (never write) the USB Audio 2.0 state of the Vestax VCI-380.

    sudo python3 vci380-usb-state.py > state-cold.txt        # just after power on
    (use the controller with Windows, plug it back without switching it off)
    sudo python3 vci380-usb-state.py > state-windows.txt
    diff state-cold.txt state-windows.txt

Quit Mixxx (and anything using the sound card) first: the script unbinds the
Linux sound driver from the controller for a moment, then binds it again.
Needs python3-usb (sudo apt install python3-usb).

Only GET requests are sent: names, clock rate and validity, clock selector,
extension unit "enable" switches, mute and volume of the feature units.
"""
import usb.core
import usb.util

VID, PID = 0x1AA1, 0x0240
AC_IF = 0                      # AudioControl interface
CLOCK_SOURCE, CLOCK_SELECTOR = 41, 40
EXTENSION_UNITS = (50, 51, 52)
FEATURE_UNITS = {10: ("playback", 4), 11: ("capture", 8)}   # unit: (path, channels)
GET = 0xA1                     # device-to-host, class, interface
CUR, RANGE = 0x01, 0x02

dev = usb.core.find(idVendor=VID, idProduct=PID)
if dev is None:
    raise SystemExit("VCI-380 not found")


def get(request, selector, channel, unit, length):
    try:
        data = dev.ctrl_transfer(GET, request, (selector << 8) | channel,
                                 (unit << 8) | AC_IF, length, timeout=1000)
        return bytes(data)
    except usb.core.USBError as error:
        return f"error ({error})"


def as_int(data, signed=False):
    if isinstance(data, str):
        return data
    return int.from_bytes(data, "little", signed=signed)


# 1. string descriptors: names of the channels, clock, terminals...
print("== strings")
for index in range(1, 64):
    try:
        text = usb.util.get_string(dev, index)
    except (usb.core.USBError, ValueError):
        continue
    if text:
        print(f"  {index:2d} {text}")

detached = False
try:
    if dev.is_kernel_driver_active(AC_IF):
        dev.detach_kernel_driver(AC_IF)
        detached = True
    usb.util.claim_interface(dev, AC_IF)

    print("== clock")
    print("  frequency", as_int(get(CUR, 0x01, 0, CLOCK_SOURCE, 4)), "Hz")
    rng = get(RANGE, 0x01, 0, CLOCK_SOURCE, 14)
    if not isinstance(rng, str) and len(rng) >= 14:
        print(f"  range     {as_int(rng[2:6])}..{as_int(rng[6:10])} step {as_int(rng[10:14])}")
    else:
        print("  range    ", rng)
    print("  valid    ", as_int(get(CUR, 0x02, 0, CLOCK_SOURCE, 1)))
    print("  selector ", as_int(get(CUR, 0x01, 0, CLOCK_SELECTOR, 1)))

    print("== extension units (enable)")
    for unit in EXTENSION_UNITS:
        print(f"  unit {unit}:", as_int(get(CUR, 0x01, 0, unit, 1)))

    print("== feature units (channel 0 = master)")
    for unit, (path, channels) in FEATURE_UNITS.items():
        for ch in range(channels + 1):
            mute = as_int(get(CUR, 0x01, ch, unit, 1))
            vol = as_int(get(CUR, 0x02, ch, unit, 2), signed=True)
            vol = f"{vol / 256:.2f} dB" if isinstance(vol, int) else vol
            print(f"  unit {unit} {path} ch{ch}: mute {mute}, volume {vol}")
finally:
    usb.util.release_interface(dev, AC_IF)
    usb.util.dispose_resources(dev)
    if detached:
        # libusb can't always re-attach snd-usb-audio: bind it through sysfs
        name = f"{dev.bus}-{'.'.join(map(str, dev.port_numbers))}:1.{AC_IF}"
        try:
            dev.attach_kernel_driver(AC_IF)
        except usb.core.USBError:
            try:
                with open("/sys/bus/usb/drivers/snd-usb-audio/bind", "w") as bind:
                    bind.write(name)
            except OSError as error:
                print(f"could not re-bind the sound driver ({error}): unplug and plug the controller")
