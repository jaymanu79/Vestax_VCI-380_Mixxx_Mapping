# Linux: choppy audio inputs

## The problem

On Linux, the audio inputs of the VCI-380 (RCA inputs, microphones, master
mix) sound choppy: a block of samples is dropped or repeated every ~90
samples, about 140 times per second. The outputs work fine.

After using the controller on Windows and plugging it back into Linux without
switching it off, the inputs are clean.

## The cause

The controller is a USB Audio Class 2 device with a single internal clock,
48 kHz only. At power on it reports 48000 Hz, but it only configures its clock
when it receives a "set sample rate" request (`SET_CUR` on clock source 41).
The Windows driver always sends it. Linux reads the current rate first and,
since it already is 48000 Hz, never sends it.

## The fix

### 1. Kernel option (recent kernels)

Recent Linux kernels have a quirk flag, `always_set_rate`, that sends the
request anyway. Check whether your kernel has it:

```sh
modinfo -F filename snd-usb-audio
zstdcat "$(modinfo -F filename snd-usb-audio)" 2>/dev/null | strings | grep -x always_set_rate \
  || strings "$(modinfo -F filename snd-usb-audio)" | grep -x always_set_rate
```

If `always_set_rate` is printed, enable it for the VCI-380:

```sh
echo 'options snd-usb-audio quirk_flags=1aa1:0240:always_set_rate' | sudo tee /etc/modprobe.d/vestax-vci380.conf
```

then reboot (or reload `snd-usb-audio`). Nothing else is needed.

A patch adding the flag to the kernel's own list of quirks for this device is
in `0001-ALSA-usb-audio-Add-always-set-rate-quirk-for-Vestax-.patch`.

### 2. Script (any kernel)

`vci380-set-clock.py` sends the request itself, then re-enumerates the device
so that the sound driver binds again. The setting lasts until the controller
is switched off. The udev rule runs it each time the controller is plugged in
or switched on.

```sh
sudo apt install python3-usb
sudo install -m 755 vci380-set-clock.py /usr/local/bin/vci380-set-clock
sudo install -m 644 99-vestax-vci380.rules /etc/udev/rules.d/
sudo udevadm control --reload
```

The sound card disappears for a second about 5 seconds after the controller
is switched on: switch the controller on, wait a few seconds, then start
Mixxx (or rescan the devices in the sound preferences).

Its log: `journalctl -b -u vci380-set-clock`.

## Diagnostic tools

- `vci380-usb-state.py`: reads (never writes) the USB Audio state of the
  controller: channel names, clock, extension units, mute and volume.
- `vci380-inputs.py`: level of the 8 capture channels, second by second, and
  count of dropouts, from a recording made with
  `arecord -D hw:VCI380,0 -f S32_LE -r 48000 -c 8 -d 10 in.wav`.

## Channels

| Capture | Name in the device | Playback | Name in the device |
|---|---|---|---|
| 1 - 2 | Analogue In 1 L / R | 1 - 2 | Master Out L / R |
| 3 - 4 | Analogue In 2 L / R | 3 - 4 | PFL Out L / R |
| 5 | Mic 1 In | | |
| 6 | Mic 2 In | | |
| 7 - 8 | Master Mix L / R | | |
