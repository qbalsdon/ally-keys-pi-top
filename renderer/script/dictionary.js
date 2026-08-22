async function displayAndType(text, onEvent = (index, pressCodeArr, isComplete) => { }) {
    for (let index = 0; index < text.length; index++) {
        const character = text[index];
        const rawKeys = inputCharToCode(character);
        const toPress = rawKeys.split('/');
        Array.from(document.getElementsByClassName("key")).forEach((key) => {
            Array.from(toPress).forEach((pressKey) => {
                if (key.dataset.value && pressKey.replace('h', '') == key.dataset.value) {
                    key.classList.toggle('held');
                }
            });
        });

        onEvent(index, toPress, false);
        writeStream(`${toKeyCode(rawKeys)}r`);

        await new Promise((resolve) => {
            setTimeout(() => { resolve(); }, 500);
        });
        releaseHeldKeys();
    }
    onEvent(-1, [], true);
}

function quickType() {
    const selectCombo = document.getElementById('dictionary-select');
    const displayWindow = document.getElementById('type-display');
    const selectedOption = selectCombo.options[selectCombo.selectedIndex];
    const key = document.getElementById('current-dictionary-key');
    const shift = document.getElementById('live-dictionary-shift');
    const ctrl = document.getElementById('live-dictionary-ctrl');
    const alt = document.getElementById('live-dictionary-alt');

    displayAndType(selectedOption.value, (index, pressCodeArr, isComplete) => {
        if (isComplete) {            
            key.innerHTML = "&nbsp;";
            shift.classList.remove('activated');
            ctrl.classList.remove('activated');
            alt.classList.remove('held');
        } else {            
            shift.classList.remove('activated');
            ctrl.classList.remove('activated');
            alt.classList.remove('activated');       
            key.innerHTML = selectedOption.value[index];     
            for (let i = 0; i < pressCodeArr.length; i++) {
                currentKey = pressCodeArr[i].replace('h','');
                if (selectedOption.value[index] == '@') {
                    console.log(`    ${currentKey}`);
                }
                if (currentKey == 'HID_KEY_SHIFT_LEFT' || currentKey == 'HID_KEY_SHIFT_RIGHT') {
                    shift.classList.add('activated');
                    console.log(`    HOLDING SHIFT`);
                }
                else if (currentKey == 'HID_KEY_CONTROL_LEFT' || currentKey == 'HID_KEY_CONTROL_RIGHT') {
                    ctrl.classList.toggle('activated');
                }
                else if (currentKey == 'HID_KEY_ALT_LEFT' || currentKey == 'HID_KEY_ALT_RIGHT') {
                    alt.classList.toggle('activated');
                }
            }     
            if (selectedOption.value[index] == '@') { console.log(`----------`); }
        }
    });
}

function downloadJson(jsonData, fileName) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonData, null, 2)));
    element.setAttribute('download', `${fileName}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function downloadJsonDictionary() {
    const selectCombo = document.getElementById('dictionary-select');
    const array = [];
    for (let index = 0; index < selectCombo.options.length; index++) {
        const option = selectCombo.options[index];
        array.push({
            "reference": option.text,
            "value": option.value
        });
    }
    downloadJson(array, "ally_keys_dictionary");
}

function addToDictionary(jsonArray) {
    const selectCombo = document.getElementById('dictionary-select');
    for (let index = 0; index < jsonArray.length; index++) {
        const element = jsonArray[index];
        selectCombo.insertAdjacentHTML('beforeend',
            `<option value="${element.value}">${element.reference}</option>`
        );
    }
}

function manualDictionaryEntry() {
    let name = prompt("You will be asked for a name and a value.\nThe name is to help you remember the purpose (so make sure it's unique), the value is what is going to be typed\n\nPlease enter the name", "");
    if (!name) return;
    let value = prompt("Please enter the value", "");
    if (!value) return;
    addToDictionary([{
        "reference": name,
        "value": value
    }]);
}

function readFile(file) {
    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function () {
        addToDictionary(JSON.parse(reader.result));
    };
    reader.onerror = function () {
        console.log(reader.error);
    };
    document.getElementById("dictionary-load-file").value = null;
}

function handleDIctionaryFile() {
    const fileInput = document.getElementById("dictionary-load-file");
    const selectedFile = fileInput.files[0];
    readFile(selectedFile);
    fileInput.value = null;
}