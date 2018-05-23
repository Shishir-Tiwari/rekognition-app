import { Component, OnInit } from '@angular/core';
import {AppService} from '../app.service';

@Component({
  selector: 'app-maintain',
  templateUrl: './maintain.component.html',
  styleUrls: ['./maintain.component.css']
})
export class MaintainComponent implements OnInit {
  facesLength:any;
  constructor(private appService: AppService) { }

  ngOnInit() {
  }

  deleteAllFaces() {
    this.appService.deleteFaces();
  }

  getAllFaces() {
    this.appService.getAllFaces()
    .then(facesLength => {
      this.facesLength = facesLength;
    });
  }
}
