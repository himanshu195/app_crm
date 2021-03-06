<?php
header("Content-Type: text/javascript");
error_reporting(1);
require_once('rmOdooConfig.php');
require_once('rmDbConfig.php');
require_once('xmlrpc_lib/ripcord.php');
require_once('rmFunciones.php');

// print_r($_REQUEST);
switch ($_REQUEST["task"]) {

    case 'rmTipoCliente':
      rmTipoCliente($db);
    break;

    case 'rmListaClientes':
      rmListaClientes($data,$db);
    break;

    case 'rmRegistrarCliente':
      rmRegistrarCliente($data);
    break;

    default:
        echo "What are you doing here?";

}

function login($conex){

    $url = $conex['url'];
    $db = $conex['db'];
    $username = $conex['username'];
    $password = $conex['password'];

    $common = ripcord::client("$url/xmlrpc/2/common");

    // Autenticarse
    return $common->authenticate($db, $username, $password, array());
}

function rmListaClientes($conex, $postgresql) {
  try {
    $url = $conex['url'];
    $db = $conex['db'];
    $username = $conex['username'];
    $password = $conex['password'];

    // $user_id = $_REQUEST['res_user_id'];

    // $id=intval($_REQUEST['id']);
    $user_id = intval($_REQUEST['res_user_id']);
    // $rmDateOrder=$_REQUEST['rmDateOrder'];
    // $rmNote=$_REQUEST['rmNote'];

    $filtroCliente =
    array(
      array(
        array(
          'user_id','=',$user_id,
          // "rm_dias_semana" => array(array(6, 0, $usuarios))
          // 'rm_dias_semana','in', '[(1)]'
        )
      )
    );

    $uid = login($conex);
    $models = ripcord::client("$url/xmlrpc/2/object");
    $rmListaClientes = $models->execute_kw($db, $uid, $password,
        'res.partner', 'search_read', $filtroCliente,
        array('fields'=>array(
        'id',
        'name',
        'street',
        'phone',
        'mobile',
        'rm_longitude',
        'rm_latitude',
        'property_product_pricelist',
        'user_id',
        'razon_social',
        'rm_dias_semana',
        'nit',
        'rm_sync',
        'rm_sync_date_time',
        'rm_sync_operacion'), 'limit'=>10000));

    if (count($rmListaClientes)>0) {
      $sql = "
      SELECT

      p.id,
      p.name,
      p.street,
      p.phone,
      p.mobile,
      p.rm_latitude,
      p.rm_longitude,
      p.user_id,
      p.razon_social,
      p.nit,
      (select count(id) from sale_order AS so where so.partner_id = p.id and so.user_id = ".$user_id." AND to_char(now() - interval '4 hour', 'YYYY/MM/DD') = to_char(so.date_order - interval '4 hour', 'YYYY/MM/DD') ) as total_ventas,
      string_agg(d.nro_dia::character varying, ',') AS rm_dias_semana
      FROM
      res_partner AS p
      INNER JOIN partner_id ON partner_id.dias_id = p.id
      INNER JOIN rm_dias_semana AS d ON partner_id.rm_dias_semana_id = d.id
      WHERE d.nro_dia  = extract(dow from  now() - interval '4 hour' )
      AND user_id = ".$user_id."
      AND (select count(id) from sale_order AS so where so.partner_id = p.id and so.user_id = ".$user_id." AND to_char(now() - interval '4 hour', 'YYYY/MM/DD') = to_char(so.date_order - interval '4 hour', 'YYYY/MM/DD') ) > 0
      GROUP BY 1,2,3,4,5,6,7,8,9,10,11
      ORDER by p.name
      ";

      $query = pg_query($postgresql, $sql);
      if(!$query){
      echo "Error".pg_last_error($postgresql);
      exit;
      }

      $resultado = pg_fetch_all($query);

      // Inyectar total ventas por cliente del vendedor para rutas
      $hoydia = date('w');
      $a = 0;
      for ($i = 0; $i < count($rmListaClientes); $i++) {
        // print_r($rmListaClientes[$i]['rm_dias_semana']);
        if (in_array($hoydia,$rmListaClientes[$i]['rm_dias_semana'])) {
          // echo $rmListaClientes[$i]['rm_dias_semana'][0] . "<LUNES>";
          // echo $integer = idate('w', date("Y-m-d"));
          // echo idate("Y-m-d");
          // echo $day_number = date('w');
          // echo $i;
          for ($j = 0; $j < count($resultado); $j++) {
            if ($rmListaClientes[$i]['id'] == $resultado[$j]['id']) {
              $rmListaClientes[$i]['total_ventas'] = $resultado[$j]['total_ventas'];
            }
          }
          $rmListaClientes_depurado[$a] = $rmListaClientes[$i];
          $a++;
        // } else {
          // unset($rmListaClientes[$i]);
        }
      }

      // print_r($rmListaClientes);
      // print_r($rmListaClientes_depurado);
      // print_r($resultado);

      echo $_GET['callback'].'({"rmListaClientes": ' . json_encode(utf8_converter($rmListaClientes_depurado)) . '})';
    } else {
      echo $_GET['callback'].'({"rmListaClientes": {}})';

      // print_r($_REQUEST);
      // print_r($datosCliente);
      // print_r($rmListaClientes);
    }
  } catch(PDOException $e) {
      echo $_GET['callback'].'({"error":{"text":'. pg_last_error($db) .'}})';
      exit;
  }
}

function rmRegistrarCliente($conex, $user_id) {

    $url = $conex['url'];
    $db = $conex['db'];
    $username = $conex['username'];
    $password = $conex['password'];

    $id = intval($_REQUEST['id']);
    $name = $_REQUEST['name']  ? $_REQUEST['name'] : '';
    $street = $_REQUEST['street'] ? $_REQUEST['street']: '';
    $phone = $_REQUEST['phone'] ? $_REQUEST['phone']: '';
    $mobile = $_REQUEST['mobile'] ? $_REQUEST['mobile']: '';
    $rm_longitude = $_REQUEST['rm_longitude'] ? $_REQUEST['rm_longitude']: '';
    $rm_latitude = $_REQUEST['rm_latitude'] ? $_REQUEST['rm_latitude']: '';
    if ($id) {
      $property_product_pricelist = $_REQUEST['property_product_pricelist'] ? 'product.pricelist,'.$_REQUEST['property_product_pricelist']: 1;
    } else {
      $property_product_pricelist = $_REQUEST['property_product_pricelist'] ? 'product.pricelist,'.$_REQUEST['property_product_pricelist']: 1;
      // $property_product_pricelist = $_REQUEST['property_product_pricelist'] ? $_REQUEST['property_product_pricelist']: 1;
    }
    $user_id = intval($_REQUEST['user_id']) ? intval($_REQUEST['user_id']) : 0;
    $razon_social = $_REQUEST['razon_social'] ? $_REQUEST['razon_social'] : 'Ninguno';
    $nit = $_REQUEST['nit'] ? $_REQUEST['nit'] : '0';
    $rm_sync_date_time = $_REQUEST['rm_sync_date_time'] ? $_REQUEST['rm_sync_date_time'] : date('Y-m-d H:i:s');
    $image = $_REQUEST['photo_m'] ? $_REQUEST['photo_m'] : '';
     // = $_REQUEST[''] ? $_REQUEST['rm_dias_semana'] : '1';

    $rm_dias_semana_bruto = explode(',', $_REQUEST["rm_dias_semana"]);
    for ($j = 0; $j < count($rm_dias_semana_bruto); $j++) {
      $rm_dias_semana[] = intval($rm_dias_semana_bruto[$j]);
    }


    $datosRecibidos =
      array(
        'name' => $name,
        'street' => $street,
        'phone' => $phone,
        'mobile' => $mobile,
        'rm_longitude' => $rm_longitude,
        'rm_latitude' => $rm_latitude,
        'property_product_pricelist' => $property_product_pricelist,
        'image' => $image,
        "rm_dias_semana" => array(array(6, 0, $rm_dias_semana)),
        'user_id' => $user_id,
        'razon_social' => $razon_social,
        'nit' => $nit,
        'rm_sync_date_time' => $rm_sync_date_time,
      );

    $uid = login($conex);
    $models = ripcord::client("$url/xmlrpc/2/object");

    if ($id) {
      $datosCliente = array(array($id), $datosRecibidos);
      // print_r($datosCliente);
      $id = $models->execute_kw($db, $uid, $password, 'res.partner', 'write', $datosCliente);
    } else {
      $id = $models->execute_kw($db, $uid, $password, 'res.partner', 'create', array($datosRecibidos));
    }

    if (Is_Numeric($id) OR is_bool ($id)) {
      $resultado = true;
    } else if (is_array($id)) {
      $resultado = false;
    }

    if ($resultado) {
      echo $_GET['callback'].'({"partner_id": '. $id . ',"status":"success"})';
    } else {
      print_r($_REQUEST);
      print_r($datosRecibidos);
      print_r($id);
    }
}

?>
