#!/usr/bin/env python3
"""Show the level of the 8 capture channels of the Vestax VCI-380, second by second.

Record first (10 s, all 8 channels), playing a source into one input at a time:
    arecord -D hw:VCI380,0 -f S32_LE -r 48000 -c 8 -d 10 vci380-in.wav
then:
    python3 vci380-inputs.py vci380-in.wav

Each line is one second, each column one capture channel, in dBFS
(-inf = silence). The column that moves is the channel of the input you played.
Dropouts (sudden runs of exact zeros inside a signal) are counted at the end.
"""
import array
import math
import sys
import wave

path = sys.argv[1] if len(sys.argv) > 1 else "vci380-in.wav"
with wave.open(path, "rb") as w:
    channels, width, rate, frames = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
    if width != 4:
        sys.exit(f"expected 32-bit samples (arecord -f S32_LE), got {8 * width}-bit")
    data = array.array("i", w.readframes(frames))
if sys.byteorder == "big":
    data.byteswap()

full = 2.0 ** 31
print(f"{path}: {channels} channels, {rate} Hz, {frames / rate:.1f} s")
print("  s " + "".join(f"    ch{c + 1:<3}" for c in range(channels)))
zero_runs = [0] * channels
for start in range(0, frames, rate):
    end = min(start + rate, frames)
    row = []
    for c in range(channels):
        chunk = data[start * channels + c:end * channels:channels]
        peak = max((abs(v) for v in chunk), default=0)
        rms = math.sqrt(sum(float(v) * v for v in chunk) / max(len(chunk), 1))
        row.append(f"{20 * math.log10(rms / full):7.1f}  " if rms > 0 else "   -inf  ")
        # dropout: at least 2 ms of exact zeros while the channel carries a signal
        if peak > full * 0.01:
            run = 0
            for v in chunk:
                run = run + 1 if v == 0 else 0
                if run == rate // 500:
                    zero_runs[c] += 1
    print(f"{start // rate:3d} " + "".join(row))
print("dropouts (>= 2 ms of zeros inside a signal): " +
      "  ".join(f"ch{c + 1}={n}" for c, n in enumerate(zero_runs)))
