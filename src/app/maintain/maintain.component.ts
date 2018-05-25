import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { map } from 'lodash';

@Component({
  selector: 'app-maintain',
  templateUrl: './maintain.component.html',
  styleUrls: ['./maintain.component.css']
})
export class MaintainComponent implements OnInit {
  messgae: string;
  facesLength: any;
  hideImage: boolean = true;
  constructor(private appService: AppService) { }

  ngOnInit() {
  }

  deleteAllFaces() {
    this.appService.getAllFaces()
      .then((faces: string[]) => {
        this.appService.deleteFaces(faces);
        this.facesLength = faces.length;
      });
  }

  getAllFaces() {
    this.appService.getAllFaces()
      .then((faces: string[]) => {
        this.facesLength = faces.length;
      });
  }

  onSuccess(imageUri) {
    alert("sag"+ imageUri);
    this.messgae = "success";
    this.hideImage = false;
    var image = document.getElementById('capturedImage');
    (<HTMLImageElement>image).src = imageUri;
  }

  onFail() {
    this.messgae = "error";
  }

  captureImage() {
    if (navigator.camera) {
      navigator.camera.getPicture(this.onSuccess, this.onFail, {
        quality: 25,
        destinationType: Camera.DestinationType.FILE_URI,
        saveToPhotoAlbum: true,
        cameraDirection:1
      });
    }
    else {
      alert("camera not found");

    }
  }
}
