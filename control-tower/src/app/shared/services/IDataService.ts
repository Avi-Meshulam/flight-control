export interface IDataService {
	getAll(collection: string, conditions?: object): Promise<object[]>;
	getOne(collection: string, id: any): Promise<object>;
	create(collection: string, item: object): Promise<object>;
	update(collection: string, conditions: object, data: object): Promise<object>;
	delete(collection: string, conditions: object): Promise<object>;
}
