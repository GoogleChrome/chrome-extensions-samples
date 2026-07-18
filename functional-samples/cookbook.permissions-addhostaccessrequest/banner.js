const banner = document.createElement('div');
banner.innerText = 'Extension has access to page.';

banner.style.width = '100vw';
banner.style.position = 'fixed';
banner.style.top = '0';
banner.style.left = '0';
banner.style.margin = '0';
banner.style.borderRadius = '0';
banner.style.padding = '20px';
banner.style.background = '#4CAF50';
banner.style.color = 'white';

document.body.prepend(banner);
