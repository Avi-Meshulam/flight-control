import { Component } from '@angular/core';

@Component({
	selector: 'fc-root',
	template: `
		<div>
			<router-outlet></router-outlet>
		</div>
	`
})
export class AppComponent {
	pageTitle: string = 'Flight Control';
}
