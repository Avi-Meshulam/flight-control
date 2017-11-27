import { Response } from 'express';

export interface IController {
	getAll(res: Response, condition?: object, options?: object): void;
	getOne(res: Response, id: number): void;
	create(res: Response, ...docs: object[]): void;
	update(res: Response, condition: object, data: object): void;
	delete(res: Response, condition: object): void;
}