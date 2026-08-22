const switchKeyTemplate = `
<div class="switch-key-container">
    <input type="button" class="switch-selector" id="switch_key___NAME__" value="__VALUE_LABEL__"/>
    <div id="switch_key_activate___NAME__" class="key switch-key lower-content lowercase macro __CLASS__" role="button" data-value="__VALUE__" data-animation="" data-index="__INDEX__" tabindex="1001">__NAME__</div>
</div>
`;

const switchLayout = `
<div class="header">
    <h1 class="keyboard">
        <span class="header-line">Switches <a href="https://youtu.be/chLH5VIAQY8" target="_blank"><u>[iOS tutorial &#8599;]</u></a>&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://www.youtube.com/watch?v=chLH5VIAQY8&t=251s" target="_blank"><u>[Android tutorial &#8599;]</u></a></span>
    </h1>
</div>
<div class="keyboard" id="base-keyboard">
    <div class="keyboard-row bottom-row switch-row spaced">
        <!-- __SWITCH_KEYS__ -->        
    </div>                        
</div>
`;

const switchKeys = [
    {
        "name": "Previous",
        "class": "switch-main"
    },
    {
        "name": "Select",
        "class": "switch-select"
    },
    {
        "name": "Next",
        "class": "switch-main"
    },
    {
        "name": "Shortcut",
        "class": "switch-main"
    },
]

function decodeCharacterEntity(entity) {    
    if (entity.substring(0, 2) != '&#') {        
        return entity;
    }
    const code = entity.substring(2, entity.length - 1);    
    let charCode;
    if (code.startsWith("x")) {
        charCode = parseInt(code.substring(1), 16);
    } else {
        charCode = parseInt(code, 10);
    }

    if (isNaN(charCode)) {
        return entity;
    }

    return String.fromCharCode(charCode);
}

function getFriendlyLabel(characterSequence) {
    if (characterSequence == '0x0000') return "- Click to set -";
    const labelArr = [];
    characterSequence
        .replaceAll('/r', '')
        .replaceAll('h', '')
        .split('/').forEach((code) => {
            labelArr.push(decodeCharacterEntity(findUserFriendlyKeyName(code)));
        });
    return labelArr.join(' + ');
}

function setUpSwitchMacroPad() {
    const keys = [];
    const buttonIds = [];
    for (let i = 0; i < switchKeys.length; i++) {
        keys.push(switchKeyTemplate
            .replaceAll('__NAME__', switchKeys[i].name)
            .replaceAll('__INDEX__', i)
            .replaceAll('__CLASS__', switchKeys[i].class)
            .replaceAll('__VALUE__', userSettings.switch_values[i])
            .replaceAll('__VALUE_LABEL__', getFriendlyLabel(userSettings.switch_values[i]))
        );
        buttonIds.push(`switch_key_activate_${switchKeys[i].name}`);
    }
    document.getElementById('switch-keyboard').innerHTML = switchLayout.replace('<!-- __SWITCH_KEYS__ -->', keys.join(' '));

    Array.from(document.getElementsByClassName('switch-selector')).forEach((combo) => {
        combo.addEventListener('click', (event) => {
            event.target.value = '- Choose a key -';
            streamOverride = (stream) => {
                event.target.value = getFriendlyLabel(stream);
                const button = document.getElementById(event.target.id.replace('switch_key_', 'switch_key_activate_'));
                const index = button.getAttribute('data-index');
                userSettings.switch_values[index] = stream;
                saveSettings();
                button.setAttribute('data-value', stream);
                releaseHeldKeys();
            }
        });
    });

    buttonIds.forEach((id) => {
        const button = document.getElementById(id);
        button.addEventListener('click', (event) => {
            writeStream(document.getElementById(event.target.id).getAttribute('data-value'));
        });
    });
}

window.addEventListener("load", () => {
    setUpSwitchMacroPad();
}, false);