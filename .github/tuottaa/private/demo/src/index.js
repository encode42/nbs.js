import { getElements, getSong, setElements, setSong } from "./util/globals.js";
import { prepareSong, resetSong, startSong, stopSong } from "./audio/playback.js";
import { loadSong } from "./audio/loadSong.js";

// TODO: Set checkboxes to their default state

let structureCode;
let setStructureCode = false;

let fileName;

window.addEventListener("load", () => {
    // Check all "checked by default" checkboxes
    for (const element of document.getElementsByTagName("*")) {
        if (element.getAttribute("checked") === "") {
            element.checked = true;
        }
    }

    setElements({
        "button": {
            "file": {
                "input": document.getElementById("file-input"),
                "export": document.getElementById("file-export")
            },
            "playback": {
                "toggle": document.getElementById("playback-button"),
                "restart": document.getElementById("restart-button")
            },
            "structure": {
                "highlight": document.getElementById("highlight")
            }
        },
        "toggle": {
            "playback": {
                "looping": document.getElementById("toggle-looping"),
                "parity": document.getElementById("toggle-parity")
            },
            "structure": {
                "highlight": document.getElementById("hide-structure")
            }
        },
        "text": {
            "playback": document.getElementById("playback"),
            "overview": document.getElementById("result-overview"),
            "structure": {
                "parent": document.getElementById("structure"),
                "code": document.getElementById("structure-code"),
                "highlighting": document.getElementById("highlight-status")
            }
        }
    });

    // Initial result state
    getElements().button.file.input.value = null;
    prepareResult("No file selected.");
    setReady(false);

    // Speed highlight does not work on Firefox
    if (!navigator.userAgent.includes("Firefox")) {
        getElements().button.structure.highlight.classList.add("visible");
        getElements().text.structure.highlighting.classList.add("enabled");
    }

    // Workers do not work right on Safari
    if (!(navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome"))) {
        getElements().text.playback.classList.add("enabled");
    }

    // File is selected
    getElements().button.file.input.addEventListener("change",  async event => {
        if (event.target.files.length === 0) {
            return;
        }

        fileName = event.target.files[0].name;

        setReady(false);

        // Load the song
        prepareResult("Loading...");
        const data = await loadSong({
            "file": event.target.files[0]
        });

        const song = data.song;

        setSong(song);

        // Fill result table
        for (const overview of data.overviews) {
            const row = document.createElement("tr");

            const key = document.createElement("td");
            key.innerHTML = `<strong>${overview[0]}</strong>`;

            const value = document.createElement("td");
            value.innerHTML = overview[1] === "" ? "None" : overview[1];

            row.append(key);
            row.append(value);

            getElements().text.overview.append(row);
        }

        // Set structure text
        displayStructureCode(data.structureText);

        setReady(true);
    });

    getElements().button.file.export.addEventListener("click", () => {
        if (getSong()) {
            const buffer = getSong().toArrayBuffer();
            const blob = new Blob([new Uint8Array(buffer)]);

            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = fileName;

            document.body.append(link);

            link.click();
            link.remove();
        }
    });

    // Play button is pressed
    getElements().button.playback.toggle.addEventListener("click", () => {
        // Toggle playback of the song
        if (getElements().button.playback.toggle.dataset.toggled === "true") {
            stopSong();
        } else {
            startSong();
        }
    });

    // Restart button is pressed
    getElements().button.playback.restart.addEventListener("click", () => {
        // Restart the song
        resetSong();
    });

    // Highlight button is pressed
    getElements().button.structure.highlight.addEventListener("click", () => {
        // Start highlighting
        const highlightWorker = new Worker("src/worker/highlight.js", {
            "type": "module"
        });

        getElements().text.structure.highlighting.classList.add("visible");

        // Highlight the block
        highlightWorker.postMessage({
            "code": getElements().text.structure.code.innerHTML
        });

        highlightWorker.addEventListener("message", highlightEvent => {
            displayStructureCode(highlightEvent.data.code);
            getElements().text.structure.highlighting.classList.remove("visible");
        });
    });

    // Ability to hide the structure code
    getElements().toggle.structure.highlight.addEventListener("change", event => {
        if (event.target.checked) {
            // Hide the code
            getElements().text.structure.parent.classList.remove("visible");

            // Don't let highlights happen
            getElements().button.structure.highlight.disabled = true;
        } else {
            if (!setStructureCode) {
                getElements().text.structure.code.innerHTML = structureCode;
            }

            // Show the code
            getElements().text.structure.parent.classList.add("visible");
            getElements().button.structure.highlight.disabled = false;
        }
    });
});

/**
 * Display the stored structure code.
 * @param code Code to override
 */
function displayStructureCode(code) {
    structureCode = code || structureCode;

    if (!getElements().toggle.structure.highlight.checked) {
        setStructureCode = true;
        getElements().text.structure.code.innerHTML = structureCode;
    }
}

/**
 * Prepare the result code block with a placeholder message.
 * @param placeholder Message to display
 * @return {void}
 */
function prepareResult(placeholder) {
    getElements().text.overview.innerHTML = null;
    displayStructureCode(placeholder);
}

function setReady(isReady) {
    if (isReady) {
        prepareSong();
        resetSong();
        getElements().button.file.export.disabled = false;
        getElements().button.playback.toggle.disabled = false;
        getElements().button.playback.restart.disabled = false;
        getElements().toggle.playback.parity.disabled = false;

        if (!getElements().toggle.structure.highlight.checked) {
            getElements().button.structure.highlight.disabled = false;
        }
    } else {
        setStructureCode = false;
        getElements().button.file.export.disabled = true;
        getElements().button.playback.toggle.disabled = true;
        getElements().button.playback.restart.disabled = true;
        getElements().button.structure.highlight.disabled = true;
        getElements().toggle.playback.looping.disabled = true;
        getElements().toggle.playback.parity.disabled = true;
        stopSong();
    }
}