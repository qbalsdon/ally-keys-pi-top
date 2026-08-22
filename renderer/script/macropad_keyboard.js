function createMacroPad(containerId, title, horizontal = true) {
    const mainElement = document.getElementById(containerId);
    if (!mainElement) return;
    const keyFunctions = filterKeyFunctions(containerId);
    const prefix = (horizontal) ? `` : `<div class="keyboard-row">`
    const suffix = (horizontal) ? `` : `</div>`;
    const keyTemplate = `
    ${prefix}
        <div class="key lowercase lower-content macro" role="button" data-value="__KEY_VALUE__" data-animation="__ANIMATION__" tabindex="1001">
            <div style="width:100%;" class="__IMAGE_CLASS__"></div>
            <div style="width:100%" class="macro-symbol">__TEXT_ICON__</div>        
            <div style="width:100%">__NAME__</div>
        </div>
    ${suffix}`;

    let macroKeyHtml = "";
    for (let i = 0; i < keyFunctions.length; i++) {        
        macroKeyHtml += keyTemplate
            .replace("__TEXT_ICON__", (keyFunctions[i].textIcon == "") ? "" : keyFunctions[i].textIcon)
            .replace("__KEY_VALUE__", keyFunctions[i].keyValue)
            .replace("__IMAGE_CLASS__", keyFunctions[i].imageClass)
            .replace("__ANIMATION__", keyFunctions[i].animation)
            .replace("__NAME__", keyFunctions[i].name);        
    }
    const arrayPrefix = (horizontal) ? `<div class="keyboard-row bottom-row">` : ``;
    const arraySuffix = (horizontal) ? `</div>` : ``;
    mainElement.innerHTML = `
        <div class="header">
            <h1 class="keyboard">
                <span class="header-line">
                    ${title}
                </span>                        
                <span class="${(horizontal) ? "" : "gone"}">
                    <input type="checkbox" name="reveal" class="reveal" id="r_${containerId}" tabindex="1000">
                    <label for="r_${containerId}"> Reveal</label>
                </span>
            </h1>
        </div>
        <div class="keyboard">
            ${arrayPrefix}
            ${macroKeyHtml}
            ${arraySuffix}
        </div>
    `;
}

function compareFunctions(a, b) {
    if (a.display < b.display) {
        return -1;
    }
    if (a.display > b.display) {
        return 1;
    }
    return 0;
}

function filterKeyFunctions(macroId) {
    return macroPadShortcuts
        .filter((data) => {
            return data.macropad == macroId && data.display >= 0
        })
        .sort(compareFunctions)
        .map((shortcut) => {
            return {
                "name": shortcut.name,
                "imageClass": shortcut.imageClass,
                "textIcon": shortcut.textIcon,
                "keyValue": generateKeyCombo(shortcut),
                "animation": shortcut.animation
            }
        });
}