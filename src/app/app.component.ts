import { Component, OnInit } from '@angular/core';
declare var device;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'app';
  ngOnInit() {
	 document.addEventListener("deviceready", function() {
	 console.log(device.platform); 
	 }, false); 
	} 
}
