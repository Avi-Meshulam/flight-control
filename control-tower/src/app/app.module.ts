import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { ControlTowerComponent } from './components/control-tower/control-tower.component';
import { ControlTowerModule } from './components/control-tower/control-tower.module';
import { SharedModule } from './shared/shared.module';

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule,
		HttpClientModule,
		ControlTowerModule,
		RouterModule.forRoot([
			{ path: '', component: ControlTowerComponent },
			{ path: '**', redirectTo: '', pathMatch: 'full' }
		]),
		SharedModule
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
