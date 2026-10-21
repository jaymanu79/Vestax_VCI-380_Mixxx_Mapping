# VCI-380 hardware test mapping

Not a DJ mapping: a tool to check the controller (every light, every input)
and to look for MIDI codes that the DJ mapping doesn't use yet.

## Install

Copy `Vestax VCI-380 hwtest.midi.xml` and `Vestax-VCI-380-hwtest-scripts.js`
to the Mixxx controllers folder, next to the DJ mapping (see the
[README](README.md)), then select
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
| MODE 4 | Inputs: every fader, knob, encoder, touch strip and jog wheel moves the ring of its deck; every button lights the pads of its deck while held (white, magenta with SHIFT); a pad lights itself. All 128 notes and CCs of channels 7-10 are bound, so codes unknown to the DJ mapping are logged as `UNKNOWN`. Entering the test sends a MIDI Identity Request: the controller answers and then reports the position of every control |
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

## State dump: MIDI Identity Request

The VCI-380 answers the standard MIDI Universal Identity Request
`F0 7E 7F 06 01 F7` with

    F0 7E 00 06 02  00 40 02  40 02  00 00  02 01 01 00  F7
                    maker     family model  version

(family `0x0240` is also the USB product ID) and then **sends the current
state of every control**: pad mode buttons, note `0x0B` on both decks (the
MIXER / PC switch of the channel, which mutes its external input: `7F` = MIXER,
input heard, `00` = PC, input muted; the sound card audio goes through in both), headphone CUE (`99/9A 0A`), FX ON (`97/98 1C`),
pitch, depth, gain, EQ, volume, crossfader and the centre knobs: `0x56` CF CURVE
(crossfader curve), `0x57` IF CURVE (input fader curve) and `0x58` headphone
CUE / MASTER mix (done by the hardware). The curve knobs don't change the
MIDI values sent by the crossfader and the faders. A mapping can send it in `init` to start in sync with the
hardware.
