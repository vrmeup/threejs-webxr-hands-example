# Three.js WebXR hand tracking example
Simple example of hand tracking and gesture recognition using Three.js and WebXR.

> This example uses [NodeJS](https://nodejs.org/) and [http-server](https://www.npmjs.com/package/http-server)

For more information on this example example, including a video walkthought.
- [YouTube](https://youtu.be/0ZhgLJK67vw)
- [WebSite](https://vrmeup.com/devlog/devlog_12_webxr_hands_and_gestures.html)
- [Demo](https://vrmeup.com/demo/threejs-webxr-hands-example/)

## Running in HTTP mode

This example code can run in HTTP mode, however, WebXR requires that a website be delivered using HTTPS in order to enter fully immersive VR mode from a headset. 

If you are using a Browser VR emulator like the [Immersive Web Emulator](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik) or [WevXR API Emulator](https://chromewebstore.google.com/detail/webxr-api-emulator/mjddjgeghkdijejnciaefnkjmkafnnje) you can enter emulated VR mode on the browser, however, the emulators do not currently (March 2024) support hand tracking emulation and you will only have access to the  mechanical controllers.

```
npm i
npm run serve
```

## Running in HTTPS SSL mode (recommended)

 To run this example in fully immersive VR mode with hand tracking, the web server will need to run this example in HTTPS mode which will require a SSL certificate. This example code uses the NodeJS [http-server](https://www.npmjs.com/package/http-server) web server and you can find details on the packages web page on how to create your own SSL certificate. 

 Once [OpenSSL](https://www.openssl.org/) is installed your should be able to run the server using the following commands, 

```
npm i
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
npm run serve-ssl
```

In your VR headset, open the link shown in the startup output in the browser and press the "Enter VR" button.

```
...
Available on:
  http://192.168.1.209:8080
  http://192.168.56.1:8080
  http://127.0.0.1:8080
  http://192.168.240.1:8080
```

## Issues

### Wolvic

The standard [Wolvic](https://www.wolvic.com/en/) (1.7.0) Gecko based browser does not currently [as at Sept 2024] fully support WebXR hand tracking. The location of the hand appeared to work, but not the fingers, etc. Sideload the Chromium Based version and the hand tracking should work [tested on version 0.9.1].  

- https://www.uploadvr.com/wolvic-switching-to-chromium/
- https://wolvic.com/dl/

> The current Chromium Based version (0.9.1) does not appear to fully support self signed HTTPS certificates (which are required for WebXR VR) and just shows a blank browser window. Try the [Demo](https://vrmeup.com/demo/threejs-webxr-hands-example/) with a signed HTTPS certificate to make sure.

## References

- [WebXR Hand Input Module - Level 1](https://www.w3.org/TR/webxr-hand-input-1/)