import { Component, OnInit } from '@angular/core';
import {AppService} from '../app.service';
import { AnyLengthString } from 'aws-sdk/clients/comprehend';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
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

  constructor(private appService: AppService) { }

  ngOnInit() {
  }

  processImage(event) {
    const file = (<HTMLInputElement>event.target).files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {  // Load base64 encoded image
      this.encodeImage(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  encodeImage(result) {
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
}
