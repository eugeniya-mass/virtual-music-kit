const config = {
    defaultAssignments: [
        {id: 'kick', name: 'Kick', file: 'kick.mp3', code: 'KeyA'},
        {id: 'snare', name: 'Snare', file: 'snare.mp3', code: 'KeyS'},
        {id: 'hihat_closed', name: 'Hi-Hat (closed)', file: 'hi-hat-reverse.mp3', code: 'KeyD'},
        {id: 'hihat_open', name: 'Hi-Hat (open)', file: 'hi-hat.mp3', code: 'KeyF'},
        {id: 'tom1', name: 'Tom 1', file: 'tom1.mp3', code: 'KeyG'},
        {id: 'tom2', name: 'Tom 2', file: 'tom2.mp3', code: 'KeyH'},
        {id: 'clap', name: 'Clap', file: 'clap.mp3', code: 'KeyJ'}
    ],
    soundPath: './sounds/',
    sequenceDelay: 400,
    maxSequenceMultiplier: 2
};

const state = {
    codeToId: {},
    idToCode: {},
    elements: {},
    audio: {},
    activeProcessing: null,
    isAutoPlaying: false
};

const appRoot = document.createElement('div');
appRoot.className = 'app';

const leftPanel = document.createElement('div');
leftPanel.className = 'panel';

const header = document.createElement('div');
header.className = 'header';

const h1 = document.createElement('h1');
h1.textContent = 'Virtual Drum Kit';

const hint = document.createElement('div');
hint.className = 'muted';
hint.textContent = 'Play with keyboard or click pads';

header.appendChild(h1);
header.appendChild(hint);
leftPanel.appendChild(header);

const kit = document.createElement('div');
kit.className = 'kit';
leftPanel.appendChild(kit);

const rightPanel = document.createElement('div');
rightPanel.className = 'panel controls';
const seqLabel = document.createElement('label');
seqLabel.textContent = 'Sequence (letters only)';
const seqWrapper = document.createElement('div');
seqWrapper.className = 'sequence';
const seqInput = document.createElement('input');
seqInput.type = 'text';
const playBtn = document.createElement('button');
playBtn.className = 'playBtn';
playBtn.textContent = 'Play sequence';

seqWrapper.appendChild(seqInput);
seqWrapper.appendChild(playBtn);
rightPanel.appendChild(seqLabel);
rightPanel.appendChild(seqWrapper);

appRoot.appendChild(leftPanel);
appRoot.appendChild(rightPanel);
document.body.appendChild(appRoot);

function codeToLetter(code) {
    const m = code && code.match(/^Key([A-Z])$/i);
    return m ? m[1].toUpperCase() : '';
}

function isLetterCode(code) {
    return /^Key[A-Z]$/.test(code);
}

config.defaultAssignments.forEach((item) => {
    const audio = new Audio(config.soundPath + item.file);
    audio.preload = 'auto';
    state.audio[item.id] = audio;
});

config.defaultAssignments.forEach((item) => {
    const {id, name, code} = item;
    state.codeToId[code] = id;
    state.idToCode[id] = code;

    const pad = document.createElement('button');
    pad.className = 'pad';
    pad.type = 'button';
    pad.dataset.id = id;

    const nm = document.createElement('div');
    nm.className = 'name';
    nm.textContent = name;
    const keyLabel = document.createElement('div');
    keyLabel.className = 'keyLabel';
    keyLabel.textContent = codeToLetter(code);
    const editBtn = document.createElement('button');
    editBtn.className = 'editBtn';
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';

    pad.appendChild(nm);
    pad.appendChild(keyLabel);
    pad.appendChild(editBtn);
    kit.appendChild(pad);

    state.elements[id] = {pad, keyLabel, editBtn};

    pad.addEventListener('mousedown', () => {
        if (state.isAutoPlaying) return;
        if (state.activeProcessing) return;
        state.activeProcessing = `mouse-${id}`;
        activatePad(id);
        playOnce(id);
    });

    pad.addEventListener('mouseup', () => {
        if (state.activeProcessing === `mouse-${id}`) {
            deactivatePad(id);
            state.activeProcessing = null;
        }
    });

    pad.addEventListener('mouseleave', () => {
        if (state.activeProcessing === `mouse-${id}`) {
            deactivatePad(id);
            state.activeProcessing = null;
        }
    });

    editBtn.addEventListener('click', () => {
        if (state.isAutoPlaying) return;
        showEditInput(id);
    });
});

function activatePad(id) {
    const el = state.elements[id].pad;
    if (el) el.classList.add('active');
}

function deactivatePad(id) {
    const el = state.elements[id].pad;
    if (el) el.classList.remove('active');
}

function playOnce(id) {
    const aud = state.audio[id];
    if (!aud) return;
    try {
        aud.pause();
        aud.currentTime = 0;
        const p = aud.play();
        if (p && p.catch) p.catch(() => {
        });
    } catch (err) {
    }
}

window.addEventListener('keydown', (ev) => {
    if (state.isAutoPlaying) return;
    const code = ev.code;
    if (!isLetterCode(code)) return;
    if (state.activeProcessing) return;
    const id = state.codeToId[code];
    if (!id) return;
    state.activeProcessing = `key-${code}`;
    activatePad(id);
    playOnce(id);
});

window.addEventListener('keyup', (ev) => {
    const code = ev.code;
    if (!isLetterCode(code)) return;
    const id = state.codeToId[code];
    if (!id) return;
    if (state.activeProcessing === `key-${code}`) {
        deactivatePad(id);
        state.activeProcessing = null;
    }
});

function showEditInput(id) {
    const overlay = document.createElement('div');
    overlay.className = 'editOverlay';
    const label = document.createElement('div');
    label.innerHTML = `<div style="font-weight:700">${state.elements[id].pad.querySelector('.name').textContent}</div>
    <div class="small" style="color:#94a3b8">Press an English letter key and press Enter</div>`;
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.maxLength = 1;
    inp.value = codeToLetter(state.idToCode[id]);
    overlay.appendChild(label);
    overlay.appendChild(inp);
    document.body.appendChild(overlay);
    inp.focus();
    inp.select();

    let tempCode = state.idToCode[id];

    function onKeyDown(e) {
        if (isLetterCode(e.code)) {
            tempCode = e.code;
            inp.value = codeToLetter(e.code);
            e.preventDefault();
        } else if (e.key === 'Escape') {
            close();
        } else if (e.key === 'Enter') {
            confirm();
        }
    }

    function confirm() {
        if (!isLetterCode(tempCode)) {
            close();
            return;
        }

        const already = state.codeToId[tempCode];
        if (already && already !== id) {
            const msg = document.createElement('div');
            msg.style.color = '#ff7a7a';
            msg.style.marginLeft = '8px';
            msg.textContent = `Key ${codeToLetter(tempCode)} already used`;
            overlay.appendChild(msg);
            setTimeout(() => {
                if (msg.parentNode) msg.parentNode.removeChild(msg);
            }, 1300);
            return;
        }

        const old = state.idToCode[id];
        delete state.codeToId[old];
        state.idToCode[id] = tempCode;
        state.codeToId[tempCode] = id;

        state.elements[id].keyLabel.textContent = codeToLetter(tempCode);
        close();
    }

    function close() {
        window.removeEventListener('keydown', onKeyDown, true);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    window.addEventListener('keydown', onKeyDown, true);
}

const maxLen = config.defaultAssignments.length * config.maxSequenceMultiplier;
seqInput.maxLength = maxLen;
seqInput.placeholder = `Up to ${maxLen} letters`;

seqInput.addEventListener('keydown', (ev) => {
    if (state.isAutoPlaying) {
        ev.preventDefault();
        return;
    }
    if (ev.key === 'Enter') {
        ev.preventDefault();
        playSequence();
        return;
    }

    if (ev.key.length === 1) {
        const ch = ev.key.toUpperCase();
        const code = `Key${ch}`;
        if (!state.codeToId[code]) {
            ev.preventDefault();
        }
    }
});

seqInput.addEventListener('input', () => {
    const v = seqInput.value || '';
    const allowed = [];
    for (const ch of v.toUpperCase()) {
        const code = `Key${ch}`;
        if (state.codeToId[code]) allowed.push(ch);
    }
    seqInput.value = allowed.slice(0, maxLen).join('');
});

playBtn.addEventListener('click', playSequence);

async function playSequence() {
    const seq = (seqInput.value || '').toUpperCase().split('');
    if (!seq.length) return;
    const valid = seq.filter((ch) => {
        const code = `Key${ch}`;
        return !!state.codeToId[code];
    });

    if (!valid.length) return;

    state.isAutoPlaying = true;
    seqInput.disabled = true;
    playBtn.disabled = true;

    for (const ch of valid) {
        const code = `Key${ch}`;
        const id = state.codeToId[code];
        if (!id) continue;

        activatePad(id);
        playOnce(id);
        await new Promise((res) => setTimeout(res, config.sequenceDelay));
        deactivatePad(id);
    }

    state.isAutoPlaying = false;
    seqInput.disabled = false;
    playBtn.disabled = false;
}
