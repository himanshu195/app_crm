export class CustomersModel {
	id: string;
	_id: string;
	rm_nombre: string;
	rm_direccion:string;
	rm_telefono: string;
	rm_celular:string;
	items: Array<CustomersModel>;
	rmListaClientes : Array<CustomersModel>;
	rm_longitude:string;
	rm_latitude:string;
	photo_s:string;
	photo_m:string;
}