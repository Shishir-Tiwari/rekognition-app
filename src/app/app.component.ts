import { Component, OnInit } from '@angular/core';
import * as AWS from 'aws-sdk';
declare var device;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'hello app';
  loading = false;
  error = false;
  ngOnInit() {
    // this.loading = false;
    // this.error = false;
  }

  processImage(file) {
    const preview = document.querySelector('img[name=preview]');
    const reader = new FileReader();
    this.anonLog();
    reader.onload = (e: any) => {  // Load base64 encoded image
      const result = e.target.result;
      (<HTMLImageElement>preview).src = result;
      this.encodeImage(result);
    };
    reader.readAsDataURL(file);
  }

  anonLog() {
    // Configure the credentials provider to use your identity pool
    AWS.config.region = 'us-east-2'; // Region
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: 'us-east-2:71bd3c00-e780-43cc-ac49-e1ae9020dd18',
    });
    // Make the call to obtain credentials
    (<AWS.CognitoIdentityCredentials>AWS.config.credentials).get(function () {
      // Credentials will be available when this function is called.
      const accessKeyId = AWS.config.credentials.accessKeyId;
      const secretAccessKey = AWS.config.credentials.secretAccessKey;
      const sessionToken = AWS.config.credentials.sessionToken;
    });
  }

  encodeImage(result) {
    let image = null;
    let jpg = true;
    try {
      image = atob(result.split('data:image/jpeg;base64,')[1]);
    } catch (e) {
      jpg = false;
    }
    if (jpg === false) {
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
    // Call Rekognition
    this.detectLabels(imageBytes);
  }

  detectFaces(imageData) {
    // AWS.region = "us-east-2";
    const rekognition = new AWS.Rekognition();
    const params = {
      Image: {
        Bytes: imageData
      },
      Attributes: [
        'ALL',
      ]
    };
    this.loading = true;
    rekognition.detectFaces(params, (err, data) => {
      if (err) {
        this.error = true;
        this.loading = false;
        console.log(err, err.stack); // an error occurred
      } else {
       this.loading = false;
       let table = '<table><tr><th>Low</th><th>High</th></tr>';
        // show each face and build out estimated age table
        for (let i = 0; i < data.FaceDetails.length; i++) {
          table += '<tr><td>' + data.FaceDetails[i].AgeRange.Low +
            '</td><td>' + data.FaceDetails[i].AgeRange.High + '</td></tr>';
        }
        table += '</table>';
        document.getElementById('opResult').innerHTML = table;
      }
    });
  }

  detectLabels(imageData) {
    // AWS.region = "us-east-2";
    const rekognition = new AWS.Rekognition();
    const params = {
      Image: {
        Bytes: imageData
      },
      MaxLabels: 5,
      MinConfidence: 80
    };
    this.error = false;
    this.loading = true;
    rekognition.detectLabels(params, (err, data) => {
      if (err || data.Labels.length === 0) {
        this.error = true;
        this.loading = false;
        console.log(err); // an error occurred
      } else {
       this.loading = false;
       let table = '<table class="table table-dark table-striped"><tr><th>Name</th><th>Confidence</th></tr>';
        // show each face and build out estimated age table
        console.log(data.Labels);
        for (let i = 0; i < data.Labels.length; i++) {
          table += '<tr><td>' + data.Labels[i].Name +
            '</td><td>' + data.Labels[i].Confidence + '</td></tr>';
        }
        table += '</table>';
        document.getElementById('opResult').innerHTML = table;
      }
    });
  }

  uploadImage(event: any) {
    const file = (<HTMLInputElement>event.target).files[0];
    this.processImage(file);
  }
}
