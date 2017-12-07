import { Component } from '@angular/core';
import { NavController, LoadingController, ToastController } from 'ionic-angular';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import 'rxjs/add/operator/toPromise';
import { TabsNavigationPage } from '../tabs-navigation/tabs-navigation';
import { Jsonp  } from '@angular/http';
import { OrdersService } from '../orders/orders.service';

@Component({
  selector: 'login-page',
  templateUrl: 'login.html'
})
export class LoginPage {
	login: FormGroup;
	main_page: { component: any };
	loading: any;


	constructor(
		public nav: NavController,
		public loadingCtrl: LoadingController,
		public toastCtrl: ToastController,
		public ordersService: OrdersService,
		public jsonp: Jsonp,

	) {
		this.main_page = { component: TabsNavigationPage };

		this.login = new FormGroup({
			email: new FormControl('', Validators.required),
			password: new FormControl('', Validators.required)
		});
	}

	doLogin(values){
		console.log(values);
		let loadingCtrl = this.loadingCtrl;
		let toastCtrl = this.toastCtrl;
		let loading = loadingCtrl.create();
		loading.present();
		let nav = this.nav;
		let me = this;
		let url = 'http://cloud.movilcrm.com/organica/back_end/rmXMLRPC_login.php?task=loginApp';
		url += '&username=' + values.email;
		url += '&password=' + values.password;
		url += '&callback=JSONP_CALLBACK';
		this.jsonp.request(url,{method:'Get'})
		.toPromise()
		.then(data => {
			loading.dismiss();
			console.log(data['_body']['login']);
			if(data['_body']['login'] == 'False' ){
				let toast = toastCtrl.create({
					message: "Incorrecto, intente nuevamente.",
					duration: 3000,
					cssClass: 'toast-error',
					position:'bottom',
				});
				toast.present();
			} else {
				me.ordersService.loginId = data['_body']['login'];
				let toast = toastCtrl.create({
					message: "Bienvenido!",
					duration: 3000,
					cssClass: 'toast-success',
					position:'bottom',
				});
				toast.present();
				nav.setRoot(me.main_page.component);
			}
			//console.log(data.login);
		});
		//
	}

}
