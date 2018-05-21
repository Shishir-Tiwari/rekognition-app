import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AppService } from '../app.service';
import {size, includes, filter} from 'lodash';
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})

export class SignupComponent implements OnInit {
  videoDisplay: boolean = false;
  capturedImage: any;
  loading: boolean;
  signUpSuccess: boolean;
  signUpFailed: boolean;
  sourceImageBytes: ArrayBuffer;
  sourceFileToUpload = null;
  model = {
    firstName: '',
    lastName: '',
    email: '',
  };
  error: boolean = false;

  @ViewChild('f') form: any;
  @ViewChild("video")
  video: ElementRef;

  @ViewChild("canvas")
  canvas: ElementRef;
  constructor(private appService: AppService) { }

  ngOnInit() {
  }

  processImage(event) {
    const file = (<HTMLInputElement>event.target).files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {  // Load base64 encoded image
      this.capturedImage = e.target.result;
      this.detectText();
    };
    reader.readAsDataURL(file);
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

  detectText(): any {
    this.encodeImage();
    this.appService.detectText(this.sourceImageBytes)
      .then((textDetectionList: any) => {
        this.retrieveInformation(textDetectionList);
      }).catch((error: any) => {
        this.signUpFailed = true;
        this.loading = false;
        console.log(error); // an error occurred
      });
  }

  ignoreList: string[] = ['Learner Driver Licence', 'New South Wales'];

  retrieveInformation(textDetectionList): void {
   let filteredList = filter(textDetectionList, item => {
      return size(item) > 2 && !includes(this.ignoreList, item) && item.Type === 'LINE';
    });

    console.log('filteredList  ',filteredList);
  }

  onSubmit() {
    this.loading = true;
    this.signUpFailed = false;
    this.signUpSuccess = false;
    this.encodeImage();
    this.appService.indexFaces(this.sourceImageBytes)
      .then((faceID: string) => {
        this.appService.putItem(faceID, this.model.email, this.model.firstName, this.model.lastName)
          .then((data) => {
            console.log(data);
            this.signUpSuccess = true;
            this.loading = false;
          })
          .catch((error: any) => {
            this.signUpFailed = true;
            this.loading = false;
            console.log(error); // an error occurred
          });
      }).catch((error: any) => {
        this.signUpFailed = true;
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
