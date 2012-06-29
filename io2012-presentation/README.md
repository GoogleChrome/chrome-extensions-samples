This is the slide deck for the Google I/O 2012 "The Next Evolution of Chrome Apps" session. It itself is a Chrome packaged app. It currently runs in Chrome 22.0.1190.0 or later (as of 6/29/2012, this means canary channel only).

The session itself (including live demos) is [available on YouTube](https://www.youtube.com/watch?v=j8oFAr1YR-0).

The text editor used in the presentation is itself a Chrome packaged app. It's [available in the samples repository](https://github.com/GoogleChrome/chrome-app-samples/tree/master/mini-code-edit).

The `helloworld` directory contains the "Hello World!" demo from the session, including the variant with the XSS issue (which can't be exploited due to CSP).

The `diff-sample-files` directory contains the two local files that were diff-ed during the offline diff tool demo (the diff tool itself is also [available in the samples repository](https://github.com/GoogleChrome/chrome-app-samples/tree/master/diff)).

The `servo` directory contains the standalone version of the serial port API spinner demo. It only does writes to the serial port. The [complete version in the samples repository](https://github.com/GoogleChrome/chrome-app-samples/tree/master/servo) has the full read/write implementation.

The `windowing_api` directory contains the source for the custom window frame and windowing API documentation (it's launched via the "Demo" link on slide 7).
