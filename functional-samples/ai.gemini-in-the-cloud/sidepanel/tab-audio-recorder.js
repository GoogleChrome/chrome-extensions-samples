export default class TabAudioRecorder {
  constructor() {
    this.recorder = null;
    this.data = [];
  }

  async start() {
    /*
    const currentTab = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    console.log('currentab', currentTab);

    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: currentTab.id
    });

    const media = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      }
    });
    */

    const media = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: false
    });

    // Continue to play the captured audio to the user.
    const output = new AudioContext();
    const source = output.createMediaStreamSource(media);
    source.connect(output.destination);
    // Start recording.
    this.recorder = new MediaRecorder(media, { mimeType: 'audio/wav' });
    this.recorder.ondataavailable = (event) => this.data.push(event.data);
    this.recorder.onstop = () => {
      const blob = new Blob(this.data, { type: 'video/wav' });
      window.open(URL.createObjectURL(blob), '_blank');

      // Clear state ready for next recording
      this.recorder = undefined;
      this.data = [];
    };
    this.recorder.start();
  }

  stop() {
    if (!this.recorder) {
      return;
    }
    this.recorder.stop();
    // Stopping the tracks makes sure the recording icon in the tab is removed.
    this.recorder.stream.getTracks().forEach((t) => t.stop());
  }
}
