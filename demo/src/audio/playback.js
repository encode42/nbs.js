import{getElements,getInstruments,getLoadedInstruments,pushLoadedInstruments,getSong,setInstruments}from"../util/globals.js";import{decodeAudioData,playNote}from"./audio.js";let stopPlaying=!0,currentTick=-1,currentLoop=0;async function prepareSong(){const t=getLoadedInstruments()||new Map;var e=getSong().instruments;const o=new Map;for(const g of e){let e=!1;if(!g.audioBuffer){var n=t.get(g.audioSrc);if(n)g.audioBuffer=n;else if(g.builtIn){const a=await fetch(g.audioSrc);n=await a.arrayBuffer();g.audioBuffer=await decodeAudioData(n),pushLoadedInstruments(g.audioSrc,n)}else e=!0}e||o.set(g.name,g)}setInstruments(o),getElements().toggle.playback.looping.disabled=!getSong().loopEnabled,getElements().toggle.playback.looping.checked=getSong().loopEnabled}function startSong(){stopPlaying=!1,getElements().button.playback.toggle.dataset.toggled="true",playSong()}function stopSong(){delete getElements().button.playback.toggle.dataset.toggled,stopPlaying=!0}function resetSong(){stopSong(),currentTick=-1,currentLoop=0}async function playSong(){if(getSong()){const a=getInstruments();for(var t=getSong().hasSolo,o=getSong().layers.length;!stopPlaying;){for(let e=0;e<o;e++){var n=getSong().layers[e];if((!t||n.solo)&&!n.locked){var g=n?.notes[currentTick];if(g){let e=(g.panning+n.panning)/2,t=g.pitch;getElements().toggle.playback.parity.checked&&(e=0===n.panning?g.panning:e,t-=2),playNote(g.key,a.get(g.instrument.name),g.velocity*n.velocity/100,e,t)}}}await new Promise(e=>setTimeout(e,getSong().timePerTick)),currentTick++,currentTick===getSong().size&&(getElements().toggle.playback.looping.checked&&(0===getSong().maxLoopCount||currentLoop<getSong().maxLoopCount)?(currentLoop++,currentTick=getSong().loopStartTick):resetSong())}}}export{prepareSong,startSong,stopSong,resetSong,playSong};