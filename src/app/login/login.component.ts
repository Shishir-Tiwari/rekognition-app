import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AppService } from '../app.service';
import { AnyLengthString } from 'aws-sdk/clients/comprehend';
declare var Camera: any;
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  lastName: any;
  capturedImage: any;
  videoDisplay: boolean;
  firstName: any;
  email: any;
  loginSuccess: boolean;
  loginFailed: boolean;
  loading: boolean;
  signUpSuccess: boolean;
  signUpFailed: boolean;
  sourceImageBytes: ArrayBuffer;
  sourceFileToUpload = null;
  error: boolean = false;
  show: boolean = false;

  @ViewChild("video")
  video: ElementRef;

  @ViewChild("canvas")
  canvas: ElementRef;

  constructor(private appService: AppService) { }

  ngOnInit() {
    // this.playVideo();
  }

  processImage(event) {
    const file = (<HTMLInputElement>event.target).files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {  // Load base64 encoded image
      this.capturedImage = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  encodeImage() {
    const result = this.capturedImage;
    let image = null;
    let isJpg = true;
    try {
      image = atob(result);
    } catch (e) {
      isJpg = false;
    }
    if (isJpg === false) {
      try {
        image = atob(result.split('data:image/png;base64,')[1]);
      } catch (e) {
        this.error = true;
        return;
      }
    }
    // unencode image bytes for Rekognition DetectFaces API
    const length = image.length;
    const imageBytes = new ArrayBuffer(length);
    const ua = new Uint8Array(imageBytes);
    for (let i = 0; i < length; i++) {
      ua[i] = image.charCodeAt(i);
    }
    this.sourceImageBytes = imageBytes;
  }

  captureImage() {
    if ((<any>navigator).camera) {
     (<any> navigator).camera.getPicture((image) => {
       this.capturedImage = image;
      }, () => {
        alert('try again !!');
      }, {
        quality: 25,
        destinationType: Camera.DestinationType.DATA_URL,
        cameraDirection:1
      });
    }
    else {
      alert("camera not found");
    }

  }

  onSubmit() {
    this.loading = true;
    this.loginFailed = false;
    this.loginSuccess = false;
    this.encodeImage();
    this.appService.searchFacesByImage(this.sourceImageBytes)
      .then((data: any) => {
        if (data.confidence > 90) {
          this.appService.getItem(data.faceId)
            .then((data: any) => {
              if (data) {
                console.log(data);
                this.loginSuccess = true;
                this.email = data.email;
                this.firstName = data.firstName;
                this.lastName = data.lastName;
                this.loading = false;
              } else {
                this.loginFailed = true;
                this.loading = false;
              }
            })
            .catch((error: any) => {
              this.loginFailed = true;
              this.loading = false;
              console.log(error); // an error occurred
            });
        } else {
          this.loginFailed = true;
        }

      }).catch((error: any) => {
        this.loginFailed = true;
        this.loading = false;
        console.log(error); // an error occurred
      });
  }

  playVideo() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      this.videoDisplay = true;
      this.capturedImage = false;
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        this.video.nativeElement.srcObject = stream;
        this.video.nativeElement.play();
      });
    }
  }

  snapImage() {
    var context = this.canvas.nativeElement.getContext("2d").drawImage(this.video.nativeElement, 0, 0, 480, 480);
    this.capturedImage = this.canvas.nativeElement.toDataURL("image/png");
    this.video.nativeElement.srcObject.getVideoTracks().forEach(track => track.stop());
    this.videoDisplay = false;
  }

}
