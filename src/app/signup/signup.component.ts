import { Component, OnInit, ViewChild } from '@angular/core';
import { AppService } from '../app.service';
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})

export class SignupComponent implements OnInit {
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
      this.signUpFailed = false;
      this.signUpSuccess = false;
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
  }

}
