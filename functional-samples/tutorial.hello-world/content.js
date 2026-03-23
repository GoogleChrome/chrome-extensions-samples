/**
 * YouTube Shorts Remover - Scalable Logic
 * Uses MutationObserver to handle SPA navigation.
 */

const removeShortsElements = () => {
    // 1. Target the Shelves (Home/Search)
    const shelves = document.querySelectorAll('ytd-rich-shelf-renderer, ytd-reel-shelf-renderer');
    shelves.forEach(shelf => {
        if (shelf.querySelector('ytm-shorts-lockup-view-model-v2, [is-slim-media], [href^="/shorts/"]')) {
            shelf.remove();
        }
    });

    // 2. Target individual Shorts in search results or related videos
    const individualShorts = document.querySelectorAll('ytd-video-renderer:has(a[href*="/shorts/"]), ytd-compact-video-renderer:has(a[href*="/shorts/"])');
    individualShorts.forEach(item => item.remove());
};

// Use MutationObserver for high performance and scalability
const observer = new MutationObserver((mutations) => {
    // We only trigger the removal logic if nodes were actually added
    for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            removeShortsElements();
            break; 
        }
    }
});

// Start observing the body for changes
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initial run
removeShortsElements();