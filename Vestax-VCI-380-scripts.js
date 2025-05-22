function VestaxVCI380() {};

/*
 * TO DO
 * - bpm tap
 * - pitch scale
 * - waveform zoom ?
 * - 30sec alarm
 * 
 * - use for mode 4 & 5 ?
 * - use for pads velocity ?
 * samplers
 * 
 * - better track loaded detection with 2.1

# TO DO
clone deck
replace "jog" by scratch
fix hotcue activate on pad 1
respect Mixxx coding guidelines
 * */

// Variables
VestaxVCI380.beatPos = [0,0,0];

// Color table. Colors are binary RGB, each in 2 variants : normal or dimmed
VestaxVCI380.padColor = {'OFF':0x00,'BLUE':0x18,'GREEN':0x28,'CYAN':0x38,'RED':0x48,'MAGENTA':0x58,'YELLOW':0x68,'WHITE':0x78,'dimBLUE':0x10,'dimGREEN':0x20,'dimCYAN':0x30,'dimRED':0x40,'dimMAGENTA':0x50,'dimYELLOW':0x60,'dimWHITE':0x70 }

// Color mapper
VestaxVCI380.ColorMapper = new ColorMapper({
        0xFF0000: 0x48, // red
        0x00FF00: 0x28, // green
        0x0000FF: 0x18, // blue
	0x00FFFF: 0x38, // cyan
	0xFF00FF: 0x58, // magenta
	0xFFFF00: 0x68, // yellow
	0xFFFFFF: 0x78, // white
    });

//// COLOR preferences
//// you can change them to your preference
VestaxVCI380.color_hotCueActive=VestaxVCI380.padColor["GREEN"]; 
VestaxVCI380.color_hotcueUnset=VestaxVCI380.padColor["dimBLUE"];
VestaxVCI380.color_hotcueActivate=VestaxVCI380.padColor["CYAN"];
VestaxVCI380.color_hotcueDelete=VestaxVCI380.padColor["RED"];
VestaxVCI380.color_beatActive=VestaxVCI380.padColor["WHITE"];
VestaxVCI380.color_currentBeat=VestaxVCI380.padColor["CYAN"];
VestaxVCI380.color_beatInactive=VestaxVCI380.padColor["dimCYAN"];
VestaxVCI380.color_beatPushedBpm=VestaxVCI380.padColor["RED"];
VestaxVCI380.color_beatPushedAlignGrid=VestaxVCI380.padColor["YELLOW"];
// 'Splash screen' : display a customizable color pattern instead of hot cues when no track is loaded
VestaxVCI380.splashScreen = [["RED","BLUE","RED","BLUE","BLUE","RED","BLUE","RED"],["GREEN","WHITE","GREEN","WHITE","WHITE","GREEN","WHITE","GREEN"]];

VestaxVCI380.cnx_beat_active = new Array(2);

VestaxVCI380.init = function(id,debugging) {
	
	// all lights ON
	VestaxVCI380.setPadColorAll(VestaxVCI380.padColor['WHITE']);
	VestaxVCI380.setAllLEDs(true);	
	
	// Set the samplerate to 48KHz, the only rate working for the 380
	// (You might want to remove this line if you are not using the 380 built-in soundcard)
	engine.setValue("[App]","samplerate",48000);
	
	// soft takeover
	engine.softTakeover("[Channel1]","volume",true);
	engine.softTakeover("[Channel2]","volume",true);
	engine.softTakeover("[Master]","crossfader",true);
	engine.softTakeover("[QuickEffectRack1_[Channel1]","super1",true);
	engine.softTakeover("[QuickEffectRack1_[Channel2]","super1",true);
 
	// events connection
	cnx1=engine.makeConnection("[Channel1]","playposition",VestaxVCI380.updatePlayposition);
	cnx2=engine.makeConnection("[Channel2]","playposition",VestaxVCI380.updatePlayposition);
	cnx3=engine.makeConnection("[Channel1]","hotcue_1_enabled",VestaxVCI380.onTrackLoaded);// trick for getting notified when a new track is loaded
	cnx4=engine.makeConnection("[Channel2]","hotcue_1_enabled",VestaxVCI380.onTrackLoaded);// trick for getting notified when a new track is loaded
	cnx5=engine.makeConnection("[Channel1]","track_loaded",VestaxVCI380.onTrackLoaded);
	cnx6=engine.makeConnection("[Channel2]","track_loaded",VestaxVCI380.onTrackLoaded);
	cnx7=engine.makeConnection("[Channel1]","loop_enabled",VestaxVCI380.onLoopEnabled);
	cnx8=engine.makeConnection("[Channel2]","loop_enabled",VestaxVCI380.onLoopEnabled);
	cnx9=engine.makeConnection("[Channel1]","quantize",VestaxVCI380.initLEDs);
	cnx10=engine.makeConnection("[Channel2]","quantize",VestaxVCI380.initLEDs);
	cnx11=engine.makeConnection("[Channel1]","keylock",VestaxVCI380.initLEDs);
	cnx12=engine.makeConnection("[Channel2]","keylock",VestaxVCI380.initLEDs); 
	VestaxVCI380.cnx_beat_active[1]=engine.makeConnection("[Channel1]","beat_active",VestaxVCI380.onBeatActive);
	VestaxVCI380.cnx_beat_active[1].disconnect();
	VestaxVCI380.cnx_beat_active[2]=engine.makeConnection("[Channel2]","beat_active",VestaxVCI380.onBeatActive);
	VestaxVCI380.cnx_beat_active[2].disconnect();


	// turning off all LEDs
	VestaxVCI380.setPadColorAll(VestaxVCI380.padColor['OFF']);
	VestaxVCI380.setAllLEDs(false);	

	// init LEDs status according to settings
	VestaxVCI380.initLEDs();
	
	// default pad mode
	VestaxVCI380.setPadMode(1,1);
	VestaxVCI380.setPadMode(2,1);

	// displaying splash screen
	VestaxVCI380.setPadColorSplash(1);
	VestaxVCI380.setPadColorSplash(2);
	
	} 


VestaxVCI380.shutdown = function(id) {

	// disconnect connections
	cnx1.disconnect();
	cnx2.disconnect();
	cnx3.disconnect();
	cnx4.disconnect();
	cnx5.disconnect();
	cnx6.disconnect();
	cnx7.disconnect();
	cnx8.disconnect();
	cnx9.disconnect();
	cnx10.disconnect();
	cnx11.disconnect();
	cnx12.disconnect();
	VestaxVCI380.cnx_beat_active[1].disconnect();
	VestaxVCI380.cnx_beat_active[2].disconnect();

	// turning off all LEDs
	VestaxVCI380.setPadColorAll(VestaxVCI380.padColor['OFF']);
	VestaxVCI380.setAllLEDs(false);	
	}

////
// WHEELS
////

VestaxVCI380.beatskipTickCount=0;

VestaxVCI380.isScratching=[false,false];
// The button that enables/disables scratching
VestaxVCI380.wheelTouch = function (channel, control, value, status) {
  if (value === 0x7F) {
	   
	   		// select range according to shift status (shift=fast moving)
		if(VestaxVCI380.shiftStatus) { var tpr=353 } // 10X speed
		else { var tpr=3533 } // 1X speed, measured ticks for one wheel turn
        var alpha = 1.0/8;
        var beta = alpha/32;
        engine.scratchEnable(VestaxVCI380.getDeck(channel), tpr, 33+1/3, alpha, beta);
		VestaxVCI380.isScratching[VestaxVCI380.getDeck(channel)]=true;
    }
    else {    // If button up
        engine.scratchDisable(VestaxVCI380.getDeck(channel));
    	VestaxVCI380.isScratching[VestaxVCI380.getDeck(channel)]=false;
    }
}
// The wheel that actually controls the scratching
VestaxVCI380.tickCounter = 0;
VestaxVCI380.wheelTurn = function (channel, control, value, status) {
	var deck=VestaxVCI380.getDeck(channel);
    if (!VestaxVCI380.jogScrollStatus) {
			if(VestaxVCI380.isScratching[deck]) { // scratching    
				var newValue=(value-64);
				engine.scratchTick(deck,newValue);
			} else { // not scratching = jog mode, or beatjump if shift is pressed
				if(VestaxVCI380.shiftStatus) {
					// beatjump
				if(++VestaxVCI380.tickCounter >100)  {
					engine.setValue("[Channel"+deck+"]","beatjump_"+((value < 64) ? "backward" : "forward"),1);	
					VestaxVCI380.tickCounter=0;
					}
				} else {
					// jog
					// OBSOLETE : should use scratch
				engine.setValue("[Channel"+deck+"]","jog", script.absoluteLin(value,-3,3));
				}
			}
	} else {
		// JOG scroll in playlist
			if(++VestaxVCI380.tickCounter >15) {
				VestaxVCI380.tickCounter=0;
				engine.setValue("[Library]","MoveVertical",value<64 ? -1 : 1);
				}
	}

}

////
// Modifiers
////
// SHIFT buttons
VestaxVCI380.shiftStatus=false;
VestaxVCI380.onShift = function (channel, control, value, status) {
	// left and right shift have different channels, but I consider them to be equivalent
	VestaxVCI380.shiftStatus=(value===0x7F);
	VestaxVCI380.setLED(1,VestaxVCI380.LED['SHIFT'], VestaxVCI380.shiftStatus) ;
	VestaxVCI380.setLED(2,VestaxVCI380.LED['SHIFT'], VestaxVCI380.shiftStatus) ;
}

// Jog Scroll button
VestaxVCI380.jogScrollStatus=false;
VestaxVCI380.onJogScroll = function (channel, control, value, status) {
	VestaxVCI380.jogScrollStatus=(value===0x7F);
	VestaxVCI380.setLED(1,VestaxVCI380.LED['JOGSCROLL'], VestaxVCI380.jogScrollStatus) ;
}


////
// KNOBS
////
VestaxVCI380.onSelectTrackKnob = function (channel, control, value, status) {
		switch (value) {
			case 0x7F:
				engine.setValue("[Library]","MoveVertical",-1);
				break;
			case 0x01:
				engine.setValue("[Library]","MoveVertical",1);
				break;
			case 0x7B:
				engine.setValue("[Library]","ScrollVertical",-1);
				break
			case 0x05:
				engine.setValue("[Library]","ScrollVertical",1);
		}
}

//EQs - managed by script in order to enable KILL function with shift
VestaxVCI380.onEQ = function (channel, control, value, status) {
		var deck=VestaxVCI380.getDeck(channel);

		if (!VestaxVCI380.shiftStatus) { 
		
		// regular mode
		engine.setValue("[EqualizerRack1_[Channel"+deck+"]_Effect1]","parameter"+(control-0x45),script.absoluteNonLin(value,0,1,4));
		} else { 
		
		// shift : KILL mode
		engine.setValue("[EqualizerRack1_[Channel"+deck+"]_Effect1]","button_parameter"+(control-0x45),(value<0x40 ? 1 : 0));
	}
	
	

}

////
// SLIDERS
////
VestaxVCI380.onCrossfader = function (channel, control, value, status) {
	if (VestaxVCI380.shiftStatus) { // SHIFT + crossfader sets Balance
		engine.setValue("[Master]","balance",script.absoluteLin(value,-1,1,0,127));
	} else { // crossfader
		engine.setValue("[Master]","crossfader",script.absoluteLin(value,-1,1,0,127));
	}
}

// Pitch : The VCI 380 has high resolution (14 bit) pitch controls
// It sends this value in 2 sequential MIDI messages : MSB then LSB. So we need to implement a memory. 
VestaxVCI380.rateMSB=[0x00,0x00]; // MSB memory
VestaxVCI380.onRate = function (channel, control, value, status) {
	if (VestaxVCI380.shiftStatus) { // SHIFT + pitchfader resets pitch to 0, or triggers braking/softstart if set near min/max
		if(control===0x0D) {
			if  (value >= 0x7E)  {engine.brake(VestaxVCI380.getDeck(channel),1); }
		else {engine.setValue("[Channel"+VestaxVCI380.getDeck(channel)+"]","rate",0);}
		}
	} else {
		if (control===0x0D) { // we're receiving the MSB
			VestaxVCI380.rateMSB[VestaxVCI380.getDeck(channel)]=value; // remember the MSB
		} else if (control===0x2D) { // we're receiving the LSB
			// calculate the rate value by combining together the received LSB and the memorized MSB
			engine.setValue("[Channel"+VestaxVCI380.getDeck(channel)+"]","rate", script.absoluteLin(VestaxVCI380.rateMSB[VestaxVCI380.getDeck(channel)]*128+value , -1 , 1 , 0,16384));
		}
	}
}

////
// BUTTONS
////

// RANGE button used as key lock
VestaxVCI380.onRange = function (channel, control, value, status) {
	if (value===0x7F) {
		var deck=VestaxVCI380.getDeck(channel);
		if (VestaxVCI380.shiftStatus) {
				var keyLockStatus=engine.getValue("[Channel"+deck+"]","keylock")===1;
				VestaxVCI380.setLED(deck+2,VestaxVCI380.LED['RANGE'], !keyLockStatus); // LEDs possess a distinct status with shift. settable by adding 2 to midi channel #
				engine.setValue("[Channel"+deck+"]","keylock",!keyLockStatus);
				 }
		else {
				var quantizeStatus=engine.getValue("[Channel"+deck+"]","quantize")===1;
				VestaxVCI380.setLED(deck,VestaxVCI380.LED['RANGE'], !quantizeStatus);
				engine.setValue("[Channel"+deck+"]","quantize",!quantizeStatus);
		}
	}
}



// VINYL button used as slip mode
VestaxVCI380.slipMode=false;
VestaxVCI380.onVinyl = function (channel, control, value, status) {
	    if  (value===0x7F) {
	    var deck=VestaxVCI380.getDeck(channel);
	    VestaxVCI380.slipMode=!VestaxVCI380.slipMode;
		VestaxVCI380.setLED(deck,VestaxVCI380.LED['VINYL'], VestaxVCI380.slipMode);
		engine.setValue("[Channel" + deck + "]","slip_enabled",VestaxVCI380.slipMode);
		}
}

// BACK and FWD buttons 
VestaxVCI380.onBack = function (channel, control, value, status) {
		if(value===0x7F) {
		engine.setValue("[Library]","MoveHorizontal",-1);
	}
}
VestaxVCI380.onFwd = function (channel, control, value, status) {
                if(value===0x7F) {
                engine.setValue("[Library]","MoveHorizontal",1);
        }
}


// SORT button
VestaxVCI380.onSort = function (channel, control, value, status) {
	    if  (value===0x7F) {
			engine.setValue("[Library]","sort_focused_column",1);
		}
}

// LOAD buttons. Must be used with jog scroll, otherwise they act as headphone cue toggle
VestaxVCI380.onLoad = function (channel, control, value, status) {
	if (VestaxVCI380.jogScrollStatus && value===0x7F) { // value 00 when button released would trigger deck clone (double click)
		engine.setValue("[Channel"+VestaxVCI380.getDeck(channel)+"]","LoadSelectedTrack",1);
	}
}

// Headphone cue buttons
VestaxVCI380.onHeadCue = function (channel, control, value, status) {
	engine.setValue("[Channel"+VestaxVCI380.getDeck(channel)+"]","pfl",value===0x7F);
}

////
// STRIPS
// They automatically send a different code according to the current Mode
// so each mode has its own mapping and function
////

VestaxVCI380.onStripMode1 = function (channel, control, value, status) {
	var deck=VestaxVCI380.getDeck(channel);
	if (VestaxVCI380.shiftStatus) { // SHIFT + strip = needle drop on main decks
		engine.setValue("[Channel"+deck+"]","playposition",script.absoluteLin(value,0,0.99)); // 0.99 instead of 1, to avoid unintentional stop while stripping to the end
	} else { // without shift : needle drop in the preview deck
		engine.setValue("[PreviewDeck1]","playposition",script.absoluteLin(value,0,0.99));
		}
}

// In modes 2,3 and 4, the strips keep the same functionality as in mode 1
VestaxVCI380.onStripMode2 = function (channel, control, value, status) {
	VestaxVCI380.onStripMode1(channel, control, value, status);
}
VestaxVCI380.onStripMode3 = function (channel, control, value, status) {
	VestaxVCI380.onStripMode1(channel, control, value, status);
}
VestaxVCI380.onStripMode4 = function (channel, control, value, status) {
	VestaxVCI380.onStripMode1(channel, control, value, status);
}

////
// COLOR PADS
////


// when tapped (used as buttons)
VestaxVCI380.onPadTap = function (channel, control, value, status) {
	deck = VestaxVCI380.getDeck(channel);
	padNumber= control - 0x3B;
	
	if (value>0x00) { // PAD pressed
		switch(VestaxVCI380.padMode[deck]) {
			case 1: // in mode 1 = HOT CUE
				if(VestaxVCI380.shiftStatus) { // press shift-pad to clear hotcue
					engine.setValue("[Channel"+deck+"]","hotcue_"+padNumber+"_clear",1);
					VestaxVCI380.setPadColor(deck,padNumber,VestaxVCI380.color_hotcueDelete);					
				} else { // press pad to set or play hotcue
					engine.setValue("[Channel"+deck+"]","hotcue_"+padNumber+"_activate",1);
					VestaxVCI380.setPadColor(deck,padNumber,VestaxVCI380.color_hotcueActivate);
			    }
			break;

			case 2: // in mode 2 = Beat grid tools
					switch (padNumber) {
						case 1:
						case 2:
						case 3:
						case 4: // BPM tap
							engine.setValue("[Channel"+deck+"]","bpm_tap",1);
							VestaxVCI380.setPadColor(deck,padNumber,VestaxVCI380.color_beatPushedBpm);
							break;
						case 5:
						case 6:
						case 7:
						case 8: // Align beatgrid
							engine.setValue("[Channel"+deck+"]","beats_translate_curpos",1);
							VestaxVCI380.setPadColor(deck,padNumber,VestaxVCI380.color_beatPushedAlignGrid);
							break;

					}
			break;

			case 3: // in mode 3 = LOOP
				 // press pad to control loops
					switch (padNumber) {				
						case 1: // activate loop
							engine.setValue("[Channel"+deck+"]","beatloop_activate",1); 
							break;
						case 2: // unused
							break;
						case 3: // lower beatloop size
							engine.setValue("[Channel"+deck+"]","loop_halve",1);
							break;						
						case 4: // raise beatloop size
							engine.setValue("[Channel"+deck+"]","loop_double",1);
							break;
						case 5: // activate reloop
							engine.setValue("[Channel"+deck+"]","reloop_toggle",1); 
							break;
						case 6: // unused
							break;
						case 7: // move loop left
							engine.setValue("[Channel"+deck+"]","loop_move",-0.125);
							break;
						case 8: // move loop right
							engine.setValue("[Channel"+deck+"]","loop_move",0.125);
							break;
					}
			break;			
		
			case 4: // Tools mode
					switch (padNumber) {
						case 1: // clone from the other deck
							engine.setValue("[Channel"+deck+"]","CloneFromDeck",(deck===1 ? 2 : 1));
							break;
					}
			break;
		
			case 5:
			break;
			
		}
		
			
		
	} else { // PAD released
		switch(VestaxVCI380.padMode[deck]) {
			case 1: // in mode 1, releasing pad de-activates and resets color for hotcue
				engine.setValue("[Channel"+deck+"]","hotcue_"+padNumber+"_activate",0);
				VestaxVCI380.setPadColorHotcuesOne(deck,padNumber);
				break;
				
			case 2: // in mode 2 = Beat grid tools
				VestaxVCI380.setPadColor(deck,padNumber,VestaxVCI380.color_beatInactive);
				break;
	
			case 3:
			break;

			case 4:
			break;

		}
		
	}
}

// PADFX button, select and push
VestaxVCI380.onPadFXSelect = function (channel, control, value, status) {
		var deck = VestaxVCI380.getDeck(channel);
		switch(deck) {
			case 1:
				engine.setValue("[Library]","MoveVertical",value===0x7f ? -1 : 1);
				break;
			case 2:
				engine.setValue("[Library]","MoveHorizontal",value===0x7f ? -1 : 1);
				break;
		}
}

VestaxVCI380.onPadFXPush = function (channel, control, value, status) {
	engine.setValue("[Library]","GoToItem",1);
}



////
// Managing the 5 different modes for the colorpads
// Modes are :
// 1 - HOT CUE
// 2 - FX PARAMETERS
// 3 - LOOP
////
VestaxVCI380.padMode=[1,1,1];
VestaxVCI380.onSelectPadMode = function (channel, control, value, status) {
	if (value === 127 ) {
		deck = VestaxVCI380.getDeck(channel);
		if (channel>=9) { 
			VestaxVCI380.padMode[deck]=5; // special case of shift + HOT CUE MODE, 5th mode
		} else { 
			VestaxVCI380.padMode[deck]=control-0x37;
		}
		VestaxVCI380.setPadMode(deck,VestaxVCI380.padMode[deck]);
	}
}

VestaxVCI380.setPadMode = function (deck, mode) {
	switch (mode) { // light up relevant LEDs for a mode
		case 1 :
			VestaxVCI380.cnx_beat_active[deck].disconnect();
			VestaxVCI380.setPadColorHotcuesDeck(deck);
			break;
		case 2 :
			VestaxVCI380.cnx_beat_active[deck].disconnect();
			VestaxVCI380.setPadColorBeatGridMode(deck);
			VestaxVCI380.beatPos[deck]=8;
			VestaxVCI380.cnx_beat_active[deck]=engine.makeConnection("[Channel"+deck+"]","beat_active",VestaxVCI380.onBeatActive); 
			break;
		case 3 :
			VestaxVCI380.cnx_beat_active[deck].disconnect();
			VestaxVCI380.setPadColorLoopMode(deck);
			break;
		case 4 :
			VestaxVCI380.cnx_beat_active[deck].disconnect();
			VestaxVCI380.setPadColorToolsMode(deck);
			break;
		case 5 :
			VestaxVCI380.cnx_beat_active[deck].disconnect();
			VestaxVCI380.setPadColorDeck(deck,VestaxVCI380.padColor["MAGENTA"]);
			engine.setValue("[Skin]","show_samplers",1);

			break;
						
	}
}

VestaxVCI380.onBeatActive = function (value, group, control) {
	var deck=0;
	if(group==="[Channel1]") { deck=1; }
	else if(group==="[Channel2]") { deck=2; }
	if (VestaxVCI380.padMode[deck]===2) {
		switch (value) {
			case 1: // Approaching bar - forward
				prevBeatPos=VestaxVCI380.beatPos[deck];
				VestaxVCI380.beatPos[deck]++;
				if (VestaxVCI380.beatPos[deck]>8) { VestaxVCI380.beatPos[deck]=1;}
				midi.sendShortMsg(0x96+deck, 0x3B+prevBeatPos,VestaxVCI380.color_beatInactive);
				midi.sendShortMsg(0x96+deck, 0x3B+VestaxVCI380.beatPos[deck],VestaxVCI380.color_beatActive);
				break;
			case 2: // Approaching bar - reverse
				prevBeatPos=VestaxVCI380.beatPos[deck];
				VestaxVCI380.beatPos[deck]--;
				if (VestaxVCI380.beatPos[deck]<1) { VestaxVCI380.beatPos[deck]=8;}
				midi.sendShortMsg(0x96+deck, 0x3B+prevBeatPos,VestaxVCI380.color_beatInactive);
				midi.sendShortMsg(0x96+deck, 0x3B+VestaxVCI380.beatPos[deck],VestaxVCI380.color_beatActive);
				break;
			case 0: // Getting away from bar
				midi.sendShortMsg(0x96+deck, 0x3B+VestaxVCI380.beatPos[deck],VestaxVCI380.color_currentBeat);
				break;
		}
	}

}

// for mode 1, refresh display while a new track is loaded/unloaded
VestaxVCI380.onTrackLoaded = function (value, group, control) {

		var deck=0;
		if(group==="[Channel1]") { deck=1; }
		else if(group==="[Channel2]") { deck=2; }

		if (engine.getValue(group,"track_loaded")===0) { // track ejected -> reset display
			VestaxVCI380.setPadColorSplash(deck);
			VestaxVCI380.setWheelLED(deck,0);
		 }
		else {
			
			// new track loaded --> setup display
			switch (VestaxVCI380.padMode[deck]) {
				case 1:
						VestaxVCI380.setPadColorHotcuesDeck(deck);
						break;
				case 3:
						VestaxVCI380.setPadColorLoopMode(deck);
						break;
			}
		}
}

// for mode 3, refresh colors when a loop is enabled or disabled
VestaxVCI380.onLoopEnabled = function (value,group,control) {
	var deck=0;
	if(group==="[Channel1]") { deck=1; }
	else if(group==="[Channel2]") { deck=2; }
	if (VestaxVCI380.padMode[deck]===3) {
		VestaxVCI380.setPadColorLoopMode(deck);
	}
	
}

////
// Managing effects
////

VestaxVCI380.onFXDepth = function (channel, control, value, status) { 
		engine.setValue("[QuickEffectRack1_[Channel"+VestaxVCI380.getDeck(channel)+"]]","super1", script.absoluteLin(value,0,1));
		}

VestaxVCI380.onFXSelect = function (channel, control, value, status) {
	engine.setValue("[QuickEffectRack1_[Channel"+VestaxVCI380.getDeck(channel)+"]]","chain_preset_selector", value === 0x7F ? 1 : -1);	
	 }
VestaxVCI380.onFXSelectPush = function (channel, control, value, status) { 
		engine.setValue("[EffectRack1_EffectUnit"+VestaxVCI380.getDeck(channel)+"]","group_[Channel1]_enable", 1);	
	}
	
VestaxVCI380.onFXOnOff = function (channel, control, value, status) { 
		var deck = VestaxVCI380.getDeck(channel);
		engine.setValue("[QuickEffectRack1_[Channel"+VestaxVCI380.getDeck(channel)+"]]","enabled", (value === 0x7F) ? 1 : 0);	
	 }


////
// MIDI tools
////

// tells which deck (1=left deck, 2= right) a command is coming from
// this is indicated by the channel used
VestaxVCI380.getDeck = function (channel) {
	switch (channel) {
		case 0x07 :
			return (1);
			break;
 		case 0x08 :
			return (2);
			break;
		case 0x09 :
			return (1);
			break;
 		case 0x0A :
			return (2);
			break;			
 		default :
			return (0);
			break;
 	 }
 }


////
// Controlling regular LEDs (monochrome)
////

// List of LED MIDI note numbers
// Values taken from Vestax manual, except for JOGSCROLL and PADFX which are undocumented 
// Most LEDs have 2 instances, one for left-deck and the other for the right. The MIDI channel selects the desired deck.
// Though browse area leds (area, view, sort, back, fwd, jogscroll) are unique and assigned to deck 1 only
// FX ON/OFF LED is not addressable, it maintains its own status
VestaxVCI380.LED = {'SHIFT':12,'SYNC':19,'CUE':22,'PLAY':23,'VINYL':26,'RANGE':27,'AREA':80,'VIEW':81,'SORT':82,'BACK':83,'FWD':79,'JOGSCROLL':'09','PADFX':29 };

// set a LED to ON or OFF, for given deck# (1 for left, 2 for right)
// led IDs to be taken from LED table
VestaxVCI380.setLED = function (deck,ledID,state) {
	midi.sendShortMsg(0x96+deck, ledID, state ? 0x7F : 0x00 );
}

VestaxVCI380.setAllLEDs = function (state) {
	for (var ledID in VestaxVCI380.LED) {
		VestaxVCI380.setLED(1,VestaxVCI380.LED[ledID],state);
		VestaxVCI380.setLED(2,VestaxVCI380.LED[ledID],state);
		VestaxVCI380.setLED(3,VestaxVCI380.LED[ledID],state);
		VestaxVCI380.setLED(4,VestaxVCI380.LED[ledID],state);
		}
}

VestaxVCI380.initLEDs = function () {
		VestaxVCI380.setLED(1,VestaxVCI380.LED["RANGE"],engine.getValue("[Channel1]","quantize")===1);
		VestaxVCI380.setLED(2,VestaxVCI380.LED["RANGE"],engine.getValue("[Channel2]","quantize")===1);
		VestaxVCI380.setLED(3,VestaxVCI380.LED["RANGE"],engine.getValue("[Channel1]","keylock")===1);
		VestaxVCI380.setLED(4,VestaxVCI380.LED["RANGE"],engine.getValue("[Channel2]","keylock")===1);
		VestaxVCI380.setLED(1,VestaxVCI380.LED["VINYL"],engine.getValue("[Channel1]","slip_enabled")===1);
		VestaxVCI380.setLED(2,VestaxVCI380.LED["VINYL"],engine.getValue("[Channel2]","slip_enabled")===1);
		VestaxVCI380.setLED(1,VestaxVCI380.LED["PADFX"],true);
		VestaxVCI380.setLED(2,VestaxVCI380.LED["PADFX"],true);
		// library control
		VestaxVCI380.setLED(1,VestaxVCI380.LED["AREA"],true);
		VestaxVCI380.setLED(1,VestaxVCI380.LED["SORT"],true);
		VestaxVCI380.setLED(1,VestaxVCI380.LED["BACK"],true);
		VestaxVCI380.setLED(1,VestaxVCI380.LED["FWD"],true);
}

////
// Controlling pad color LEDs
////

// Sets the color of a pad identified by deck# (1-2) and pad# (1-8)
// color from padCOLOR table
VestaxVCI380.setPadColor = function (deck,pad,color) {
	midi.sendShortMsg(0x96+deck, 0x3B + pad,color);
}	

// Sets the color of all pads of a deck (1-2)
// color from padCOLOR table
VestaxVCI380.setPadColorDeck = function (deck,color) {
	for (var padID=0x3B;padID<=0x43;padID++) {
		midi.sendShortMsg(0x96+deck, padID ,color);
	}
}	

// Sets the color of all pads of the device
// color from padCOLOR table
VestaxVCI380.setPadColorAll = function (color) {
	for (var padID=0x3B;padID<=0x43;padID++) {
		midi.sendShortMsg(0x97, padID ,color);
		midi.sendShortMsg(0x98, padID ,color);
	}
}	

// Light up the pads of a deck with colors of the hotcues
VestaxVCI380.setPadColorHotcuesDeck = function (deck) {
	for (var hotcueNumber=1;hotcueNumber<=8;hotcueNumber++) {
		if(engine.getValue("[Channel" + deck + "]","hotcue_" + hotcueNumber + "_status") !== 1) {
			midi.sendShortMsg(0x96+deck, hotcueNumber+0x3B,VestaxVCI380.color_hotcueUnset);	
		} else {
			hotcueColor=engine.getValue("[Channel" + deck + "]","hotcue_" + hotcueNumber + "_color");
			midi.sendShortMsg(0x96+deck, hotcueNumber+0x3B ,VestaxVCI380.ColorMapper.getValueForNearestColor(hotcueColor));
		}
	}
	
}	

// Light up the pads of a deck according to which hotcues are set or not
VestaxVCI380.setPadColorHotcuesOne = function (deck,hotcueNumber) {
		hotcueStatus=engine.getValue("[Channel" + deck + "]","hotcue_" + hotcueNumber + "_status");
		if(hotcueStatus === 0) { // unset
			midi.sendShortMsg(0x96+deck, hotcueNumber+0x3B ,VestaxVCI380.color_hotcueUnset);
		} else if (hotcueStatus === 1) { // set
			hotcueColor=engine.getValue("[Channel" + deck + "]","hotcue_" + hotcueNumber + "_color");
			midi.sendShortMsg(0x96+deck, hotcueNumber+0x3B ,VestaxVCI380.ColorMapper.getValueForNearestColor(hotcueColor));	
		} else if (hotcueStatus === 2) { // active
			midi.sendShortMsg(0x96+deck, hotcueNumber+0x3B ,VestaxVCI380.color_hotCueActive);
		}
}	

// Light up the pads of a deck for looping mode
VestaxVCI380.setPadColorLoopMode = function (deck) {
	
	if (engine.getValue("[Channel"+deck+"]","loop_enabled")) { // loop enabled

			midi.sendShortMsg(0x96+deck, 0x3C ,VestaxVCI380.padColor["GREEN"]);	
			midi.sendShortMsg(0x96+deck, 0x3D ,VestaxVCI380.padColor["OFF"]);
			midi.sendShortMsg(0x96+deck, 0x3E ,VestaxVCI380.padColor["YELLOW"]);
			midi.sendShortMsg(0x96+deck, 0x3F ,VestaxVCI380.padColor["YELLOW"]);
				
			midi.sendShortMsg(0x96+deck, 0x40 ,VestaxVCI380.padColor["GREEN"]);	
			midi.sendShortMsg(0x96+deck, 0x41 ,VestaxVCI380.padColor["OFF"]);	
			midi.sendShortMsg(0x96+deck, 0x42 ,VestaxVCI380.padColor["WHITE"]);	
			midi.sendShortMsg(0x96+deck, 0x43 ,VestaxVCI380.padColor["WHITE"]);	

	}
	else { // no loop enabled

			midi.sendShortMsg(0x96+deck, 0x3C ,VestaxVCI380.padColor["RED"]);	
			midi.sendShortMsg(0x96+deck, 0x3D ,VestaxVCI380.padColor["OFF"]);
			midi.sendShortMsg(0x96+deck, 0x3E ,VestaxVCI380.padColor["YELLOW"]);
			midi.sendShortMsg(0x96+deck, 0x3F ,VestaxVCI380.padColor["YELLOW"]);
				
			midi.sendShortMsg(0x96+deck, 0x40 ,VestaxVCI380.padColor["RED"]);	
			midi.sendShortMsg(0x96+deck, 0x41 ,VestaxVCI380.padColor["OFF"]);	
			midi.sendShortMsg(0x96+deck, 0x42 ,VestaxVCI380.padColor["WHITE"]);	
			midi.sendShortMsg(0x96+deck, 0x43 ,VestaxVCI380.padColor["WHITE"]);	

	}
}	

// Light up the pads of a deck for Beat Grid mode
VestaxVCI380.setPadColorBeatGridMode = function (deck) {
	VestaxVCI380.setPadColorDeck(deck,VestaxVCI380.color_beatInactive);
}

// Light up the pads of a deck for Tools mode
VestaxVCI380.setPadColorToolsMode = function (deck) {
	VestaxVCI380.setPadColorDeck(deck,VestaxVCI380.padColor["OFF"]);
	VestaxVCI380.setPadColor(deck,1,VestaxVCI380.padColor["GREEN"]);
}

VestaxVCI380.setPadColorSplash = function (deck) {
	for (var pixel=1;pixel<=8;pixel++) {
			midi.sendShortMsg(0x96+deck, pixel+0x3B ,VestaxVCI380.padColor[VestaxVCI380.splashScreen[deck-1][pixel-1]]);
		}
}

//// 
// Controlling wheels LED indicator
////

// Spinning disc indicator
VestaxVCI380.updatePlayposition = function (value, group, control) {
	if(group==="[Channel1]") deck=1;
	else if(group==="[Channel2]") deck=2;
	var duration=engine.getValue(group,"duration");
	var tickPerSecond=71.11111;
	//var totalticks=duration*tickPerSecond;
	var elapsedticks=duration*value*tickPerSecond;
	VestaxVCI380.setWheelLED(deck,elapsedticks%128);
}


// LED position memory
VestaxVCI380.wheelLEDPosition=[0xFF,0xFF];

// Light up the LED according to the provided value in MIDI range (00-7F)
// NOTE : I couldn't find how to set the LED OFF. It will stay forever on the last set position. Any help appreciated.
VestaxVCI380.setWheelLED = function (deck,value) {
	if (VestaxVCI380.wheelLEDPosition[deck]!==value) { // save up unneeded MIDI outgoing messages
	midi.sendShortMsg(0xB6+deck,0x03,value);
	VestaxVCI380.wheelLEDPosition[deck]=value;
	}
}
