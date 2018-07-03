import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AppService } from '../app.service';
import { size, includes, filter, get, split, map, each, compact, slice, join, replace } from 'lodash';
import { Person } from './person';
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})

export class SignupComponent implements OnInit {
  message: string;
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
        this.loadingText = false;
        this.signUpFailed = true;
        console.log(error); // an error occurred
      });
  }



  retrieveInformation(textDetectionList): void {
    let name: string, cardNumber, licenceNo, licenseClass, address, dateStringRaw;
    let filteredList = compact(map(filter(textDetectionList, (item, index) => {
      let text: string = item.DetectedText;

      if (item.Type === 'LINE') {
        let nextText: string = textDetectionList[index + 1].DetectedText;
        let nextNextText: string = textDetectionList[index + 2].DetectedText;
        if (includes(text, 'Card')) {
          name = split(text, ' Card')[0];
          cardNumber = nextText;
        } else if (includes(text, 'Licence No')) {
          licenceNo = nextText;
        } else if (includes(text, 'Licence Class')) {
          if(size(nextText)===1) licenseClass = nextNextText + nextText ;
          else licenseClass =  nextText ;
        } else if (includes(text, 'Date')) {
          dateStringRaw = nextText;
        }
      }
      return size(text) > 2 && !includes(text, 'Licence') && !includes(text, 'Card') &&
        !includes(text, 'Date') && !includes(text, 'Driver Licence') &&
        !includes(text, 'New South Wales') && item.Type === 'LINE';
    }), 'DetectedText'));

    console.log(filteredList);

    if (filteredList.length) {
      let dateObj = this.getDateObj(filteredList[size(filteredList) - 1]);
      if (!(dateObj.dateOfBirth && dateObj.dateOfExpiry)) {
        dateObj = this.getDateObj(dateStringRaw);
      }

      const numList = this.getNumbers(filteredList);
      console.log(numList);
      if (!cardNumber) cardNumber = numList[0];
      if (!licenceNo) licenceNo = numList[1];

      let person: Person = {
        name,
        cardNumber: this.isNumeric(cardNumber) ? cardNumber : '-',
        address: this.getAddress(filteredList),
        licenceNo: this.isNumeric(licenceNo) ? licenceNo : '-',
        licenseClass: this.isNumeric(licenseClass) ? '-' : licenseClass,
        dateOfBirth: dateObj.dateOfBirth,
        dateOfExpiry: dateObj.dateOfExpiry,
      }
      this.person = person;
      this.loadingText = false;
    } else {
      this.message = "Please capture document in landscape mode";
    }

    console.log(this.person);
  }

  getNumbers(filteredList) {
    return map(filter(filteredList, item => size(join(item.match(/\d+\s+/g), '')) > 5),
      item => join(item.match(/\d+/), ''));
  }

  getDateObj(dateString: string) {
    const date1 = join(slice(dateString, 0, 11), '');
    const date2 = slice(dateString, 12, 22).join('');
    return {
      dateOfBirth: this.isValidDate(date1) ? date1 : null,
      dateOfExpiry: this.isValidDate(date2) ? date2 : null
    };
  }

  getAddress(arrayList): string {
    let address = '-';
    for (let i = 0; i < arrayList.length; i++) {
      if (arrayList[i].includes('NSW')) {
        address = `${arrayList[i - 2]} ${arrayList[i - 1]}  ${arrayList[i]}`;
        break;
      }
    }
    return address;
  }

  isNumeric(num, regex = /\s/g): boolean {
    return !isNaN(Number(replace(num, regex, '')));
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
      navigator.mediaDevices.getUserMedia({ video: {facingMode: "environment" } }).then(stream => {
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
