const keyBuffer = [];
var handleKeyUp = () => { };
var handleKeyDn = () => { };

const lockKeys = ["CapsLock", "NumLock", "ScrollLock"];

function findKeyCode(event) {
    const rawKeyCode = event.code;
    let alias = toKeyAlias(rawKeyCode);
    if (!alias) {
        log(`!! findKeyCode(${event.code}) failed: CODE=[${event.code}] WHICH=[${event.which}] KEY=[${event.key}]`);
        return '';
    }
    const keyCode = toKeyCode(alias, '');

    return `h${keyCode}`;
}

function disabledEventPropagation(e) {
    if (e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        } else if (window.event) {
            window.event.cancelBubble = true;
        }
        e.preventDefault();
    }
}

function handleLockKey(event, publishKeyBufferFn) {
    if (!lockKeys.includes(event.code)) return false;    
    const keyCode = findKeyCode(event);
    Array.from(document.querySelectorAll(`[data-value="${findKeyName(keyCode.replace("h", ""))}"]`)).forEach((key) => {
        if (key.classList.contains('locked')) {
            key.classList.remove('locked');
            key.classList.remove('combination');
        } else {
            key.classList.toggle('combination');
        }
        key.focus();
    });

    publishKeyBufferFn([keyCode, '/r']);
    return true;
}

function startLiveTypingListener(publishKeyBufferFn) {
    handleKeyUp = (event) => {
        if (handleLockKey(event, publishKeyBufferFn)) return false;
        const keyCode = findKeyCode(event);
        if (event.key == "Meta") {
            Array.from(document.getElementsByClassName("key")).forEach((key) => {
                key.classList.remove('combination');
                if (key.getAttribute('data-value') == 'HID_KEY_GUI_LEFT') {
                    key.focus();
                }
            });
            keyBuffer.length = 0;
        } else {
            Array.from(document.querySelectorAll(`[data-value="${findKeyName(keyCode.replace("h", ""))}"]`)).forEach((key) => {
                key.classList.remove('combination');
                key.focus();
            });
            const index = keyBuffer.indexOf(keyCode);
            if (index > -1) {
                keyBuffer.splice(index, 1);
            }
        }

        const tempBuffer = [...keyBuffer];
        tempBuffer.push('/r');
        publishKeyBufferFn(tempBuffer);

        const keyName = event.key;
        if (keyName === "Shift") {
            document.getElementById("live-shift").classList.remove("activated");
        } else if (keyName === "Alt") {
            document.getElementById("live-alt").classList.remove("activated");
        } else if (keyName === "Control") {
            document.getElementById("live-ctrl").classList.remove("activated");
        }
        disabledEventPropagation(event);
        return false;
    };
    handleKeyDn = (event) => {
        if (handleLockKey(event, publishKeyBufferFn)) return false;
        const keyCode = findKeyCode(event);
        if (keyCode.length == 0) return;
        if (!keyBuffer.includes(keyCode)) {
            keyBuffer.push(keyCode);
            publishKeyBufferFn(keyBuffer);
        }
        Array.from(document.querySelectorAll(`[data-value="${findKeyName(keyCode.replace("h", ""))}"]`)).forEach((key) => {
            key.classList.add('combination');
        });

        const keyName = event.key;
        if (keyName === "Shift") {
            document.getElementById("live-shift").classList.add("activated");
        } else if (keyName === "Alt") {
            document.getElementById("live-alt").classList.add("activated");
        } else if (keyName === "Control") {
            document.getElementById("live-ctrl").classList.add("activated");
        } else {
            // safe to show the key
            if (keyName === " ") {
                document.getElementById("current-key").innerHTML = "&#9495;&#9499;"
            } else if (keyName === "Backspace") {
                document.getElementById("current-key").innerHTML = "&#9003;"
            } else if (keyName === "Enter") {
                document.getElementById("current-key").innerHTML = "&#8629;"
            } else if (keyName === "Tab") {
                document.getElementById("current-key").innerHTML = "&#8633;"
            } else {
                document.getElementById("current-key").innerHTML = event.code
                    .replace("Digit", "")
                    .replace("Semicolon", ";")
                    .replace("Equal", "=")
                    .replace("Comma", ",")
                    .replace("Minus", "-")
                    .replace("Period", ".")
                    .replace("Slash", "/")
                    .replace("Backquote", "`")
                    .replace("Backslash", "\\")
                    .replace("Quote", "'")
                    .replace("BracketLeft", "[")
                    .replace("BracketRight", "]")
                    .replace("Numpad", "")
                    .replace("Arrow", "")
                    .replace("Key", "");
            }
        }
        disabledEventPropagation(event);
        return false;
    };

    document.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('keydown', handleKeyDn, true);
}

function endLiveTyping() {
    userSettings.live_typing = false;
    saveSettings();

    document.getElementById("menu-live-typing").classList.remove("live-typing");
    document.removeEventListener('keyup', handleKeyUp, true);
    document.removeEventListener('keydown', handleKeyDn, true);

    hideElement('liveTyping-modal');
}

function startLiveTyping(toggleable = true) {
    if (isConnected()) {
        if (toggleable && userSettings.live_typing) {
            endLiveTyping();
            return;
        }
        showElement('liveTyping-modal');
        userSettings.live_typing = true;
        saveSettings();
        document.getElementById("menu-live-typing").classList.add("live-typing");
        startLiveTypingListener((buffer) => {
            writeStream(buffer.join('/'));
        });
    }
}

window.addEventListener("load", () => {
    connectedListeners.push(() => {
        if (userSettings.live_typing == true) {
            startLiveTyping(false);
        }
    });
});