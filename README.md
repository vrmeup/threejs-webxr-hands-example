# Three.js WebXR hand tracking example
Simple example of hand tracking and gesture recognition using Three.js and WebXR.

> This example uses [NodeJS](https://nodejs.org/) and [http-server](https://www.npmjs.com/package/http-server)

For more information on this example example, including a video walkthought.
- YoutTube : [Hand and Gesture detection in WebXR VR and Three.js](https://youtu.be/0ZhgLJK67vw)
- WebSite : [Hand and Gesture detection in WebXR VR and Three.js](https://vrmeup.com/devlog/devlog_12_webxr_hands_and_gestures.htm)

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

## References

- [WebXR Hand Input Module - Level 1](https://www.w3.org/TR/webxr-hand-input-1/)