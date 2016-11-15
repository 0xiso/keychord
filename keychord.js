if(!navigator.requestMIDIAccess){
  alert("unsupported browser");
}

navigator.requestMIDIAccess().then(onMIDIInit, onMIDIReject);
let midiAccess;

let keyboard = [];
for(let i = 0; i < 128; i++){
  keyboard[i] = 0;
}
let skeyboard = [];
for(let i = 0; i < 12; i++){
  skeyboard[i] = 0;
}

let chordTable = {
  '': [0,4,7],
  '-5': [0,4,8],
  '6': [0,4,7,9],
  '69': [0,2,4,7,9],
  'sus4': [0,5,7],
  '7': [0,4,7,10],
  'M7': [0,4,7,11],
  '7-5': [0,4,8,10],
  '7-9': [0,1,4,7,10],
  '7sus4': [0,5,7,10],
  '7+9': [0,3,4,7,10],
  '7+11': [0,4,6,7,10],
  '7+13': [0,4,9,10],
  'add9': [0,2,4,7],
  '9': [0,2,4,7,10],
  '9-5': [0,2,4,8,10],
  '-9': [0,1,4,7,10],
  '-9+5': [0,1,4,8,10],
  'M9': [0,2,4,7,11],
  'aug9': [0,2,4,8,10],
  '11': [0,2,4,5,7,10],
  '13': [0,2,4,5,7,9,10],
  'm': [0,3,7],
  'm69': [0,2,3,7,9],
  'm7': [0,3,7,10],
  'mM7': [0,3,7,11],
  'm6': [0,3,7,9],
  'm7-5': [0,3,6,10],
  'm9': [0,2,3,7,10],
  'm11': [0,2,3,5,7,10],
  'm13': [0,2,3,5,7,9,10],
  'dim': [0,3,6],
  'dim7': [0,3,6,9],
  'aug': [0,4,8],
  'aug7': [0,4,8,10],
  'augM7': [0,4,8,11],
  'add2': [0,2,4,7],
  'add4': [0,4,5,7],
}

let keyTable = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function onMIDIInit(midi){
  midiAccess = midi;
  hookUpMIDIInput();
  midiAccess.onstatechange = hookUpMIDIInput;
}

function onMIDIReject(){
  alert("midi access rejected");
}

function hookUpMIDIInput(e) {
  console.log(e);

  let haveAtLeastOneDevice = false;
    let inputs = midiAccess.inputs.values();
    for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
      input.value.onmidimessage = MIDIMessageEventHandler;
      haveAtLeastOneDevice = true;
    }
    if(!haveAtLeastOneDevice){
      alert("no midi device found")
    }
}

function MIDIMessageEventHandler(event) {
  // Mask off the lower nibble (MIDI channel, which we don't care about)
  switch (event.data[0] & 0xf0) {
    case 0x90:
      if (event.data[2] !== 0) {  // if velocity != 0, this is a note-on message
        keyboard[event.data[1]]++;
        skeyboard[event.data[1] % 12]++;
        break;
      }
      // if velocity == 0, fall thru: it's a note-off.  MIDI's weird, ya'll.
    case 0x80:
      keyboard[event.data[1]]--;
      skeyboard[event.data[1] % 12]--;
      break;
  }
  detectChord(skeyboard);
}

function detectChord(skeyboard){
  let on = [];
  let candidates = [];
  let match = [];
  for(let i = 0; i < skeyboard.length; i++){
    if(skeyboard[i] !== 0){
      on.push(i);
    }
  }

  for(let i = 0; i < 12; i++){
    for(let chordSymbol in chordTable){
      let chordDefTransposed = chordTable[chordSymbol].map((note) => (note+i)%12);

      if(isSubset(chordDefTransposed, on)){
        candidates.push(keyTable[i] + chordSymbol);
      }
      if(chordDefTransposed.length == on.length
          && chordDefTransposed.sort().every((element, index) => element === on.sort()[index])){
        match.push(keyTable[i] + chordSymbol);
      }
    }
  }
  writeChord(match);
  writeCandidates(candidates);
}

function isSubset(sup, sub) {
  for(let note of sub){
    if(!sup.includes(note)){
      return false;
    }
  }
  return true;
}

function writeChord(match){
  document.getElementById('chord_badge').innerText = match.length;
  if(match.length === 0){
    match = '-';
  }else{
    match = match.join(', ');
  }
  document.getElementById('chord').innerText = match;
}

function writeCandidates(candidates){
  document.getElementById('candidate_badge').innerText = candidates.length;
  let candidateElm = document.getElementById('candidates');
  candidateElm.innerText = '';
  candidates.forEach((candidate => {
    let col = document.createElement('div');
    col.innerText = candidate;
    col.className = 'col-xs-3 col-sm-2 col-md-2 col-lg-1';
    candidateElm.appendChild(col);
  }));
}
