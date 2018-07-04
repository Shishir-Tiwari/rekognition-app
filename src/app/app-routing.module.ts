import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from './login/login.component';
import {SignupComponent} from './signup/signup.component';
// import {InsuranceComponent} from './insurance/insurance.component';
// import {CompareComponent} from './compare/compare.component';
import {MaintainComponent} from './maintain/maintain.component';
const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'sign-up', component: SignupComponent },
  // { path: 'insurance', component: InsuranceComponent },
  // { path: 'compare', component: CompareComponent },
  { path: 'maintain', component: MaintainComponent },
];

@NgModule({
  exports: [ RouterModule ],
  imports: [ RouterModule.forRoot(routes) ],
})
export class AppRoutingModule {}
