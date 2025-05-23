This mapping allows using the VESTAX VCI-380 controller with Mixxx DJ software.
I would appreciate any feedback, suggestions for changes or improvement.

# How to install
- Copy the 2 files `Vestax_VCI-380.midi.xml` and `Vestax-VCI-380-scripts.js` to the "Controllers" folder of Mixxx:

|OS|Folder location|
|---|---|
|GNU/Linux| `/home/<username>/.mixxx/controllers` |
|OS X| `/Users/<username>/Library/Containers/org.mixxx.mixxx/Data/Library/Application Support/Mixxx/controllers` |
|Windows| `C:\Users\<username>\AppData\local\Mixxx\controllers` |

- Restart Mixx
- Go to settings / controllers, find your controller and assign the mapping to it.

If it's correctly set up, all the controller lights will quickly flash on Mixxx startup.

# How to use the controller with this mapping

## Mixer functions

Main knobs and sliders work straightforward.  
Hold <kbd>SHIFT</kbd> while turning EQ knobs (<kbd>HIGH</kbd> <kbd>MID</kbd> <kbd>LOW</kbd> for EQ kill mode  
Hold <kbd>SHIFT</kbd> while moving the crossfader to control output balance  

## Wheels

* Touch and turn wheels to activate scratching.
Get sure that <kbd>TOUCH SENSOR ADJ</kbd> knobs on the front panel are correctly set, or the tracks will refuse to play if Mixxx thinks that a platter is touched! The wheels must turn red when touched, and only then.
* With <kbd>SHIFT</kbd>, the scratching will be accelerated to 10X speed for fast seeking
* Turn wheels without touching the sensitive part to make temporary rate adjustments (jog)
* Turn wheels without touching and with <kbd>SHIFT</kbd> pressed to perform beatjumps
* Turn wheels while holding <kbd>JOG SCROLL</kbd>: control scrolling with the wheels  
* The LED rings are simulating a vinyl record spin.

## <kbd>SYNC</kbd> / <kbd>CUE</kbd> / <kbd>>||</kbd>

|Key|Function|
|---|---|
|<kbd>>/\|\|</kbd>|Play/pause|
|<kbd>SHIFT</kbd>+<kbd>>/\|\|</kbd>|reverse play|
|<kbd>CUE</kbd>|go to cue point|
|<kbd>SHIFT</kbd> + <kbd>CUE</kbd>|set the cue point|
|<kbd>SYNC</kbd>|blinks on each beat. Press to adjust beatgrid position.|
|<kbd>SHIFT</kbd>+<kbd>SYNC</kbd>|activates auto-sync|
|<kbd>VINYL</kbd>|toggles slip mode|


## "Tempo" sliders (pitch)

The sliders adjust pitch  
<kbd>SHIFT</kbd> + move slider: reset speed to 1X  
<kbd>SHIFT</kbd> + move slider to topmost position ("-"): brake effect  
<kbd>SHIFT</kbd> + <kbd>RANGE</kbd>: toggle keylock  
<kbd>RANGE</kbd>: toggle quantization  
While the pitch is different from zero, the red PAD FX LED will light up as a reminder that the deck is pitched 

## Navigation area

### Library

<kbd>SCROLL</kbd> turn: move up/down  
<kbd>BACK</kbd> and <kbd>FWD</kbd>: move left/right  
Left <kbd>PAD FX</kbd>: move up/down (equivalent to turning SCROLL)  
Right <kbd>PAD FX</kbd>: move left/right   
<kbd>AREA</kbd> or <kbd>PAD FX</kbd> push: Action button  
<kbd>SCROLL</kbd> push: change focus zone (playlists,tracklist,...)  
<kbd>SORT</kbd>: Sort according to selected column  
<kbd>JOGSCROLL</kbd>+<kbd>LOAD A</kbd> / <kbd>LOAD B</kbd> : Load selected track into deck A or B  
<kbd>VIEW</kbd>: Load and play selected track on preview deck. Push again to stop.  

## Quick Effects

For both decks:  
<kbd>FX SELECT</kbd> turn: Select a quick effect preset  
<kbd>FX ON/OFF</kbd>: Toggle quick effect ON/OFF 
<kbd>FX DEPTH</kbd> turn: adjust the effect parameter ("superknob")

## Performance pads and strips

They work in different modes, according to the selection buttons on the top of the controller.
My modes are not always related to the names they bear on the controller :

The left strip is used in any mode for needle drop (quick navigate) on the preview deck
To do a needle drop on the main decks, touch the strip with <kbd>SHIFT</kbd>

### <kbd>HOT CUE</kbd> mode: HOTCUES
8 hot cues available, one per pad. The pads will light up when their hotcue is set.  
the colors of the lights will approximate the colors defined for the hot cues.  
- push a lighted pad to play the hotcue
- push a blank pad to set a new hotcue to the current position.
- push <kbd>SHIFT</kbd> + lighted pad to clear a hotcue
- loop hotcues: the pad will turn green when the loop is active, push to disable loop

If you changed the hotcues outside of the controller, press <kbd>HOTCUE</kbd> button to refresh the pad colors  

The left strip is used for needle drop (quick navigate) on the preview deck  
To do a needle drop on the main decks, touch the strip with <kbd>SHIFT</kbd>

### <kbd>SLICER</kbd> mode : BEAT GRID tools
The 8 pads will illuminate in sequence following the beat grid. To reset the sequence to beat 1, push the <kbd>SLICER</kbd> button again.
- Push a button of higher row: BPM tap. Tap it in rhythm to adjust the calculated BPM of the track  
- Push a button of lower row: align beatgrid. Tap it to align the beatgrid bars to the current position.    

### <kbd>AUTO LOOP</kbd>: loop mode
The green buttons on the left control loop activation.  
- upper (button 1): creates or disables a loop (beatloop_activate)  
- lower (button 5): reactivates existing loop (reloop_toggle)  

The yellow buttons control beatloop size
- left (button 3): halves the size
- right (button 4): doubles the size

The white buttons control the loop position  
- left (button 7): move left  
- right (button 8): move right  

### <kbd>ROLL</kbd>: tools mode
|Button #|Color|Function|
|---|---|---|
|1|GREEN|Clone the other deck|

### <kbd>SAMPLER</kbd> mode (<kbd>SHIFT</kbd> + <kbd>HOT CUE</kbd>)
not used yet - I'm planning to control the samplers from here

