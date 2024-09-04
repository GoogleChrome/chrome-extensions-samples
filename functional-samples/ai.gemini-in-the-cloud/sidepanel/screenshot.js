const getScreenshot = async () => {
  const imageDataUri = await chrome.tabs.captureVisibleTab({ format: 'png' });
  const byteString = atob(imageDataUri.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return {
    data: ia,
    base64: await blobToBase64(new Blob([ia], { type: 'image/png' }))
  };
};

const blobToBase64 = async (imageDataUri) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(imageDataUri);
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });
};

export default getScreenshot;
