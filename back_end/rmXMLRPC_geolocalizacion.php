<?php
header("Content-Type: text/javascript");
error_reporting(1);
require_once('rmOdooConfig.php');
require_once('rmDbConfig.php');
require_once('xmlrpc_lib/ripcord.php');

if (isset($_SERVER['HTTP_ORIGIN'])) {
  header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Max-Age: 86400');    // cache for 1 day
}
// print_r($_REQUEST);
switch ($_REQUEST["task"]) {

    case 'rmListaGeolocalizacion':
      rmListaGeolocalizacion($db);
    break;

    case 'rmRegistrarGeolocalizacion':
      rmRegistrarGeolocalizacion($data);
    break;

    // Lista de Geocerca
    case 'rmListaGeolocalizacionGeocerca':
      rmListaGeolocalizacionGeocerca($db);
    break;

    // Registrar Geocerca
    case 'rmRegistrarGeolocalizacionGeocerca':
      rmRegistrarGeolocalizacionGeocerca($data);
    break;

    case 'rmRegistrarGeolocalizacionGeocercaDelete':
      rmRegistrarGeolocalizacionGeocercaDelete($data);
    break;

    // case 'rmRegistrarGeocerca':
    //   rmRegistrarGeocerca($data);
    // break;

    case 'rmListaGeolocalizacionLive':
    rmListaGeolocalizacionLive($db);
    break;

    case 'rmRegistrarGeolocalizacionLive':
      rmRegistrarGeolocalizacionLive($data);
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

function rmListaGeolocalizacion ($db) {
    try {
        $sql = "SELECT * FROM rm_geolocalizacion ORDER by id;";
        $query = pg_query($db, $sql);
        if(!$query){
          echo "Error".pg_last_error($db);
        exit;
        }

        $resultado = pg_fetch_all($query);
        echo $_GET['callback'].'({"rmListaGeolocalizacion": ' . json_encode($resultado) . '})';
        pg_close($db);

    } catch(PDOException $e) {
        echo $_GET['callback'].'({"error":{"text":'. pg_last_error($db) .'}})';
        exit;
    }
}

// Lista de geocercas
function rmListaGeolocalizacionGeocerca ($db) {
    try {

      if ($_REQUEST['user_id']) {
        // echo "FILTRO USUARIO";
        $where_user = ' AND users_geocerca.res_users_id in (' . $_REQUEST['user_id'] . ")";
      }

      $sql_geocerca = "
      SELECT
      rm_geocerca.id as geocerca_id,
      rm_geocerca.name as geocerca_name
      FROM rm_geocerca,users_geocerca
      WHERE
      users_geocerca.rm_geocerca_id = rm_geocerca.id
      " . $where_user . "
      Group by 1,2;
      ";


      $sql_geocerca_users = "
      SELECT
      rm_geocerca.id as geocerca_id,
      res_users.id as user_id,
      res_users.login
      FROM rm_geocerca
      INNER JOIN users_geocerca ON users_geocerca.rm_geocerca_id=rm_geocerca.id
      INNER JOIN res_users ON res_users.id=users_geocerca.res_users_id
      ORDER by rm_geocerca.id;
      ";

      $sql_geocerca_locations = "
      SELECT
      rm_geocerca.id as geocerca_id,
      rm_geocerca.name as geocerca_name
      ,rm_coordenadas_geocerca.rm_longitude
      ,rm_coordenadas_geocerca.rm_latitude,
			rm_coordenadas_geocerca.id

      FROM rm_geocerca
      INNER JOIN rm_coordenadas_geocerca ON rm_coordenadas_geocerca.geocerca_id=rm_geocerca.id
      ORDER by geocerca_id,rm_coordenadas_geocerca.id;
      ";

      $query = pg_query($db, $sql_geocerca);
      if(!$query){
        echo "Error".pg_last_error($db);
      exit;
      }
      $resultado1 = pg_fetch_all($query);

      $query2 = pg_query($db, $sql_geocerca_users);
      if(!$query2){
        echo "Error".pg_last_error($db);
      exit;
      }
      $resultado2 = pg_fetch_all($query2);

      $query3 = pg_query($db, $sql_geocerca_locations);
      if(!$query3){
        echo "Error".pg_last_error($db);
      exit;
      }
      $resultado3 = pg_fetch_all($query3);

      // print_r($resultado3);

      // Building the ARRAY
      if ($resultado1) {
        for ($i = 0; $i < count($resultado1); $i++) {
          $users = array();
          for ($z = 0; $z < count($resultado2); $z++) {
            if ($resultado1[$i]['geocerca_id'] == $resultado2[$z]['geocerca_id']) {
              $users[] = array('id'=>$resultado2[$z]['user_id'] ,'login'=>$resultado2[$z]['login']);
            }
          }

          $locations = array();
          for ($y = 0; $y < count($resultado3); $y++) {
            if ($resultado1[$i]['geocerca_id'] == $resultado3[$y]['geocerca_id']) {
              $locations[] = array('rm_longitude'=>$resultado3[$y]['rm_longitude'] ,'rm_latitude'=>$resultado3[$y]['rm_latitude']);
            }
          }

          $geofences[] =
          array(
            'geofence'=>array(
              'id'=>$resultado1[$i]['geocerca_id'],
              'name'=>$resultado1[$i]['geocerca_name'],
              'users'=>$users,
              'locations'=>$locations
            )
          );
        }
      } else {
        echo $_GET['callback'].'({})';
        exit();
      }


      echo $_GET['callback'].'({"rmListaGeolocalizacionGeocerca": ' . json_encode($geofences) . '})';
      pg_close($db);

    } catch(PDOException $e) {
        echo $_GET['callback'].'({"error":{"text":'. pg_last_error($db) .'}})';
        exit;
    }
}

// Geocerca
function rmRegistrarGeolocalizacionGeocerca($conex) {
  $url = $conex['url'];
  $db = $conex['db'];
  $username = $conex['username'];
  $password = $conex['password'];

  $postdata = file_get_contents("php://input");
  $jsondata = json_decode($postdata);
  print_r($_REQUEST);

  // echo $locations = $_REQUEST['locations'].length;

  $usuarios = array();
  // Usuarios
  for ($j = 0; $j < count($_REQUEST["user_id"]); $j++) {
    $usuarios[] = intval($_REQUEST["user_id"][$j]);
  }

  //echo "alohaxxxxxxx";
  //print_r($usuarios);

  $datosGeocerca =
  array(
    array(
      "name" => ($_REQUEST['name']),
      // "users" => array(array(6, 0, $usuarios))
      "users" => array(array(6, 0, $usuarios))
    )
  );
  //print_r($datosGeocerca);

  $uid = login($conex);
  $models = ripcord::client("$url/xmlrpc/2/object");
  $id = $models->execute_kw($db, $uid, $password, 'rm.geocerca', 'create', $datosGeocerca);
  // echo $_GET['callback'].'({"status":"success"})';

  // Store geolocation polygon coordinates
  for ($i = 0; $i < count($_REQUEST["locations"]); $i++) {
    $datosGeocercaCoordenadas =
    array(
      array(
        'rm_longitude' => $_REQUEST["locations"][$i]["rm_longitude"],
        'rm_latitude' => $_REQUEST["locations"][$i]["rm_latitude"],
        'geocerca_id' => $id
      )
    );
    $id2 = $models->execute_kw($db, $uid, $password, 'rm.coordenadas.geocerca', 'create', $datosGeocercaCoordenadas);
  }

  if (Is_Numeric ($id)) {
    header('HTTP/1.1 200 OK');
    echo $_GET['callback'].'({"rmRegistrarGeolocalizacionGeocerca": '. $id . '})';
  } else {
    header('HTTP/1.1 500 Internal Server Error');
    print_r($_REQUEST);
    print_r($datosGeolocalizacion);
    print_r($id);
  }
}

// Geocerca delete
function rmRegistrarGeolocalizacionGeocercaDelete($conex) {
  $url = $conex['url'];
  $db = $conex['db'];
  $username = $conex['username'];
  $password = $conex['password'];

  $datosGeolocalizacion =
  array(
    array(
      intval($_REQUEST['geocerca_id'])
    )
  );

  $uid = login($conex);
  $models = ripcord::client("$url/xmlrpc/2/object");
  $id = $models->execute_kw($db, $uid, $password,'rm.geocerca', 'unlink',$datosGeolocalizacion);
  // $id = $models->execute_kw($db, $uid, $password, 'rm.geocerca', 'create', $datosGeolocalizacion);
  // echo $_GET['callback'].'({"status":"success"})';

  if ($id) {
    echo $_GET['callback'].'({"rmRegistrarGeolocalizacionGeocerca": '. $id . '})';
  } else {
    print_r($_REQUEST);
    print_r($datosGeolocalizacion);
    print_r($id);
  }
}

function rmRegistrarGeolocalizacion($conex, $user_id) {
  $url = $conex['url'];
  $db = $conex['db'];
  $username = $conex['username'];
  $password = $conex['password'];

  $datosGeolocalizacion =
  array(
    array(
      'res_user_id' => intval($_REQUEST['res_user_id']),
      'rm_bearing' => ($_REQUEST['rm_bearing']),
      'rm_longitude' => ($_REQUEST['longitude']),
      'rm_latitude' => ($_REQUEST['latitude']),
    )
  );

  $uid = login($conex);
  $models = ripcord::client("$url/xmlrpc/2/object");
  $id = $models->execute_kw($db, $uid, $password, 'rm.geolocalizacion', 'create', $datosGeolocalizacion);

  if (Is_Numeric ($id)) {
    echo $_GET['callback'].'({"rmRegistrarGeolocalizacion": '. $id . '})';
  } else {
    print_r($_REQUEST);
    print_r($datosGeolocalizacion);
    print_r($id);
  }
}

function rmListaGeolocalizacionLive ($db) {
    try {
        $mapaVendedorDaterange1 = $_REQUEST['mapaVendedorDaterange1'];
        $mapaVendedorDaterange2 = $_REQUEST['mapaVendedorDaterange2'];

        if ($mapaVendedorDaterange1 && $mapaVendedorDaterange2) {
          $rango_fechas = " WHERE geoLive.create_date::timestamp::date BETWEEN  to_date('".$mapaVendedorDaterange1."','dd/mm/yyyy') AND to_date('".$mapaVendedorDaterange2."','dd/mm/yyyy') ";
        } else {
          $rango_fechas = " WHERE DATE_PART('Day',now() - geoLive.create_date::timestamptz) < 1 ";
        }

        $sql = "
        SELECT
        res_users.id as user_id,
        res_users.login,
        geoLive.rm_longitude,
        geoLive.rm_latitude,
        geoLive.rm_bearing,
        geoLive.create_date
        FROM
        public.rm_geolocalizacion_live AS geoLive
        INNER JOIN res_users ON res_users.id = geoLive.res_user_id
        ".$rango_fechas."
        ORDER BY res_users.login, geoLive.create_date DESC;

        ";
        $query = pg_query($db, $sql);
        if(!$query){
          echo "Error".pg_last_error($db);
        exit;
        }

        $resultado = pg_fetch_all($query);
        echo $_GET['callback'].'({"rmListaGeolocalizacionLive": ' . json_encode($resultado) . '})';
        pg_close($db);

    } catch(PDOException $e) {
        echo $_GET['callback'].'({"error":{"text":'. pg_last_error($db) .'}})';
        exit;
    }
}

function rmRegistrarGeolocalizacionLive($conex, $user_id) {
  $url = $conex['url'];
  $db = $conex['db'];
  $username = $conex['username'];
  $password = $conex['password'];

  $datosGeolocalizacionLive =
  array(
    array(
      'res_user_id' => intval($_REQUEST['res_user_id']),
      'rm_bearing' => ($_REQUEST['rm_bearing']),
      'rm_longitude' => ($_REQUEST['longitude']),
      'rm_latitude' => ($_REQUEST['latitude']),
    )
  );

  $uid = login($conex);
  $models = ripcord::client("$url/xmlrpc/2/object");
  $id = $models->execute_kw($db, $uid, $password, 'rm.geolocalizacion.live', 'create', $datosGeolocalizacionLive);

  if (Is_Numeric ($id)) {
    echo $_GET['callback'].'({"rmRegistrarGeolocalizacionLive": '. $id . '})';
  } else {
    print_r($_REQUEST);
    print_r($datosGeolocalizacionLive);
    print_r($id);
  }
}

?>
