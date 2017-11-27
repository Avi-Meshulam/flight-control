import { NgModule } from '@angular/core';
import { UiSwitchModule } from 'ngx-ui-switch';
import { SharedModule } from '../../shared/shared.module';
import { ControlTowerComponent } from './control-tower.component';
import { DataService } from './services/data.service';
import { SocketService } from './services/socket.service';
import { SettingsComponent } from './settings/settings.component';

@NgModule({
	imports: [
		SharedModule, 
		UiSwitchModule
	],
	declarations: [
		ControlTowerComponent,
		SettingsComponent
	],
	providers: [
		SocketService, 
		DataService
	],
	entryComponents: [ControlTowerComponent]
})
export class ControlTowerModule { }
