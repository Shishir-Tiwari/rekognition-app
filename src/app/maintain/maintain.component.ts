import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { map } from 'lodash';

@Component({
  selector: 'app-maintain',
  templateUrl: './maintain.component.html',
  styleUrls: ['./maintain.component.css']
})
export class MaintainComponent implements OnInit {
  facesLength: any;
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
}
