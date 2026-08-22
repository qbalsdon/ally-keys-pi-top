function getHeldKeys() {
    var modifiers = document.getElementsByClassName("held");
    var reference = "";
    for (var i = 0; i < modifiers.length; i++) {
        if (!reference.includes(modifiers[i].dataset.value)) {
            var prefix = "h";
            if (modifiers[i].dataset.value[0] === prefix) {
                prefix = "";
            }
            reference = reference + "/" + prefix + modifiers[i].dataset.value;
        }
    }
    return reference;
}

function releaseHeldKeys() {
    Array.from(document.getElementsByClassName("held")).forEach((key) => {
        key.classList.toggle('held');
    });
}

function hold(reference, type) {
    var modifiers = document.getElementsByClassName(type);
    for (var i = 0; i < modifiers.length; i++) {
        if (modifiers[i].dataset.value == reference) {
            modifiers[i].classList.toggle('held');
        }
    }
}

function writeKeyInteraction(keyValues) {
    var modifiers = getHeldKeys();
    const data = `${modifiers}/${keyValues}`;
    const keyCodeString = `${toKeyCode(data)}r`;
    writeStream(keyCodeString);
}

function isSpace(event) {
    return event.key == " " || event.code == "Space" || event.keyCode == 32
}

function activate(keyValue, animationReference) {
    if (document.getElementById('combo').checked) {
        hold(keyValue, "key");
    } else {
        writeKeyInteraction(keyValue);
    }
    showAnimation(animationReference, false);
}

function hasDataValue(currentKey) {
    return "value" in currentKey.dataset && currentKey.dataset.value.length > 0
}

function hasElement(value, arr) {
    for (var i = 0; i < arr.length; i++) {
        if (value.replace('h', '') === arr[i]) { return true; }
    }
    return false;
}

function keyFocus(currentKey) {
    const revealBoxes = document.getElementsByName('reveal');
    var oneChecked = false;
    for (var i = 0; i < revealBoxes.length; i++) {
        oneChecked = oneChecked || revealBoxes[i].checked;
    }

    if (!oneChecked) return;

    if (hasDataValue(currentKey)) {
        var values = currentKey.dataset.value.split("/");
        for (var i = 0; i < values.length; i++) {
            values[i] = values[i].replace('h', '');
        }

        const allKeys = document.getElementsByClassName("key");
        for (var i = 0; i < allKeys.length; i++) {
            const keyHere = allKeys[i];
            if (keyHere.classList.contains('no-reveal')) continue;
            keyHere.classList.remove('combination');

            if (hasDataValue(keyHere) && !keyHere.classList.contains("macro") && hasElement(keyHere.dataset.value, values)) {
                keyHere.classList.add('combination');
            }
        }
    }
}

function clearHighlights() {
    const allKeys = document.getElementsByClassName("key");
    for (var i = 0; i < allKeys.length; i++) {
        allKeys[i].classList.remove('combination');
    }
}

function addAccessibleActivation(element, fn) {
    element.onclick = () => { fn(); };
    element.addEventListener("keyup", (event) => {
        if (isSpace(event) && !userSettings.live_typing) { fn(); }
    });
}

function attachRevealEvents() {
    const revealBoxes = document.getElementsByName('reveal');
    for (var i = 0; i < revealBoxes.length; i++) {
        revealBoxes[i].addEventListener('change', e => {
            if (!e.target.checked) {
                clearHighlights();
            }
            const allBoxes = document.getElementsByName('reveal');
            for (var i = 0; i < revealBoxes.length; i++) {
                if (allBoxes[i] === e.target) continue;
                allBoxes[i].checked = e.target.checked;
            }
        });
    }
}

function loadKeyEvents(event) {
    const allKeys = document.getElementsByClassName("key");
    for (var i = 0; i < allKeys.length; i++) {
        const currentKey = allKeys[i];
        if (hasDataValue(currentKey)) {
            if (currentKey.classList.contains("modifier")) {
                const fn = () => { hold(currentKey.dataset.value, "modifier"); };
                addAccessibleActivation(currentKey, fn);
            } else if (currentKey.classList.contains("lockable")) {
                const fn = () => {
                    if (currentKey.classList.contains('combination')) {
                        currentKey.classList.remove('combination');
                        currentKey.classList.remove('locked');
                    } else {
                        currentKey.classList.toggle('locked');
                    }
                    activate(currentKey.dataset.value, currentKey.getAttribute('data-animation'));
                };
                addAccessibleActivation(currentKey, fn);
            } else {
                const fn = () => { activate(currentKey.dataset.value, currentKey.getAttribute('data-animation')); };
                addAccessibleActivation(currentKey, fn);
            }
            if (currentKey.classList.contains("macro")) {
                currentKey.onfocus = () => { keyFocus(currentKey) };
                currentKey.onmouseover = () => { keyFocus(currentKey) };
            }
        } else {
            if (!currentKey.classList.contains('press-all')) {
                currentKey.classList.add("to-do");
            }
        }
    }

    attachRevealEvents();

    const comboKey = document.getElementsByClassName("press-all")[0];
    comboKey.onclick = function () { writeKeyInteraction(''); };
    comboKey.addEventListener("keyup", (event) => { if (isSpace(event)) { writeKeyInteraction(''); } });
}
window.addEventListener("load", loadKeyEvents, false);