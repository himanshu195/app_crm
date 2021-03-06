<?php
header("Content-Type: text/javascript");
error_reporting(1);
require_once('rmOdooConfig.php');
require_once('rmDbConfig.php');
require_once('xmlrpc_lib/ripcord.php');
require_once('rmFunciones.php');

// print_r($_REQUEST);
switch ($_REQUEST["task"]) {

    case 'rmRutaDiaria':
    // rmRutaDiaria($data);
      rmRutaDiaria($db);
    break;

    case 'rmRegistrarEvento':
      rmRegistrarEvento($data);
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

function rmRutaDiaria($db) {
    try {
        $vendedor = $_REQUEST['res_user_id'];
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
        (select count(id) from sale_order AS so where so.partner_id = p.id and so.user_id = ".$vendedor." AND to_char(now() - interval '4 hour', 'YYYY/MM/DD') = to_char(so.date_order - interval '4 hour', 'YYYY/MM/DD') ) as total_ventas,
        string_agg(d.nro_dia::character varying, ',') AS rm_dias_semana
        FROM
        res_partner AS p
        INNER JOIN partner_id ON partner_id.dias_id = p.id
        INNER JOIN rm_dias_semana AS d ON partner_id.rm_dias_semana_id = d.id
        WHERE d.nro_dia  = extract(dow from  current_date - interval '4 hour')
        AND user_id = ".$vendedor."
        GROUP BY 1,2,3,4,5,6,7,8,9,10,11
        ORDER by p.name
        ";

        $query = pg_query($db, $sql);
        if(!$query){
        echo "Error".pg_last_error($db);
        exit;
        }

        $resultado = pg_fetch_all($query);

        echo $_GET['callback'].'({"rmRutaDiaria": ' . json_encode($resultado) . '})';
        pg_close($db);

    } catch(PDOException $e) {
        echo $_GET['callback'].'({"error":{"text":'. pg_last_error($db) .'}})';
        exit;
    }
}

function rmRutaDiariaAntiguo($conex, $user_id) {
  try {
    $url = $conex['url'];
    $db = $conex['db'];
    $username = $conex['username'];
    $password = $conex['password'];

    $user_id = intval($_REQUEST['res_user_id']);

    $day_number = date('N');
    $filtroCliente =
    array(
      array(
        array('user_id','=',$user_id),
        array('rm_dias_semana','in',[$day_number])
      )
    );


    $uid = login($conex);
    $models = ripcord::client("$url/xmlrpc/2/object");
    $rmRutaDiaria = $models->execute_kw($db, $uid, $password,
        'res.partner', 'search_read', $filtroCliente,
        array('fields'=>array(
        'id',
        'name',
        'street',
        'phone',
        'mobile',
        'rm_longitude',
        'rm_latitude',
        'user_id',
        'razon_social',
        'rm_dias_semana'
        ), 'limit'=>10000));

    if (count($rmRutaDiaria)>0) {
      echo $_GET['callback'].'({"rmRutaDiaria": ' . json_encode(utf8_converter($rmRutaDiaria)) . '})';
    } else {
      echo $_GET['callback'].'({"rmRutaDiaria": "false"})';
    }
  } catch(PDOException $e) {
      echo $_GET['callback'].'({"error":{"text":'. pg_last_error($db) .'}})';
      exit;
  }
}

function rmRegistrarEvento($conex) {

      $url = $conex['url'];
      $db = $conex['db'];
      $username = $conex['username'];
      $password = $conex['password'];
      // $username = 'gustavo@gmail.com';
      // $password = '123456';

      $res_user_id=intval($_REQUEST['res_user_id']);
      $name=$_REQUEST['name'];
      $partner_ids=$_REQUEST['partner_ids'];
      $duration=$_REQUEST['duration'];
      $description=$_REQUEST['description'];
      $start_datetime=$_REQUEST['start_datetime'];

      $datosEvento =
      array(
        array(
          'user_id' => $res_user_id,
          // 'write_id' => $res_user_id,
          // 'create_id' => $res_user_id,
          'name' => $name,
          'start_datetime' => $start_datetime,
          'start' => $start_datetime,
          'stop' => $start_datetime,
          // 'partner_ids' => $partner_ids,
          // 'duration' => $duration,
          // 'description' => $description,
        )
      );

      $uid = login($conex);
      $models = ripcord::client("$url/xmlrpc/2/object");
      $id = $models->execute_kw($db, $uid, $password, 'calendar.event', 'create', $datosEvento);

      if (Is_Numeric ($id)) {
        echo $_GET['callback'].'({"order_id": '. $id . '})';
      } else {
        print_r($_REQUEST);
        print_r($datosEvento);
        print_r($id);
      }
  }

?>
