import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {AppService} from '../app.service';
import { AnyLengthString } from 'aws-sdk/clients/comprehend';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  capturedImage: any;
  videoDisplay: boolean;
  lastName: any;
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

  @ViewChild("video")
  video: ElementRef;

  @ViewChild("canvas")
  canvas: ElementRef;

  constructor(private appService: AppService) { }

  ngOnInit() {
  }

  encodeImage() {
    const result = this.capturedImage;
    let image = null;
    let isJpg = true;
    try {
      image = atob(result.split('data:image/jpeg;base64,')[1]);
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

  onSubmit() {
    if (true) {
      this.loading = true;
      this.loginFailed = false;
      this.loginSuccess = false;
      this.encodeImage();
      this.appService.searchFacesByImage(this.sourceImageBytes)
        .then((data: any) => {
          if(data.confidence > 90 ) {
            this.appService.getItem(data.faceId)
            .then((data : any) => {
              if(data) {
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
  }

  playVideo() {
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      this.videoDisplay = true;
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
          this.video.nativeElement.src = window.URL.createObjectURL(stream);
          this.video.nativeElement.play();
      });
  }
  }

  stopVideo() {
    this.video.nativeElement.pause();
    this.videoDisplay = false;
  }

  snapImage() {
    var context = this.canvas.nativeElement.getContext("2d").drawImage(this.video.nativeElement, 0, 0, 480, 480);
    this.capturedImage = this.canvas.nativeElement.toDataURL("image/png");
}
}
