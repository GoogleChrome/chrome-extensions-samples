function turnFocusModeOn() {

    console.log('turn focus mode on');

    const createStyle = () => {
        const style = document.createElement('style')

        style.id = 'hide-message-preview'

        style.innerHTML = `
        /* hide message preview */
        .info .subtitle {
            opacity: 0.5;
        }

        .temporary-disable .info .info-row {
            height: 100%;
            padding-left: .5rem;
        }

        .ripple-container {
            visibility: hidden;
        }

        /* hide tabs content */
        .unread-count {
            visibility: hidden;
        }

        .ChatFolders .TabList {
            height: 0px;
        }

        .ChatFolders .TabList * {
            visibility: hidden;
        }

        .chat-list {
            visibility: hidden;
        }
        `;

        return style;
    }

    const DEFAULT_TAB_INDEX = 1

    if (!document.querySelector('#hide-message-preview')) {
        document.body.appendChild(createStyle());
    }

    const selectTab = (tabIndex) => {
        if (!document.querySelector('#hide-message-preview')) {
            return
        }

        document.querySelector('.TabList').children[tabIndex].click();

        // show tab content, but only for our tab
        document.querySelectorAll('.chat-list')[DEFAULT_TAB_INDEX].style = 'visibility: visible';
    }

    setTimeout(() => selectTab(DEFAULT_TAB_INDEX), 500);

}

function turnFocusModeOff() {

    console.log('turn focus mode off');

    document.querySelectorAll('#hide-message-preview').forEach(s => s.remove());

}

function searchFocus() {

    const backDialogButton = document.querySelector('.back-button button');
    const input = document.querySelector('#telegram-search-input');

    console.log('input', input);
    console.log('back button', backDialogButton);

    input.focus();
    backDialogButton.click();

}

function disableFor20() {
    const enabledAt = new Date ( Date.now() + 60 * 20 * 1000 )

    document.querySelector('#telegram-search-input').placeholder = `Work mode until ${enabledAt.toLocaleTimeString()}`

}
