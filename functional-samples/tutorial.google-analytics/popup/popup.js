import Analytics from '../scripts/google-analytics.js';

// Fire a page view event on load
window.addEventListener('load', () => {
  Analytics.firePageViewEvent(document.title, document.location.href);
});

// Listen globally for all button events
document.addEventListener('click', (event) => {
  if (event.target instanceof HTMLButtonElement) {
    Analytics.fireEvent('click_button', { id: event.target.id });
  }
});
