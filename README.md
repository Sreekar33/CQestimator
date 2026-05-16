# Communication Coach Demo

Real-time facial expression tracking in the browser using mediapipe face landmarker. Gives live feedback on eye contact, smile, expressiveness, and head position - useful for practicing presentations and communication skills.

All processing happens client-side. No video leaves your device.

## How it works

- Uses mediapipe/taskvision with 52 blendshape scores
- Computes expressions metrics (smile, eye contact, expressiveness)
- Displays live gauges and engagement timeline alongside the webcam feed.