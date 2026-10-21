# VCI-380 hardware test mapping

Not a DJ mapping: a tool to check the controller (every light, every input)
and to look for MIDI codes that the DJ mapping doesn't use yet.

## Install

Copy `Vestax VCI-380 hwtest.midi.xml` and `Vestax-VCI-380-hwtest-scripts.js`
to the Mixxx controllers folder (see the main README), then select
**Vestax VCI-380 (hardware test)** for the controller in the preferences.

Start Mixxx with `mixxx --controller-debug` to see the test messages in the
terminal (lines starting with `VCI-380 test:`).

## Tests

The MODE buttons of the **left** deck select the test. Test 1 starts at launch.

| Select | Test |
|---|---|
| MODE 1 | All lights on: every LED (normal and shift instance), all pads white, both wheel rings |
| MODE 2 | LEDs one by one: each pad selects an LED, which blinks alternately left / right. Left pads 1-8: SHIFT, SYNC, CUE, PLAY, VINYL, RANGE, PADFX, JOGSCROLL. Right pads 1-5: AREA, VIEW, SORT, BACK, FWD |
| MODE 3 | Pad colours: left pads select a bright colour, right pads a dimmed one; all 16 pads take it |
| MODE 4 | Inputs: every fader, knob, encoder, touch strip and jog wheel moves the ring of its deck; every button lights the pads of its deck while held (white, magenta with SHIFT); a pad lights itself. All 128 notes and CCs of channels 7-10 are bound, so codes unknown to the DJ mapping are logged as `UNKNOWN` |
| SHIFT + MODE 1 | Output scan: sends one chosen message at a time, to find hidden outputs (e.g. switching a ring off) |

### Output scan (SHIFT + left MODE 1)

| Left deck control | Action |
|---|---|
| FX SELECT encoder | MIDI number -1 / +1 (with SHIFT: -16 / +16) |
| PAD FX encoder | status byte: B7 B8 B9 BA 97 98 99 9A |
| Pads 1-7 | send the message with value 00, 01, 3F, 40, 41, 7E or 7F |
| Pad 8 | put both rings back in the middle (B7/B8 03 40) |

Only notes and control changes are sent, never SysEx.

## Codes from other mappings

Some names in the log come from the Serato Scratch Live and Traktor (DJ
TechTools) mappings of the VCI-380, for codes the Mixxx mapping doesn't use:
CC `0x3C`, `0x56`, `0x58` and `0x5B`. Their meaning still has to be confirmed
on the hardware.

Tested: the LOAD (headphone cue) and FX ON LEDs are toggled by the hardware
and can't be driven by MIDI, although some Traktor mappings send notes
`0x0A` and `0x1C` to them.
