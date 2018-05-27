import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AppService } from '../app.service';
import { size, includes, filter, get, split, map } from 'lodash';
import { Person } from './person';
declare var Camera: any;
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})

export class SignupComponent implements OnInit {
  loadingText: boolean;
  person: Person;
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
    this.loadingText = true;
    const file = (<HTMLInputElement>event.target).files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {  // Load base64 encoded image
      this.capturedImage = e.target.result;
      this.detectText();
    };
    reader.readAsDataURL(file);
  }

  captureImage() {
    var promise = new Promise((resolve, reject) => {
      if ((<any>navigator).camera) {
        (<any>navigator).camera.getPicture((image) => {
          resolve(image);
        }, (error) => {
          reject(error);
        }, {
            quality: 25,
            destinationType: (<any>Camera).DestinationType.DATA_URL,
            cameraDirection: 1
          });
      }
      else {
        alert("camera not found");

      }
    });

    promise.then((image) => {
      this.loadingText = true;
      this.capturedImage = image;
      this.detectText();
    })
      .catch((error) => {
        console.log(error);
      });
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

  detectText(): any {
    this.encodeImage();
    this.appService.detectText(this.sourceImageBytes)
      .then((textDetectionList: any) => {
        this.retrieveInformation(textDetectionList);
      }).catch((error: any) => {
        this.loadingText = false;
        this.signUpFailed = true;
        console.log(error); // an error occurred
      });
  }


  retrieveInformation(textDetectionList): void {
    let name: string;
    let filteredList = map(filter(textDetectionList, item => {
      let text: string = item.DetectedText;
      if (item.Type === 'LINE' && includes(text, 'Card')) {
        name = split(text, ' Card')[0];
      }

      return size(text) > 2 && !includes(text, 'Licence') && !includes(text, 'Card') && !includes(text, 'Date') &&
        !includes(text, 'Driver Licence') && !includes(text, 'New South Wales') && item.Type === 'LINE';
    }), 'DetectedText');

    var dateString: string = filteredList[size(filteredList) - 1] || '';
    let person: Person = {
      name,
      cardNumber: this.isNumeric(get(filteredList, '[0]')) ? get(filteredList, '[0]') : '-',
      address: `${get(filteredList, '[1]')} ${get(filteredList, '[2]')} ${get(filteredList, '[3]')}`,
      licenceNo: this.isNumeric(get(filteredList, '[4]')) ? get(filteredList, '[4]') : '-',
      licenseClass: get(filteredList, '[5]'),
      dateOfBirth: this.isValidDate(dateString.slice(0, 11)) ? dateString.slice(0, 11) : '-',
      dateOfExpiry: this.isValidDate(dateString.slice(12)) ? dateString.slice(12) : '-',
    }
    this.person = person;
    this.loadingText = false;

    console.log(this.person);
    console.log(filteredList)
  }

  isNumeric(num): boolean {
    return !isNaN(num.replace(/\s/g, ''));
  }

  isValidDate(date: string): boolean {
    return !isNaN(Date.parse(date));
  }

  onSubmit() {
    this.loading = true;
    this.signUpFailed = false;
    this.signUpSuccess = false;
    this.encodeImage();
    //clean -up start
    this.appService.searchFacesByImage(this.sourceImageBytes)
      .then((data: any) => {
        this.appService.deleteFaces(data.facesIds);
      }).catch((error: any) => {
        console.log(error); // an error occurred
      });

    //clean-up end
    this.appService.indexFaces(this.sourceImageBytes)
      .then((faceID: string) => {
        this.appService.putItem(faceID, this.model.email, this.person)
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
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(stream => {
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
