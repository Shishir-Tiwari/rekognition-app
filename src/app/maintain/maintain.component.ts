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
  camera: any
  FILE_URI: any
  constructor(private appService: AppService) { }

  ngOnInit() {

    document.addEventListener("deviceready", function() {
    //  this.camera = navigator.camera;
    //  this.FILE_URI = Camera.DestinationType.FILE_URI
    alert('after'); 
    
    }, false); 
    
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
    this.messgae = "success";
    this.hideImage = false;
    var image = document.getElementById('capturedImage');
    (<HTMLImageElement>image).src = imageUri;
  }

  onFail() {
    this.messgae = "error";
  }

  captureImage() {
    if ( this.camera) {
      this.camera.getPicture(this.onSuccess, this.onFail, {
        quality: 25,
        destinationType: this.FILE_URI,
        saveToPhotoAlbum: true
      });
    }
    else {
      alert("camera not found");

    }
  }
}
