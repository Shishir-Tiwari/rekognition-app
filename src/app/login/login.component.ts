import { Component, OnInit } from '@angular/core';
import {AppService} from '../app.service';
import { AnyLengthString } from 'aws-sdk/clients/comprehend';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  compareSuccess = false;
  compareError = false;
  error = false;
  sourcePreview = false;
  targetPreview = false;
  sourceBytes = null;
  targetBytes = null;
  loading = false;
  constructor(private appService: AppService) { }

  ngOnInit() {
  }

  uploadImage(event : any, imageType:string) {
    const file = (<HTMLInputElement>event.target).files[0];
    this.processImage(file, imageType);
  }

  processImage(file: File, imageType:string) {
    const preview = document.querySelector(`img[name=${imageType}Preview]`);
    const reader = new FileReader();
    this[`${imageType}Preview`] = false;
    reader.onload = (e: any) => {  // Load base64 encoded image
      const result = e.target.result;
      (<HTMLImageElement>preview).src = result;
      this[`${imageType}Preview`] = true;
      this.encodeImage(result, imageType);
    };
    reader.readAsDataURL(file);
  }

  encodeImage(result, imageType) {
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
    this[`${imageType}Bytes`]= imageBytes;
  }

 compareImages() {
  this.compareSuccess = false;
  this.compareError = false;
this.loading = true;
    this.appService.compareImages(this.sourceBytes, this.targetBytes).then((confidence: number) => {
      this.compareSuccess = confidence > 90;
      this.loading = false;
    }).catch((err: any) => {
      this.compareError = true;
      this.loading = false;
      console.log(err); // an error occurred
    });
  }
}
