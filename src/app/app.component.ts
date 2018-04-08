import { Component, OnInit } from '@angular/core';
import AppService from './app.service';
declare var device;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ AppService],
})

export class AppComponent implements OnInit {
  title = 'hello app';
  loading = false;
  error = false;
  success = false;
  preview = false;

  constructor(private appService: AppService) { }

  ngOnInit() { }

  processImage(file) {
    const preview = document.querySelector('img[name=preview]');
    const reader = new FileReader();
    this.preview = false;
    reader.onload = (e: any) => {  // Load base64 encoded image
      const result = e.target.result;
      (<HTMLImageElement>preview).src = result;
      this.preview = true;
      this.encodeImage(result);
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
    // Call Rekognition
    this.detectLabels(imageBytes);
  }

  detectLabels(imageBytes) {
    this.error = false;
    this.loading = true;
    this.appService.detectLabels(imageBytes).then((data: any) => {
      this.loading = false;
      this.success = true;
      let table = '<table height="350px" class="table table-dark table-striped"><tr><th>Name</th><th>Confidence</th></tr>';
        console.log(data.Labels);
        for (let i = 0; i < data.Labels.length; i++) {
          table += '<tr><td>' + data.Labels[i].Name +
            '</td><td>' + data.Labels[i].Confidence + '</td></tr>';
        }
        table += '</table>';
        document.getElementById('opResult').innerHTML = table;
    }).catch((err) => {
      this.error = true;
      this.loading = false;
      console.log(err); // an error occurred
    });
  }

  uploadImage(event: any) {
    this.loading = false;
    this.success = false;
    this.error = false;
    const file = (<HTMLInputElement>event.target).files[0];
    this.processImage(file);
  }
}
