import { async, inject, TestBed } from '@angular/core/testing';
import { SocketService } from '../services/socket.service';

describe('SocketService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [SocketService]
		});
	});

	it('should ...', inject([SocketService], (service: SocketService) => {
		expect(service).toBeTruthy();
	}));
});
