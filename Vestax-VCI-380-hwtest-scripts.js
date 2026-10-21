// Vestax VCI-380 hardware test mapping
//
// Not a DJ mapping: it checks the controller's lights and inputs and helps
// finding MIDI codes. Messages go to the Mixxx log (start Mixxx with
// --controller-debug to see them in the terminal).
//
// The MODE buttons of the LEFT deck choose the test:
//   mode 1  all lights on
//   mode 2  LED test: each pad selects one LED, which blinks left / right
//   mode 3  pad colours: each pad selects a colour shown on all 16 pads
//           (left pads: bright colours, right pads: dimmed colours)
//   mode 4  wheel LEDs and analog controls: every fader, knob, encoder,
//           touch strip and jog wheel moves the LED ring of its deck, and its
//           name and value are logged; every button lights the pads of
//           its deck while held (white, or magenta with SHIFT) and a pad
//           lights itself. Every note and CC number is bound, so codes
//           unknown to the DJ mapping show up in the log as UNKNOWN.
//           Entering the test sends a MIDI Identity Request, to which the
//           controller answers with the position of every control
//   SHIFT + left mode 1: test 5, output scan (e.g. to find how to switch the
//           jog ring off): sends one chosen message at a time
//             left FX SELECT encoder  number -1 / +1 (shift: -16 / +16)
//             left PAD FX encoder     status: B7 B8 B9 BA 97 98 99 9A
//             left pads 1-8           send value 00 01 3F 40 41 7E 7F, pad 8
//                                     restores the ring (B7/B8 03 40)

// eslint-disable-next-line no-var
var VCI380Test = {};

// --------------------------------------------------------------- hardware
// LED note numbers, same table as the DJ mapping. Sent on channel 0x97 (left)
// or 0x98 (right); 0x99 / 0x9A address the "shift" instance of the same LED.
// Browser LEDs (AREA, VIEW, SORT, BACK, FWD, JOGSCROLL) exist on the left
// channel only.
VCI380Test.LED = [
    {name: "SHIFT", note: 0x0C},
    {name: "SYNC", note: 0x13},
    {name: "CUE", note: 0x16},
    {name: "PLAY", note: 0x17},
    {name: "VINYL", note: 0x1A},
    {name: "RANGE", note: 0x1B},
    {name: "PADFX", note: 0x1D},
    {name: "JOGSCROLL", note: 0x09},
    {name: "AREA", note: 0x50},
    {name: "VIEW", note: 0x51},
    {name: "SORT", note: 0x52},
    {name: "BACK", note: 0x53},
    {name: "FWD", note: 0x4F},
];
// Not in the table: the LOAD (headphone cue) and FX ON LEDs are toggled by the
// hardware itself and ignore MIDI (0x0A and 0x1C, tested), although some
// Traktor mappings send them.

// Pad colours: binary RGB, bright (0x_8) or dimmed (0x_0)
VCI380Test.BRIGHT = [
    {name: "BLUE", value: 0x18},
    {name: "GREEN", value: 0x28},
    {name: "CYAN", value: 0x38},
    {name: "RED", value: 0x48},
    {name: "MAGENTA", value: 0x58},
    {name: "YELLOW", value: 0x68},
    {name: "WHITE", value: 0x78},
    {name: "OFF", value: 0x00},
];
VCI380Test.DIMMED = [
    {name: "dimBLUE", value: 0x10},
    {name: "dimGREEN", value: 0x20},
    {name: "dimCYAN", value: 0x30},
    {name: "dimRED", value: 0x40},
    {name: "dimMAGENTA", value: 0x50},
    {name: "dimYELLOW", value: 0x60},
    {name: "dimWHITE", value: 0x70},
    {name: "OFF", value: 0x00},
];

// Buttons (notes on 0x97 left / 0x98 right, 0x99 / 0x9A with SHIFT)
VCI380Test.BUTTON = {
    0x06: "FX SELECT push",
    0x09: "JOG SCROLL",
    0x0B: "MIXER / PC switch = input mute (7F = MIXER, input heard; 00 = PC, input muted)",
    0x0A: "LOAD (with SHIFT: headphone CUE state)",
    0x0C: "SHIFT",
    0x13: "SYNC",
    0x16: "CUE",
    0x17: "PLAY",
    0x1A: "VINYL",
    0x1B: "RANGE",
    0x1C: "FX ON (hardware toggle state)",
    0x1D: "PAD FX push",
    0x38: "MODE 1 (HOT CUE)",
    0x39: "MODE 2",
    0x3A: "MODE 3",
    0x3B: "MODE 4",
    0x44: "JOG WHEEL touch",
    0x4F: "FWD",
    0x50: "AREA",
    0x51: "VIEW",
    0x52: "SORT",
    0x53: "BACK",
    0x54: "BROWSE push",
};

// MIDI Universal Identity Request: the VCI-380 answers with its identity
// (F0 7E 00 06 02 00 40 02 40 02 00 00 02 01 01 00 F7) and then sends the
// current state of every fader, knob and switch
VCI380Test.IDENTITY_REQUEST = [0xF0, 0x7E, 0x7F, 0x06, 0x01, 0xF7];

VCI380Test.FIRST_PAD = 0x3C;      // pads 1-8 are notes 0x3C-0x43
VCI380Test.FIRST_MODE = 0x38;     // MODE buttons 1-4 are notes 0x38-0x3B
VCI380Test.WHEEL_LED_CC = 0x03;   // on 0xB7 (left) / 0xB8 (right), value 0-127

// Continuous controls (CC on 0xB7 left / 0xB8 right, 0xB9 / 0xBA with SHIFT).
// "abs": absolute 0-127, shown as is on the ring
// "rel": encoder, 0x01 = +1, 0x7F = -1 (two's complement), ring moves a step
// "jog": jog wheel, 0x40 = no move (value - 64), ring moves with it
// The pitch faders are 14-bit: MSB on 0x0D (used here), LSB on 0x2D (ignored).
VCI380Test.CC = {
    0x07: {name: "VOLUME fader", kind: "abs"},
    0x08: {name: "CROSSFADER", kind: "abs"},
    0x09: {name: "GAIN knob", kind: "abs"},
    0x0A: {name: "FX DEPTH knob", kind: "abs"},
    0x0D: {name: "PITCH fader", kind: "abs"},
    0x46: {name: "EQ LOW knob", kind: "abs"},
    0x47: {name: "EQ MID knob", kind: "abs"},
    0x48: {name: "EQ HIGH knob", kind: "abs"},
    0x38: {name: "TOUCH STRIP (mode 1)", kind: "abs"},
    0x39: {name: "TOUCH STRIP (mode 2)", kind: "abs"},
    0x3A: {name: "TOUCH STRIP (mode 3)", kind: "abs"},
    0x3B: {name: "TOUCH STRIP (mode 4)", kind: "abs"},
    0x06: {name: "FX SELECT encoder", kind: "rel"},
    0x0E: {name: "PAD FX encoder", kind: "rel"},
    0x55: {name: "BROWSE encoder", kind: "rel"},
    0x45: {name: "JOG WHEEL", kind: "jog"},
    // seen in the Serato Scratch Live mapping, unknown to the Mixxx mapping:
    0x3C: {name: "PAD 1 pressure? (Serato: Sample Player Gain)", kind: "abs"},
    0x5B: {name: "0x5B (Serato: Effect Master Knob 1, Yoi: FX Knob 2 = pad pressure?)", kind: "abs"},
    0x56: {name: "CF CURVE knob (crossfader curve)", kind: "abs"},
    0x57: {name: "IF CURVE knob (input fader curve)", kind: "abs"},
    0x58: {name: "headphone CUE / MASTER mix knob", kind: "abs"},
};
VCI380Test.BLINK_MS = 300;
VCI380Test.SELECTED = 0x78;       // colour of the selected pad (white)

// ------------------------------------------------------------------ state
VCI380Test.test = 0;              // current test (1-4)
VCI380Test.timer = 0;             // blink timer of test 2
VCI380Test.blinkLED = null;       // LED blinking in test 2
VCI380Test.blinkPhase = false;
VCI380Test.wheel = [-1, -1];      // last wheel LED value sent, per deck
VCI380Test.ring = [0, 0];         // ring position moved by encoders and jogs
VCI380Test.SCAN_STATUS = [0xB7, 0xB8, 0xB9, 0xBA, 0x97, 0x98, 0x99, 0x9A];
VCI380Test.SCAN_VALUE = [0x00, 0x01, 0x3F, 0x40, 0x41, 0x7E, 0x7F];
VCI380Test.scan = {status: 0, number: 0};   // index in SCAN_STATUS, MIDI number

VCI380Test.log = function(text) {
    console.log(`VCI-380 test: ${text}`);
};

VCI380Test.hex = function(n) {
    return `0x${(`0${n.toString(16).toUpperCase()}`).slice(-2)}`;
};

// deck (1 left, 2 right) of an incoming message; shift channels 0x09/0x0A
// are the same decks
VCI380Test.deckOf = function(channel) {
    return channel % 2 === 1 ? 1 : 2;
};

// ---------------------------------------------------------------- outputs
VCI380Test.setLED = function(channelOffset, note, on) {
    midi.sendShortMsg(0x96 + channelOffset, note, on ? 0x7F : 0x00);
};

// every instance of every LED: left, right, shift-left, shift-right
VCI380Test.setAllLEDs = function(on) {
    VCI380Test.LED.forEach(function(led) {
        for (let ch = 1; ch <= 4; ch++) {
            VCI380Test.setLED(ch, led.note, on);
        }
    });
};

VCI380Test.setPad = function(deck, pad, color) {
    midi.sendShortMsg(0x96 + deck, VCI380Test.FIRST_PAD + pad - 1, color);
};

VCI380Test.setAllPads = function(color) {
    for (let pad = 1; pad <= 8; pad++) {
        VCI380Test.setPad(1, pad, color);
        VCI380Test.setPad(2, pad, color);
    }
};

// lights only the selected pad (deck, pad), all other pads off
VCI380Test.showSelectedPad = function(deck, pad) {
    VCI380Test.setAllPads(0x00);
    VCI380Test.setPad(deck, pad, VCI380Test.SELECTED);
};

VCI380Test.setWheel = function(deck, value) {
    if (VCI380Test.wheel[deck - 1] !== value) {
        midi.sendShortMsg(0xB6 + deck, VCI380Test.WHEEL_LED_CC, value);
        VCI380Test.wheel[deck - 1] = value;
    }
};

VCI380Test.stopBlink = function() {
    if (VCI380Test.timer !== 0) {
        engine.stopTimer(VCI380Test.timer);
        VCI380Test.timer = 0;
    }
    VCI380Test.blinkLED = null;
};

VCI380Test.allOff = function() {
    VCI380Test.stopBlink();
    VCI380Test.setAllLEDs(false);
    VCI380Test.setAllPads(0x00);
};

// ------------------------------------------------------------------ tests
VCI380Test.startTest = function(test) {
    VCI380Test.allOff();
    VCI380Test.test = test;
    switch (test) {
    case 1:
        VCI380Test.log("test 1, all lights on");
        VCI380Test.setAllLEDs(true);
        VCI380Test.setAllPads(0x78);
        VCI380Test.wheel = [-1, -1];
        VCI380Test.setWheel(1, 0x7F);
        VCI380Test.setWheel(2, 0x7F);
        break;
    case 2:
        VCI380Test.log(`test 2, LEDs: press a pad (left pads 1-8, right pads 1-${VCI380Test.LED.length - 8})`);
        break;
    case 3:
        VCI380Test.log("test 3, pad colours: left pads bright, right pads dimmed");
        break;
    case 4:
        VCI380Test.log("test 4, inputs: move any fader, knob, encoder, strip or jog (ring), press any button (pads)");
        VCI380Test.wheel = [-1, -1];
        VCI380Test.ring = [0, 0];
        VCI380Test.log("asking the controller for the state of all its controls");
        midi.sendSysexMsg(VCI380Test.IDENTITY_REQUEST, VCI380Test.IDENTITY_REQUEST.length);
        break;
    case 5:
        VCI380Test.log("test 5, output scan: FX SELECT = number, PAD FX = status, pads 1-7 = value, pad 8 = ring back");
        VCI380Test.restoreRings();
        VCI380Test.showScan();
        break;
    }
};

// ------------------------------------------------------------- test 5
VCI380Test.restoreRings = function() {
    midi.sendShortMsg(0xB7, VCI380Test.WHEEL_LED_CC, 0x40);
    midi.sendShortMsg(0xB8, VCI380Test.WHEEL_LED_CC, 0x40);
    VCI380Test.wheel = [0x40, 0x40];
};

VCI380Test.showScan = function() {
    const st = VCI380Test.SCAN_STATUS[VCI380Test.scan.status];
    VCI380Test.log(`scan target: ${VCI380Test.hex(st)} ${VCI380Test.hex(VCI380Test.scan.number)}`);
};

VCI380Test.scanEncoder = function(channel, control, value) {
    const step = value >= 64 ? -1 : 1;
    if (control === 0x06) {           // FX SELECT: MIDI number
        const big = channel >= 9 ? 16 : 1;
        VCI380Test.scan.number = ((VCI380Test.scan.number + step * big) % 128 + 128) % 128;
    } else if (control === 0x0E) {    // PAD FX: status byte
        const n = VCI380Test.SCAN_STATUS.length;
        VCI380Test.scan.status = ((VCI380Test.scan.status + step) % n + n) % n;
    } else {
        return;
    }
    VCI380Test.showScan();
};

VCI380Test.scanSend = function(pad) {
    if (pad === 8) {
        VCI380Test.restoreRings();
        VCI380Test.log("rings restored (B7/B8 03 40)");
        return;
    }
    const st = VCI380Test.SCAN_STATUS[VCI380Test.scan.status];
    const value = VCI380Test.SCAN_VALUE[pad - 1];
    midi.sendShortMsg(st, VCI380Test.scan.number, value);
    VCI380Test.log(`sent ${VCI380Test.hex(st)} ${VCI380Test.hex(VCI380Test.scan.number)} ${VCI380Test.hex(value)}`);
};

// test 2: alternate the LED between the left and the right deck
VCI380Test.blink = function() {
    const led = VCI380Test.blinkLED;
    if (led === null) {
        return;
    }
    VCI380Test.blinkPhase = !VCI380Test.blinkPhase;
    VCI380Test.setLED(1, led.note, VCI380Test.blinkPhase);
    VCI380Test.setLED(2, led.note, !VCI380Test.blinkPhase);
};

VCI380Test.selectLED = function(deck, pad) {
    const index = (deck - 1) * 8 + pad - 1;
    VCI380Test.stopBlink();
    VCI380Test.setAllLEDs(false);
    VCI380Test.showSelectedPad(deck, pad);
    const led = VCI380Test.LED[index];
    if (led === undefined) {
        VCI380Test.log(`no LED on ${deck === 1 ? "left" : "right"} pad ${pad}`);
        return;
    }
    VCI380Test.log(`LED ${led.name} (note ${VCI380Test.hex(led.note)})`);
    VCI380Test.blinkLED = led;
    VCI380Test.blinkPhase = false;
    VCI380Test.blink();
    VCI380Test.timer = engine.beginTimer(VCI380Test.BLINK_MS, VCI380Test.blink);
};

VCI380Test.selectColor = function(deck, pad) {
    const color = (deck === 1 ? VCI380Test.BRIGHT : VCI380Test.DIMMED)[pad - 1];
    VCI380Test.setAllPads(color.value);
    VCI380Test.log(`colour ${color.name} (${VCI380Test.hex(color.value)})`);
};

// ------------------------------------------------------- input callbacks
VCI380Test.onMode = function(channel, control, value, _status, _group) {
    if (channel === 0x09 && control === VCI380Test.FIRST_MODE) {   // SHIFT + left mode 1
        if (value !== 0) {
            VCI380Test.startTest(5);
        }
        return;
    }
    if (channel !== 0x07) {           // right deck or SHIFT: an ordinary button
        VCI380Test.onButton(channel, control, value);
        return;
    }
    const test = control - VCI380Test.FIRST_MODE + 1;
    // the state dump of test 4 repeats the active MODE button: ignore it, or the
    // test would restart and ask for the state again, endlessly
    if (value !== 0 && test !== VCI380Test.test) {
        VCI380Test.startTest(test);
    }
};

VCI380Test.onPad = function(channel, control, value, _status, _group) {
    const deck = VCI380Test.deckOf(channel);
    const pad = control - VCI380Test.FIRST_PAD + 1;
    if (VCI380Test.test === 4) {      // the pressed pad lights itself
        VCI380Test.setPad(deck, pad, value === 0 ? 0x00 : VCI380Test.pressColor(channel));
        VCI380Test.log(`${VCI380Test.side(channel)} PAD ${pad} ${VCI380Test.hex(control)}: ${value === 0 ? "released" : "pressed"}`);
        return;
    }
    if (value === 0) {
        return;
    }
    if (VCI380Test.test === 5) {
        if (deck === 1) {
            VCI380Test.scanSend(pad);
        }
        return;
    }
    if (VCI380Test.test === 2) {
        VCI380Test.selectLED(deck, pad);
    } else if (VCI380Test.test === 3) {
        VCI380Test.selectColor(deck, pad);
    }
};

VCI380Test.side = function(channel) {
    return `${VCI380Test.deckOf(channel) === 1 ? "left" : "right"}${channel >= 9 ? " (shift)" : ""}`;
};

// white for a plain press, magenta when the controller sends the SHIFT channel
VCI380Test.pressColor = function(channel) {
    return channel >= 9 ? 0x58 : 0x78;
};

// test 4: a held button lights all the pads of its deck
VCI380Test.onButton = function(channel, control, value, _status, _group) {
    if (VCI380Test.test !== 4) {
        return;
    }
    const deck = VCI380Test.deckOf(channel);
    const name = VCI380Test.BUTTON[control] || "UNKNOWN NOTE";
    for (let pad = 1; pad <= 8; pad++) {
        VCI380Test.setPad(deck, pad, value === 0 ? 0x00 : VCI380Test.pressColor(channel));
    }
    VCI380Test.log(`${VCI380Test.side(channel)} ${name} ${VCI380Test.hex(control)}: ${value === 0 ? "released" : "pressed"}`);
};

// test 4: every continuous control drives the ring of its deck
VCI380Test.onCC = function(channel, control, value, _status, _group) {
    if (VCI380Test.test === 5 && VCI380Test.deckOf(channel) === 1) {
        VCI380Test.scanEncoder(channel, control, value);
        return;
    }
    if (VCI380Test.test !== 4) {
        return;
    }
    const cc = VCI380Test.CC[control] || {name: "UNKNOWN CC", kind: "abs"};
    const deck = VCI380Test.deckOf(channel);
    const side = VCI380Test.side(channel);
    let ring;
    let text;
    if (cc.kind === "abs") {
        ring = value;
        text = `${value}`;
    } else {
        const step = cc.kind === "jog" ? value - 64 : (value >= 64 ? value - 128 : value);
        ring = ((VCI380Test.ring[deck - 1] + step) % 128 + 128) % 128;
        text = `${step > 0 ? "+" : ""}${step} (ring ${ring})`;
    }
    VCI380Test.ring[deck - 1] = ring;
    VCI380Test.log(`${side} ${cc.name} ${VCI380Test.hex(control)}: ${text}`);
    VCI380Test.setWheel(deck, ring);
};

// SysEx from the controller (the identity reply)
VCI380Test.incomingData = function(data, length) {
    if (length > 0 && data[0] === 0xF0) {
        const bytes = Array.prototype.slice.call(data, 0, length);
        VCI380Test.log(`SysEx: ${bytes.map(VCI380Test.hex).join(" ")}`);
    }
};

// ------------------------------------------------------------ life cycle
VCI380Test.init = function(_id, _debugging) {
    VCI380Test.startTest(1);
};

VCI380Test.shutdown = function() {
    VCI380Test.allOff();
};
