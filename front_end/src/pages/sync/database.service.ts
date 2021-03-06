import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import { Platform } from 'ionic-angular';
import { AlertController } from 'ionic-angular';


@Injectable()
export class DatabaseService {
  private _db;
  private _customers:any = [];;
  private _orders;
  private _positions;
  private _events;
  private _estados;
  private _products;

  constructor(
    private platform: Platform,
    public alertCtrl: AlertController
  ) {
    this.platform.ready().then(() => {
      this.initDB();
    });
  }

  initDB() {
    // this._db = new PouchDB('Romilax.com.db', { adapter: 'idb' });
    this._db = new PouchDB('Romilax.com.db');
  }

  // Eliminar Base de datos
  deleteDB() {
    let db = this._db;
    db.allDocs().then(function(result) {
      // Promise isn't supported by all browsers; you may want to use bluebird
      return Promise.all(result.rows.map(function(row) {
        return db.remove(row.id, row.value.rev);
      }));
    }).then(function() {
      console.log("deleteDB");
    }).catch(function(err) {
      // error!
    });
  }

	addLoginData(login) {
		login._id = "loginObj";
		return this._db.put(login);
	}

	deleteLoginData() {
		let me = this;
		return this._db.get("loginObj").then(function(doc) {
			return me._db.remove(doc);
		})
	}

	getLoginData() {
    if (!this._db)
      this.initDB();
		return this._db.get("loginObj");
	}



	addCustomer(customer) {
		let id = "customer-" + customer.id;
		let db = this._db;
		customer._id = "customer-" + customer.id;
		customer.type = "customer";
		this._db.get(id).then(function(doc) {
			customer._rev = doc._rev;
			return db.put(customer);
		}).catch(function(err) {
			// console.log(err);
			return db.put(customer);
		});

	}

	getCustomer(_id) {
		let id = "customer-" + _id;
		return this._db.get(id);
	}











  deleteAllCustomer() {

		if (!this._db)
			this.initDB();

		return new Promise(resolve => {
		  this._db.allDocs({
			include_docs: true,
			startkey: 'customer',
			endkey: 'customer\ufff0'
		  })
			.then(docs => {

			  // Each row has a .doc object and we just want to send an
			  // array of customer objects back to the calling controller,
			  // so let's map the array to contain just the .doc objects.
				let j = 0;
				this._customers = [];
				for(var i=0; i<docs.rows.length; i++) {
					let row = docs.rows[i];
					if (row.doc.type == "customer") {
            console.log(JSON.stringify(row) + "Eliminado");
            // console.log(JSON.stringify(row.doc._id) + "Eliminado2");
            this._db.remove(row.doc._id, row.doc._rev)
            .catch(function(err) {
              console.log(err);
            });
					}
				}
	    });
				// resolve(this._customers);
		});
	}


















	deleteCustomer(customer) {
		this._db.remove(customer._id, customer._rev)
		.catch(function(err) {
			console.log(err);
		});
	}

	updateCustomer(customer) {
		let id = "customer-" + customer.id;
		customer._id = "customer-" + customer.id;
		customer.type = "customer";
		this._db.put(customer).then(function(doc) {
      console.log('Cliente actualizado:' + doc);
			return doc;
		}).catch(function(err) {
			console.log(err);
		});
	}

	addProduct(product) {
		let id = "product-" + product.id;
		let db = this._db;
		product._id = "product-" + product.id;
		product.type = "product";
		product.originalStock = parseInt(product.stock,10);
		this._db.get(id).then(function(doc) {
			product._rev = doc._rev;
			return db.put(product);
		}).catch(function(err) {
      // console.log(err);
			product.stock = parseInt(product.stock,10);
			db.put(product).then(function(doc) {
				return doc;
			}).catch(function(err) {
			  // console.log(err);
			});
		});

	}



	stockProduct(_id, quantity) {
		let id = "product-" + _id;
		let db = this._db;
		this._db.get(id).then(function(doc) {
			doc.stock = doc.stock + parseInt(quantity,10);
			db.put(doc).then(data => {
				console.log(data);
			});;
		});
	}

	updateProductPT(_id, pt) {
		let id = "product-" + _id;
		let db = this._db;
		this._db.get(id).then(function(doc) {
			doc.pt = pt;
			db.put(doc).then(data => {
				console.log(data);
			});;
		});
	}

	updateProduct(product) {
		return this._db.put(product).then(data => {
			console.log(data);
		});;

	}

	updateOrder(order) {
		order.type = "order";
		return this._db.put(order).then(data => {
			console.log(data);
		});;

	}

	addOrder(order) {
		order.type = "order";
		order._id = "order-" + Date.now();
		return this._db.put(order).then(data => {
			console.log(data);
		});;
	}


	addPosition(position) {
		position.type = "latlng";
		position._id = "latlng-" + Date.now();
		return this._db.put(position).then(data => {
			console.log(data);
		});;
	}

	addEvent(event) {

		if (event.start_datetime) {
			var re = / /gi;
			var str = event.start_datetime ? event.start_datetime : "";
			var newstr = str.replace(re, "-");
			var re = /:/gi;
			var newstr = newstr.replace(re, "-");
			var str = event.name;
			event.type = "cevent";
			var id = "cevent-" + str.toLowerCase() + "-" + newstr;
			event._id = "cevent-" + str.toLowerCase() + "-" + newstr;
			let db = this._db;
			this._db.get(id).then(function(doc) {
			return doc;
			}).catch(function(err) {
			console.log(err);
			return db.put(event);
			});
		}
	}

  addEstadoEvent(estado) {
		estado._id = "estado-" + Date.now();
		return this._db.put(estado).then(data => {
			console.log(data);
		});;
	}

	updateEvent(event) {

		event.type = "cevent";
		return this._db.put(event).then(data => {
			console.log(data);
		});;
	}

	updatePosition(position) {
		return this._db.put(position).then(data => {
			console.log(data);
		});;
	}

	  deletePosition(position) {
		return this._db.remove(position);
	  }

  deleteOrder(order) {
    return this._db.remove(order);
  }

  update(customer) {
    return this._db.put(customer);
  }

  delete(customer) {
    return this._db.remove(customer);
  }

	getAllOrders() {
		if (!this._db)
			this.initDB();
		return new Promise(resolve => {
			this._db.allDocs({
				include_docs: true,
				startkey: 'order',
				endkey: 'order\ufff0'
			})
			.then(docs => {

				// Each row has a .doc object and we just want to send an
				// array of customer objects back to the calling controller,
				// so let's map the array to contain just the .doc objects.

				this._orders = docs.rows.map(row => {
					// Dates are not automatically converted from a string.
					if (row.doc.type == "order")
						return row.doc;
				});


				resolve(this._orders);
			});

		});

	}

	getAllSyncOrders() {
		if (!this._db)
			this.initDB();
		return new Promise(resolve => {
			this._db.allDocs({
				include_docs: true,
				startkey: 'order',
				endkey: 'order\ufff0'
			})
			.then(docs => {

				// Each row has a .doc object and we just want to send an
				// array of customer objects back to the calling controller,
				// so let's map the array to contain just the .doc objects.
				this._orders = [];
				for(var i=0; i<docs.rows.length; i++) {
					let row = docs.rows[i];
					if (row.doc.type == "order" && row.doc.sync == 1 && row.doc.confirmed == 1)
						this._orders.push(row.doc);
				}


				resolve(this._orders);
			});

		});

	}

	getConfirmedOrdersCount() {
		if (!this._db)
			this.initDB();
		return new Promise(resolve => {
			this._db.allDocs({
				include_docs: true,
				startkey: 'order',
				endkey: 'order\ufff0'
			})
			.then(docs => {

				// Each row has a .doc object and we just want to send an
				// array of customer objects back to the calling controller,
				// so let's map the array to contain just the .doc objects.
				let count = 0;
				for(var i = 0; i < docs.rows.length; i++) {
					let row = docs.rows[i];
					if (row.doc.type == "order" && row.doc.confirmed === true) {
						count++;
					}
				}
				resolve(count);
			});

		});

	}

	getAllCustomers(searchTerm = '') {
		if (!this._db)
			this.initDB();

		return new Promise(resolve => {
		  this._db.allDocs({
			include_docs: true,
			startkey: 'customer',
			endkey: 'customer\ufff0'
		  })
			.then(docs => {

			  // Each row has a .doc object and we just want to send an
			  // array of customer objects back to the calling controller,
			  // so let's map the array to contain just the .doc objects.
				let j = 0;
				this._customers = [];
				for(var i=0; i<docs.rows.length; i++) {
					let row = docs.rows[i];
					if (row.doc.type == "customer") {
						if(searchTerm) {
							if(row.doc.name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1) {
								this._customers.push(row.doc);
								j++;
							}
						} else {
							this._customers.push(row.doc);
							j++;
						}
					}
					if( j == 30) {
						break;
					}
				}
				resolve(this._customers);
			});

		});
	}

	getUploadCustomers() {
		if (!this._db)
			this.initDB();

		return new Promise(resolve => {
		  this._db.allDocs({
			include_docs: true,
			startkey: 'customer',
			endkey: 'customer\ufff0'
		  })
			.then(docs => {

			  // Each row has a .doc object and we just want to send an
			  // array of customer objects back to the calling controller,
			  // so let's map the array to contain just the .doc objects.
				let j = 0;
				this._customers = [];
				for(var i=0; i<docs.rows.length; i++) {
					let row = docs.rows[i];
					if (row.doc.type == "customer") {
						if(parseInt(row.doc.newCustomer,10) > 0) {
							this._customers.push(row.doc);
						}
					}
				}
				resolve(this._customers);
			});

		});
	}

	getCustomerRoutes() {
		if (!this._db)
			this.initDB();

		return new Promise(resolve => {
		  this._db.allDocs({
			include_docs: true,
			startkey: 'customer',
			endkey: 'customer\ufff0'
		  })
			.then(docs => {

			  // Each row has a .doc object and we just want to send an
			  // array of customer objects back to the calling controller,
			  // so let's map the array to contain just the .doc objects.
				let j = 0;
				this._customers = [];
				var d = new Date();
				var day = d.getDay();
				//console.log(day);
				for(var i=0; i<docs.rows.length; i++) {
					let row = docs.rows[i];
					if (row.doc.type == "customer") {
						//console.log(row.doc.rm_dias_semana);
						if(this.inArray(day, row.doc.rm_dias_semana)) {
							this._customers.push(row.doc);
						}
					}
				}
				resolve(this._customers);
			});

		});
	}

	inArray(needle, haystack) {
		var length = haystack.length;
		for(var i = 0; i < length; i++) {
			if(haystack[i] == needle) return true;
		}
		return false;
	}

  getAllPositions() {
    if (!this._db)
      this.initDB();
    return new Promise(resolve => {
      this._db.allDocs({
        include_docs: true,
        startkey: 'latlng',
        endkey: 'latlng\ufff0'
      })
        .then(docs => {

          // Each row has a .doc object and we just want to send an
          // array of customer objects back to the calling controller,
          // so let's map the array to contain just the .doc objects.
		  this._positions = [];

		  for(var i=0; i<docs.rows.length; i++) {
			let row = docs.rows[i];
			if (row.doc.type == "latlng") {
				//console.log(row.doc.rm_dias_semana);
				if(row.doc.sync == 1) {
					this._positions.push(row.doc);
				}
			}
		}

          // Listen for changes on the database.
          resolve(this._positions);
        });

    });
  }

  getAllEvents() {
    if (!this._db)
      this.initDB();
    return new Promise(resolve => {
      this._db.allDocs({
        include_docs: true,
        startkey: 'cevent',
        endkey: 'cevent\ufff0'
      })
        .then(docs => {

          // Each row has a .doc object and we just want to send an
          // array of customer objects back to the calling controller,
          // so let's map the array to contain just the .doc objects.

          this._events = docs.rows.map(row => {
            // Dates are not automatically converted from a string.
            if (row.doc.type == "cevent")
              return row.doc;
          });

          // Listen for changes on the database.
          resolve(this._events);
        });

    });
  }

  getAllSyncEvents() {
    if (!this._db)
      this.initDB();
    return new Promise(resolve => {
      this._db.allDocs({
        include_docs: true,
        startkey: 'cevent',
        endkey: 'cevent\ufff0'
      })
        .then(docs => {

          // Each row has a .doc object and we just want to send an
          // array of customer objects back to the calling controller,
          // so let's map the array to contain just the .doc objects.

		  this._events = [];
			for(var i=0; i<docs.rows.length; i++) {
				let row = docs.rows[i];
				if (row.doc.type == "cevent"  && row.doc.sync == 0) {
					this._events.push(row.doc);
				}
			}


          // Listen for changes on the database.
          resolve(this._events);
        });

    });
  }

  getAllEstadoEvents() {
    if (!this._db)
      this.initDB();
    return new Promise(resolve => {
      this._db.allDocs({
        include_docs: true,
        startkey: 'estado',
        endkey: 'estado\ufff0'
      })
        .then(docs => {
          // Each row has a .doc object and we just want to send an
          // array of customer objects back to the calling controller,
          // so let's map the array to contain just the .doc objects.

          this._estados = docs.rows.map(row => {
            // Dates are not automatically converted from a string.
            // if (row.doc.type == "estado")
              return row.doc;
          });
          // console.log(this._estados);

          // Listen for changes on the database.
          resolve(this._estados);
        });

    });
  }

	getAllProducts(searchTerm = '') {
		if (!this._db)
			this.initDB();

		return new Promise(resolve => {
			this._db.allDocs({
				include_docs: true,
				startkey: 'product',
				endkey: 'product\ufff0'
			})
			.then(docs => {

			  // Each row has a .doc object and we just want to send an
			  // array of customer objects back to the calling controller,
			  // so let's map the array to contain just the .doc objects.
				let j = 0;
				this._products = [];
				for(var i=0; i<docs.rows.length; i++) {
					let row = docs.rows[i];
					if (row.doc.type == "product") {
						if(searchTerm) {
							if(row.doc.product.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1) {
								this._products.push(row.doc);
								j++;
							}
						} else {
							this._products.push(row.doc);
							j++;
						}
					}
					if( j == 100) {
						break;
					}
				}
				// Listen for changes on the database.
				resolve(this._products);
			});

		});
	}
}
