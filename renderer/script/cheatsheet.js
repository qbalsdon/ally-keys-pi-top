const cheatsheet_state = {
    "platformIndex": 0,
    "selectedTags": []
}

const priorityTags = ['voiceover', 'talkback', 'native', 'web', 'keyboard'].reverse();

const platforms = [
    { id: 'ios', label: "iPhone", ignore: ["android", "talkback", ".*-android"] },
    { id: 'android', label: "Android", ignore: ["ios", "voiceover", ".*-ios"] }
]

const tagReplace = {
    "ios": "iPhone",
    "gmail-ios": "gmail",
    "gmail-android": "gmail",
}

const tabTemplate = `
    <button id="tab___ID__" class="tab tab-selected" onclick="switchFilter(__INDEX__)">
        __NAME__
    </button>
`;

const chipTemplate = `
    <input type="checkbox" data-value="__NAME__" id="chip___ID__" class="filter-chip" onchange="toggleFilter('__ID__')"><label id="label___ID__" for="chip___ID__">__NAME__</label>
`;

const rowTemplate = `
    <tr class="cheatsheet-data-row" data-value="__FILTERS__">
        <td>__DESCRIPTION__</td>
        <td>__TAGS__</td>
        <td>__KEYCODE__</td>
        <td class="press_column">__TRY_ME__</td>
    </tr>
`;

const contentTemplate = `
<div class="align-left">
    __TABS__&nbsp;&nbsp;<label class="label-in-tab" for="cheatsheet-text-filter">Filter</label><input type='text' class="edit-in-tab" id="cheatsheet-text-filter"/>
</div>
<div class="align-left">
    __CHIPS__
</div>
<div class="tab_container cheatsheet">
    <table class="cheatsheet-table">
        __DATA__
    </table>
</div>
`;

const tryButtonTemplate = `<input id="cheatsheet___ID__" class="cheatsheet button" type="button" value="Press" onclick="pressCheatsheetCombo('__COMBO__')"/>`;

const specialHighlight = "u";

function friendlyTagName(tag) {
    return tagReplace[tag] ? tagReplace[tag] : tag
}

function getUniqueTags(data) {
    const platform = platforms[cheatsheet_state.platformIndex];
    const allTags = data.map(item => item.tags);
    const flatTags = [].concat(...allTags);
    const tagArray = Array.from(new Set(flatTags));
    tagArray.splice(tagArray.indexOf(platform.id), 1); // remove platform

    const newTagArray = [];

    for (let i = 0; i < tagArray.length; i++) {
        const currentTag = tagArray[i];
        let add = true;
        for (let j = 0; j < platform.ignore.length; j++) {
            const re = `^${platform.ignore[j]}$`;
            add = add && currentTag.match(re) === null;
        }

        if (add) {
            newTagArray.push(currentTag)
        }
    }

    const filteredOptions = Array.from(new Set(newTagArray));
    for (let i = 0; i < priorityTags.length; i++) {
        const index = filteredOptions.indexOf(priorityTags[i]);
        if (index >= 0) {
            filteredOptions.unshift(filteredOptions.splice(index, 1)[0]);
        }
    }

    return filteredOptions.map((currentTag) => {
        return {
            "id": currentTag,
            "name": friendlyTagName(currentTag)
        }
    });
}

function getFilteredList(tagsToApply) {
    const freeTextFilter = document.getElementById('cheatsheet-text-filter').value.toLowerCase();
    const tableRows = document.getElementsByClassName('cheatsheet-data-row');
    const elementsToShow = [];
    const elementsToHide = [];

    //apply the chips
    for (let i = 0; i < tableRows.length; i++) {
        let add = true;
        const currentRow = tableRows[i];
        const filters = currentRow.getAttribute('data-value').split(',');
        const currentPlatform = platforms[cheatsheet_state.platformIndex].id;
        if (!(filters.includes(currentPlatform))) {
            add = false;
            elementsToHide.push(currentRow);
            continue;
        }
        if (tagsToApply.length == 0) {
            elementsToShow.push(currentRow);
            continue;
        }
        for (let j = 0; j < tagsToApply.length; j++) {
            if (!filters.includes(tagsToApply[j])) {
                add = false;
                elementsToHide.push(currentRow);
                break;
            }
        }
        if (add) {
            elementsToShow.push(currentRow);
        }
    }

    //apply free text
    if (freeTextFilter != "") {
        const filteredOut = [];
        elementsToShow.forEach((shownElement) => {
            const cellValue = shownElement
                .cells[0]
                .innerHTML
                .replace(`<${specialHighlight}>`, "")
                .replace(`</${specialHighlight}>`, "")
                .toLowerCase();
            if (!cellValue.includes(freeTextFilter)) {
                filteredOut.push(shownElement);
                elementsToHide.push(shownElement);
            }
        });

        filteredOut.forEach((out) => {
            elementsToShow.splice(elementsToShow.indexOf(out), 1);
        });
    }
    return {
        "hide": elementsToHide,
        "show": elementsToShow
    };
}

function applyFilterCounts() {
    Array.from(document.getElementsByClassName('filter-chip'))
        .forEach((chip) => {
            const id = chip.id.replace("chip_", "");
            const label = document.getElementById(`label_${id}`);
            const testArray = [...cheatsheet_state.selectedTags];
            if (!testArray.includes(id)) {
                testArray.push(id);
            }
            const count = getFilteredList(testArray).show.length;
            label.innerHTML = `${chip.getAttribute("data-value")} (${count})`;

            if (count == 0) {
                label.style.display = 'none';
            } else {
                label.style.display = 'inline-block';
            }
        });
}

function applyFilters() {
    const data = getFilteredList(cheatsheet_state.selectedTags);
    Array.from(document.getElementsByClassName('cheatsheet-data-row')).forEach((element) => {
        element.classList.remove('gone')
    });

    data.hide.forEach((element) => {
        if (!element.classList.contains('gone')) {
            element.classList.add('gone');
        }
    });

    data.show.forEach((element) => {
        if (element.classList.contains('gone')) {
            element.classList.remove('gone');
        }
    });
    applyFilterCounts();
}

function toggleFilter(filterId) {
    const index = cheatsheet_state.selectedTags.indexOf(filterId);
    if (index >= 0) {
        cheatsheet_state.selectedTags.splice(index, 1);
    } else {
        cheatsheet_state.selectedTags.push(filterId);
    }
    applyFilters();
}

function friendlyKeyCode(shortcut) {
    if (shortcut.keyValue == '') return '';
    return generateKeyCombo(shortcut, true).map((element) => {
        let value = element;
        value = value.replace('h', '');
        return userFriendlyMap.get(value);
    }).join(" + ");
}

function pressCheatsheetCombo(comboString) {
    const rawData = `${toKeyCode(comboString)}r`;
    // log(`pressCheatsheetCombo('${rawData}')`);
    writeStream(rawData);
}

function generateButtonAction(shortcut, index) {
    if (shortcut.keyValue == '') return ''
    if (shortcut.modFunction) return ''
    return tryButtonTemplate
        .replace("__COMBO__", generateKeyCombo(shortcut))
        .replace("__ID__", index);
}

function displayPressButtons() {
    log(`displayPressButtons() [${isConnected()}]`)
    Array.from(document.getElementsByClassName("press_column")).forEach((element) => {
        element.style.display = (isConnected()) ? "table-cell" : "none"
    });
}

const sortOptions = {
    "description": "asc",
    "shortcut": "sort"
}

function advanceSort(sortOption) {
    if (sortOption == 'asc') {
        return 'desc';
    } else {
        return 'asc';
    }
}

function sort(sortValue) {
    if (sortValue == 'description') {
        sortOptions.description = advanceSort(sortOptions.description);
        sortOptions.shortcut = "sort";
    }
    if (sortValue == 'shortcut') {
        sortOptions.shortcut = advanceSort(sortOptions.shortcut);
        sortOptions.description = "sort";
    }
    setupCheatsheet();
}

function setupCheatsheet() {
    let tabHtml = "";
    let chipHtml = "";
    let shortcutData = "";

    for (let i = 0; i < platforms.length; i++) {
        tabHtml += tabTemplate
            .replace(' tab-selected', (i == cheatsheet_state.platformIndex) ? " tab-selected" : "")
            .replaceAll('__ID__', platforms[i].id)
            .replaceAll('__INDEX__', i)
            .replaceAll('__NAME__', platforms[i].label);
    }
    const chips = getUniqueTags(keyboardShortcuts);
    for (let i = 0; i < chips.length; i++) {
        chipHtml += chipTemplate
            .replaceAll('__NAME__', chips[i].name)
            .replaceAll('__ID__', chips[i].id);
    }

    shortcutData = keyboardShortcuts
        .sort((shortcutA, shortcutB) => {
            if (sortOptions.description == 'asc') {
                return shortcutA.description.localeCompare(shortcutB.description);
            } else if (sortOptions.description == 'desc') {
                return shortcutB.description.localeCompare(shortcutA.description);
            } else if (sortOptions.shortcut == 'asc') {
                return shortcutA.keyValue.localeCompare(shortcutB.keyValue);
            } else { // sortOptions.shortcut == 'desc'
                return shortcutB.keyValue.localeCompare(shortcutA.keyValue);
            }
        })
        .map((shortcut, index) => {
            const desc = shortcut.description.replace("[", `<${specialHighlight}>`).replace("]", `</${specialHighlight}>`);
            return rowTemplate
                .replace('__KEYCODE__', friendlyKeyCode(shortcut))
                .replace('__TRY_ME__', generateButtonAction(shortcut, index))
                .replace('__DESCRIPTION__', desc)
                .replace('__TAGS__', shortcut.tags.map((tagName) => { return friendlyTagName(tagName) }).join(", "))
                .replace('__FILTERS__', shortcut.tags.join(","));
        }).join("")

    shortcutData = `
    ${rowTemplate
            .replaceAll('<td>', '<th>')
            .replaceAll('</td>', '</th>')
            .replace('cheatsheet-data-row', '')
            .replace('__KEYCODE__', `Shortcut  <a href="javascript:void(0)" onclick="sort('shortcut')">[${sortOptions.shortcut}]</a>`)
            .replace('__DESCRIPTION__', `Description <a href="javascript:void(0)" onclick="sort('description')">[${sortOptions.description}]</a>`)
            .replace('__TAGS__', 'Tags')
            .replace('__TRY_ME__', '')
            .replace('__FILTERS__', [])
        }${shortcutData}`;

    document
        .getElementById('cheatsheet')
        .innerHTML = contentTemplate
            .replace('__CHIPS__', chipHtml)
            .replace('__TABS__', tabHtml)
            .replace('__DATA__', shortcutData);
    applyFilters();

    displayPressButtons();
    connectedListeners.push(() => {
        displayPressButtons();
    });

    document.getElementById('cheatsheet-text-filter').addEventListener('input', (e) => {
        applyFilters();
    });
}

function switchFilter(index) {
    cheatsheet_state.platformIndex = index;
    cheatsheet_state.selectedTags = [];
    setupCheatsheet()
}

window.addEventListener('load', () => {
    setupCheatsheet();
});