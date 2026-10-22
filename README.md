This mapping allows using the VESTAX VCI-380 controller with Mixxx DJ software.
I would appreciate any feedback, suggestions for changes or improvement.

# Where to get Mixxx
Download and install Mixxx DJ software from [Mixxx website](https://mixxx.org/)   
The mapping requires Mixxx 2.5 or later. The Stems feature requires Mixxx 2.6 or later ([beta version](https://mixxx.org/download/#beta) at the time of writing). 

# How to install the mapping
- Copy the 2 files `Vestax VCI-380.midi.xml` and `Vestax-VCI-380-scripts.js` to the "Controllers" folder of Mixxx:

|OS|Folder location|
|---|---|
|GNU/Linux| `/home/<username>/.mixxx/controllers` |
|OS X| `/Users/<username>/Library/Containers/org.mixxx.mixxx/Data/Library/Application Support/Mixxx/controllers` |
|Windows| `C:\Users\<username>\AppData\local\Mixxx\controllers` |

- If you installed an older version, delete `Vestax_VCI-380.midi.xml` from that folder (the mapping file has been renamed).
- Restart Mixxx
- Go to settings / controllers, find your controller and assign the mapping to it.

If it's correctly set up, all the controller lights will quickly flash on Mixxx startup.

# How to use the controller with this mapping

Please read [the user manual](vestax_vci_380.rst)

# Hardware test

`Vestax VCI-380 hwtest.midi.xml` and `Vestax-VCI-380-hwtest-scripts.js` are a separate mapping that checks every light and input of the controller and logs the MIDI codes it sends. It shows up in Mixxx as **Vestax VCI-380 (hardware test)**. See [HARDWARE-TEST.md](HARDWARE-TEST.md).

# Linux audio inputs

If the audio inputs of the controller sound choppy on Linux, see [linux-audio-fix](linux-audio-fix/README.md).
