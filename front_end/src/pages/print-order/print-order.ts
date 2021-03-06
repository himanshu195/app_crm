import * as numeral from 'numeral';
import { Component } from '@angular/core';
// import { zbtprinter } from 'ionic-native';
import { ViewController, NavController, NavParams, ToastController } from 'ionic-angular';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';
import { OrdersService } from '../orders/orders.service';
import { CustomersService } from '../clientes/customers.service';
import { DatabaseService } from '../sync/database.service';
import { ProductsService } from '../products/products.service';

import moment from 'moment';

/**
 * Generated class for the SkillAutocompletePage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
declare var cordova;
@Component({
  selector: 'print-order-page',
  templateUrl: 'print-order.html',
})
export class PrintOrderPage {
  orderObj: any;
  order: { component: any };
  loginObj: any = [];
  address = '';
  totalProducts = 0;
  devicesList: any = [];
  // address = '';
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public customersService: CustomersService,
    public viewCtrl: ViewController,
    public toastCtrl: ToastController,
    public ordersService: OrdersService,
    public productsService: ProductsService,
    public databaseService: DatabaseService,
    private bluetoothSerial: BluetoothSerial
  ) {
    this.orderObj = this.navParams.get('order');
    let me = this;
    this.databaseService.getLoginData()
      .then(
        response => {
          me.loginObj = response;
          console.log(me.loginObj);
        }
      );

  }

  ionViewWillLoad() {

  }

  ionViewDidEnter() {
    this.bluetoothSerial.list()
      .then(data => {
        this.devicesList = data;
      });
  }

  getProductTotal(product) {
    let price = product.product.ch;
    if (this.orderObj.customerObj.property_product_pricelist == '2') {
      price = product.product.cm;
    } else if (this.orderObj.customerObj.property_product_pricelist == '3') {
      price = product.product.cg;
    }

    return product.quantity * price;
  }

  getTotal() {
    let total = 0.0;
    for (var i = 0; i < this.orderObj.selectedProducts.length; i++) {
      total += this.getProductTotal(this.orderObj.selectedProducts[i]);//this.selectedProducts[i].product.price * this.selectedProducts[i].quantity;
    }
    return total;
  }
  getProductPrice(product) {
    let price = product.product.ch;
    let customerObj = this.orderObj.customerObj;
    if (customerObj.property_product_pricelist == '2') {
      price = product.product.cm;
    }
    else if (customerObj.property_product_pricelist == '3') {
      price = product.product.cg;
    }
    // console.log(price);
    return price;
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  cancel() {
    this.viewCtrl.dismiss();
  }

  // New function to print in zebra lang
  printOrder() {
    if (this.orderObj) {
      moment.lang('es-us');
      this.orderObj.confirmed = true;

      // Up-date customer, set flag totalVentasApp true
      this.orderObj.customerObj.totalVentasApp = 1;
      this.orderObj.customerObj.rm_sync_date_time = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
      // console.log(this.orderObj.customerObj);
      this.customersService.updateCustomer(this.orderObj.customerObj);

      console.log(this.orderObj);
      if (!this.orderObj.numberOrder || this.orderObj.numberOrder == 0) {
        let co = this.ordersService.confirmedOrders ? this.ordersService.confirmedOrders : 0;
        this.ordersService.confirmedOrders = co + 1;
        this.orderObj.numberOrder = this.ordersService.confirmedOrders;
      }
      this.ordersService.updateOrder(this.orderObj);
      for (var j = 0; j < this.orderObj.selectedProducts.length; j++) {
        var product = this.orderObj.selectedProducts[j];
        //console.log(product);
        this.productsService.updateProductPT(product.product.id, parseInt(product.quantity, 10));

      }
      // alert("impresion");
      console.log("impresion");
      let zebra_receipt = '';
      let zebra_receipt_header = '';
      let zebra_receipt_body = '';
      let zebra_receipt_total = '';
      let zebra_receipt_footer = '';

      let zebra_receipt_body_height = 450;
      let zebra_receipt_body_total_height = 0;
      let zebra_receipt_total_height = 450;
      let zebra_receipt_footer_height = 600;

      let margin_top = '10';

      let empresa = '';
      let phone = '';
      let vendedor = this.loginObj.rmDatosUsuario.name;

      // Imprimir solamente pedidos con numeracion
      let numero = this.orderObj.numberOrder;
      if (numero > 0) {
        console.log("orderObj:" + JSON.stringify(this.orderObj));
        // $window.orderObj = this.orderObj;

        zebra_receipt_header = `
        ^XA
        ^MNN
        ^LL1100
        ^CFR,15
        ^FO0,30^FB580,3,0,C,0^FD` + empresa + `^FS
        ^FO0,70^FB580,3,0,C,0^FDPEDIDO NUMERO: ` + numero + `^FS
        ^FO0,110^FB580,3,0,C,0^FDCochabamba - Bolivia^FS
        ^CFQ
        ^FO5,180^FD Fecha: ` + moment(this.orderObj.dateOrder).format('D MMMM YYYY, h:mm a') + `^FS
        ^FO5,210^FD Vendedor: ` + vendedor + `^FS
        ^FO5,240^FD Cliente: ` + this.orderObj.customerObj.name + `^FS
        ^FO5,270^FD NIT: ` + this.orderObj.customerObj.nit + `^FS
        ^FO5,300^FD Direccion: ` + this.orderObj.customerObj.street + `^FS
        ^FO5,330^FD Telefono: ` + this.orderObj.customerObj.phone + `^FS
        ^FO5,360^FD Celular: ` + this.orderObj.customerObj.mobile + `^FS

        ^CFF,20
        ^LRY
        ^FO0,400^GB600,40,30^FS
        ^FO5,410^FDPRODUCTO       CANT PRECIO    TOTAL^FS
        ^CFQ
        `;

        for (var i = 0; i < this.orderObj.selectedProducts.length; i++) {
          let productCountLetters = this.orderObj.selectedProducts[i]['product']['product'].length;
          let quantity = (this.orderObj.selectedProducts[i]['quantity']);
          quantity = numeral(quantity).format('0,0');
          // console.log('quantity:' + quantity);
          let price = (this.getProductPrice(this.orderObj.selectedProducts[i]));
          price = numeral(price).format('0,0.00');
          // console.log('price:' + price);
          let subtotal = (price * this.orderObj.selectedProducts[i]['quantity']);
          subtotal = numeral(subtotal).format('0,0.00');
          // console.log('subtotal:' + subtotal);
          console.log("productCountLetters:" + productCountLetters);
          zebra_receipt_body += `
          ^FO0,` + zebra_receipt_body_height + `
          ^FB250,5,0,L,0
          ^FD` + this.orderObj.selectedProducts[i]['product']['product'] + `^FS

          ^FO250,` + zebra_receipt_body_height + `
          ^FB60,5,0,R,0
          ^FD` + quantity + `^FS

          ^FO320,` + zebra_receipt_body_height + `
          ^FB100,5,0,R,0
          ^FD` + price + `^FS

          ^FO410,` + zebra_receipt_body_height + `
          ^FB150,5,0,R,0
          ^FD` + subtotal + `^FS
          `;
          zebra_receipt_body_height = zebra_receipt_body_height + 30;
          zebra_receipt_body_total_height += 30;
          if (productCountLetters > 22) {
            zebra_receipt_body_total_height += 30;
            zebra_receipt_body_height += 30;
          }
        }

        zebra_receipt_total_height += zebra_receipt_body_total_height;

        let gran_total = numeral(this.orderObj.total).format('0,0.00');;

        zebra_receipt_total = `
        ^FO5,` + (zebra_receipt_total_height - 5) + `^GB600,3,3^FS
        ^FO0,` + zebra_receipt_total_height + `
        ^FB250,5,0,L,0
        ^FDGRAN TOTAL^FS

        ^FO250,` + zebra_receipt_total_height + `
        ^FB60,5,0,R,0
        ^FD^FS

        ^FO410,` + zebra_receipt_total_height + `
        ^FB150,5,0,R,0
        ^FD` + gran_total + `^FS
        `;

        zebra_receipt_footer_height += zebra_receipt_body_total_height;
        zebra_receipt_footer = `
        ^CFR,15
        ^FO5,` + (zebra_receipt_footer_height - 15) + `^GB600,1,1^FS
        ^FO5,` + zebra_receipt_footer_height + `^FB580,3,0,C,0^FDFirma Cliente^FS
        ^FO5,` + (zebra_receipt_footer_height + 140) + `^GB600,1,1^FS
        ^FO5,` + (zebra_receipt_footer_height + 150) + `^FB580,3,0,C,0^FDFirma Vendedor^FS
        ^FO5,` + (zebra_receipt_footer_height + 200) + `^FB580,3,0,C,0^FDGracias por su Compra!!^FS
        ^FO5,` + (zebra_receipt_footer_height + 230) + `^FB580,3,0,C,0^FDFelices Fiestas!!^FS
        ^FO0,` + (zebra_receipt_footer_height + 260) + `^FB580,3,0,C,0^FD^FS
        ^XZ
        `;

        zebra_receipt = zebra_receipt_header + zebra_receipt_body + zebra_receipt_total + zebra_receipt_footer;
        // zebra_receipt = 'sd';
        // console.log("zebra_receipt_header:" + zebra_receipt_header);
        // console.log("zebra_receipt_body:" + zebra_receipt_body);
        // console.log("zebra_receipt_total:" + zebra_receipt_total);
        // console.log("zebra_receipt_footer:" + zebra_receipt_footer);
        // console.log("zebra_receipt_body_height:" + zebra_receipt_body_height);
        // console.log("zebra_receipt_body_total_height:" + zebra_receipt_body_total_height);
        // console.log("zebra_receipt_total_height:" + zebra_receipt_total_height);
        // console.log("zebra_receipt_footer_height:" + zebra_receipt_footer_height);
        console.log("zebra_receipt:" + zebra_receipt);
        //alert(this.ordersService.macAddress);
        // cordova.plugins.zbtprinter.print(this.ordersService.macAddress, "^XA^FO20,20^A0N,25,25^FD " + zebra_receipt + " ^FS^XZ",
        // this.print2Zebra(zebra_receipt);
        this.print2Zebra(zebra_receipt);
      }
    }
  }

  print2Zebra(zebra_receipt) {
    let me = this;
    cordova.plugins.zbtprinter.print(this.ordersService.macAddress, zebra_receipt,
      function(success) {
        let toast = me.toastCtrl.create({
          message: "Impresion Satisfactoria" + success,
          duration: 3000,
          cssClass: 'toast-error',
          position: 'bottom',
        });
        toast.present();
        me.navCtrl.pop();
      },
      function(fail) {
        let toast = me.toastCtrl.create({
          message: "Impresion fallida:" + fail,
          duration: 3000,
          cssClass: 'toast-error',
          position: 'bottom',
        });
        toast.present();
      }
    );
  }

  findPrinter() {
    cordova.plugins.zbtprinter.find(
      function(result) {
        if (typeof result == 'string') {
          this.address = result;
        } else {
          this.address = result.address;
        }
        alert('Zbtprinter: connect success: ' + this.address);
      }, function(error) {
        alert('Zbtprinter: connect fail: ' + error);
      }
    );
  }

}
