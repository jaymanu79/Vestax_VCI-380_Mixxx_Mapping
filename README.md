This mapping allows using the VESTAX VCI-380 controller with Mixxx DJ software.
I would appreciate any feedback, suggestions for changes or improvement.

# How to install
Copy the 2 files Vestax_VCI-380_MIDI_1.midi.xml and Vestax-VCI-380-scripts.js to the "Controllers" folder of Mixxx
Restart Mixx
Go to settings / controllers, find your controller and assign the mapping to it.
If it's correctly set up, all light of the controller will quickly flash on Mixxx startup.

# How to use the controller with this mapping

## Mixer functions

Main knobs and sliders work straightforward.
Use SHIFT+crossfader to controle output balance

## Wheels

* Touch and turn wheels to activate scratching.
* With shift, fast scratching at 10X speed
* Turn wheels without touching the sensitive part to make temporary rate adjustments (jog)
note : wheels should turn red when touched. if not, adjust the touch sensitivity on the front panel.
* The LED ring shows the play position of the track. It does one revolution for the full length of the track. 

## <kbd>SYNC</kbd> / <kbd>CUE</kbd> / <kbd>>||</kbd>

|Key|Function|
|---|---|
|<kbd>PLAY</kbd>|Play/pause|
|<kbd>SHIFT</kbd>+<kbd>PLAY</kbd>|reverse play|
|<kbd>CUE</kbd>|go to cue point|
|<kbd>SHIFT</kbd> + <kbd>CUE</kbd>|set the cue point|
|<kbd>SYNC</kbd>|blinks on each beat. Press to adjust beatgrid position.|
|<kbd>SHIFT</kbd>+<kbd>SYNC</kbd>|activates auto-sync|


## Tempo sliders

The sliders adjust pitch  
<kbd>SHIFT</kbd> + move slider : reset speed to 1X  
<kbd>RANGE</kbd> : toggle keylock

## Navigation area

Turn the center wheel to scroll 

Toggle <kbd>BACK</kbd> to select scroll zone : ON = left panel, OFF = tracklist  

<kbd>FWD</kbd> : fold/unfold subdirectories  

JOGSCROLL+<kbd>LOAD A</kbd> / <kbd>LOAD B</kbd> : Load the track into deck A or B  

Push the center wheel to load and play a track into preview deck 

<kbd>VIEW</kbd> : play/pause preview deck  

<kbd>AREA</kbd> : Toggle Auto-DJ ( think A(rea) as A(utodj) )

## Effects

<kbd>FX SELECT</kbd> : Select an effect. Inactive with Mixxx versions up to 1.11, where only one effect is available : Flanger. Other functions below do work, and apply to Flanger.  
<kbd>FX ON/OFF</kbd> : Toggle effect on each deck.  
<kbd>FX DEPTH</kbd> : adjust wet/dry parameter  
Adjust other parameters : see "performance pads", effects control

## Performance pads and strips

They work in different modes, according to the selection buttons on the top of the controller.
My modes are not always related to the names they bear on the controller :

### <kbd>HOT CUE</kbd> mode : HOTCUES
8 hot cues available, one per pad. The pads will light up when their hotcue is set
- push a lighted pad to play the hotcue
- push a blank pad to set a new hotcue to the current position.
- push <kbd>SHIFT</kbd> + lighted pad to clear a hotcue

The left strip is used for needle drop (quick navigate) on the preview deck
To do a needle drop on the main decks, touch the strip with <kbd>SHIFT</kbd>

### <kbd>SLICER</kbd> mode : EFFECTS CONTROL
parameters for the current effect (see Effects paragraph) are assigned to pads.  
each available parameter appears as a blue pad, and pad 8 is the "SuperKnob" in light blue.  
push a pad to select a parameter - SuperKnob is the default - and touch the strip to change its value  

### <kbd>AUTO LOOP</kbd> mode
not used - suggestions welcome
### <kbd>ROLL</kbd> mode
not used - suggestions welcome
### <kbd>SAMPLER</kbd> mode (<kbd>SHIFT</kbd> + <kbd>HOT CUE</kbd>)
not used yet - I'm planning to control the samplers from here
